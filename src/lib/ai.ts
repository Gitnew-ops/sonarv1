import ZAI from 'z-ai-web-dev-sdk';

// Types for AI functions
export interface CompanySearchResult {
  name: string;
  website?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  type: 'SHIPPOWNER' | 'ARMADOR' | 'BROKER' | 'AGENT';
  snippet?: string;
  source?: string;
}

export interface LeadScore {
  score: number;
  factors: string[];
  recommendation: string;
}

export interface EmailContent {
  subject: string;
  body: string;
}

/**
 * Search for maritime companies using web search
 */
export async function searchMaritimeCompanies(query: string): Promise<CompanySearchResult[]> {
  try {
    const zai = await ZAI.create();
    
    const searchResult = await zai.functions.invoke("web_search", {
      query: query,
      num: 10
    });

    if (!searchResult || !Array.isArray(searchResult)) {
      return [];
    }

    // Process and structure results
    const companies: CompanySearchResult[] = searchResult.map((result: any) => {
      // Determine company type based on query and snippet
      const snippet = result.snippet || '';
      const name = result.name || 'Empresa Desconhecida';
      
      let type: 'SHIPPOWNER' | 'ARMADOR' | 'BROKER' | 'AGENT' = 'SHIPPOWNER';
      
      if (snippet.toLowerCase().includes('armador') || name.toLowerCase().includes('armador')) {
        type = 'ARMADOR';
      } else if (snippet.toLowerCase().includes('broker') || snippet.toLowerCase().includes('corretor')) {
        type = 'BROKER';
      } else if (snippet.toLowerCase().includes('agente') || snippet.toLowerCase().includes('agent')) {
        type = 'AGENT';
      }

      // Extract email if present in snippet
      const emailMatch = snippet.match(/[\w.-]+@[\w.-]+\.\w+/);
      const email = emailMatch ? emailMatch[0] : undefined;

      // Extract phone if present
      const phoneMatch = snippet.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/);
      const phone = phoneMatch ? phoneMatch[0] : undefined;

      return {
        name,
        website: result.url,
        email,
        phone,
        country: 'Angola',
        city: snippet.toLowerCase().includes('luanda') ? 'Luanda' : undefined,
        type,
        snippet: snippet.substring(0, 500),
        source: result.url
      };
    });

    // Filter out duplicates based on name similarity
    const uniqueCompanies = companies.filter((company, index, self) =>
      index === self.findIndex((c) => 
        c.name.toLowerCase().trim() === company.name.toLowerCase().trim()
      )
    );

    return uniqueCompanies;
  } catch (error: any) {
    console.error('Erro na busca de empresas:', error.message);
    throw new Error(`Falha na busca: ${error.message}`);
  }
}

/**
 * Generate personalized email content using AI
 */
export async function generateEmailContent(
  companyName: string,
  serviceType: string,
  additionalContext?: string
): Promise<EmailContent> {
  try {
    const zai = await ZAI.create();

    const serviceDescriptions: Record<string, string> = {
      DIVING: 'Mergulho Comercial - Inspeção subaquática, reparos em casco, limpeza de hélices',
      SHIPCHANDLER: 'Shipchandler - Abastecimento de navios, provisões, equipamentos náuticos',
      WASTE: 'Waste Management - Gestão de resíduos, descarte ambiental conforme MARPOL',
      BUNKER: 'Bunker MGO - Fornecimento de combustível marítimo (Gasóleo Marítimo)'
    };

    const serviceDesc = serviceDescriptions[serviceType] || serviceType;

    const prompt = `Você é um especialista em vendas B2B para o setor marítimo em Angola.
Gere um email profissional e personalizado em PORTUGUÊS para a empresa "${companyName}".

Serviço a oferecer: ${serviceDesc}

Contexto adicional: ${additionalContext || 'Primeiro contato comercial'}

O email deve:
1. Ser profissional mas cordial
2. Demonstrar conhecimento do setor marítimo angolano
3. Destacar benefícios específicos do serviço
4. Incluir uma call-to-action clara
5. Ter no máximo 3 parágrafos

Responda APENAS no formato JSON:
{
  "subject": "Assunto do email",
  "body": "Corpo do email"
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em comunicação comercial para o setor marítimo. Responda sempre em português de Angola.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Resposta vazia do modelo de IA');
    }

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          subject: parsed.subject || 'Proposta de Parceria - Serviços Marítimos',
          body: parsed.body || content
        };
      }
    } catch {
      // If JSON parsing fails, use the content as body
    }

    return {
      subject: `Proposta de Parceria - ${serviceDesc.split(' - ')[0]}`,
      body: content
    };
  } catch (error: any) {
    console.error('Erro na geração de email:', error.message);
    throw new Error(`Falha na geração: ${error.message}`);
  }
}

/**
 * Score and qualify a lead using AI
 */
export async function scoreLead(companyData: {
  name: string;
  type: string;
  website?: string;
  email?: string;
  phone?: string;
  snippet?: string;
}): Promise<LeadScore> {
  try {
    const zai = await ZAI.create();

    const prompt = `Analise esta empresa do setor marítimo e atribua uma pontuação de lead (0-100):

Empresa: ${companyData.name}
Tipo: ${companyData.type}
Website: ${companyData.website || 'Não informado'}
Email: ${companyData.email || 'Não informado'}
Telefone: ${companyData.phone || 'Não informado'}
Contexto: ${companyData.snippet || 'Sem informações adicionais'}

Critérios de pontuação:
- Presença de contactos directos (+20)
- Empresa activa no mercado angolano (+15)
- Tipo de empresa (Armador/Shipowner = +20, Broker = +15, Agent = +10)
- Website funcional (+10)
- Contactos completos (+15)
- Indícios de operações recentes (+10)
- Conformidade regulatória mencionada (+10)

Responda APENAS no formato JSON:
{
  "score": <número de 0 a 100>,
  "factors": ["fator1", "fator2", ...],
  "recommendation": "recomendação de acção"
}`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de leads B2B para o setor marítimo. Responda sempre em português.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      return calculateBasicScore(companyData);
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(100, Math.max(0, parsed.score || 0)),
          factors: parsed.factors || [],
          recommendation: parsed.recommendation || 'Prosseguir com contacto'
        };
      }
    } catch {
      // Fall back to basic scoring
    }

    return calculateBasicScore(companyData);
  } catch (error: any) {
    console.error('Erro na pontuação do lead:', error.message);
    return calculateBasicScore(companyData);
  }
}

/**
 * Calculate basic score without AI (fallback)
 */
function calculateBasicScore(companyData: {
  name: string;
  type: string;
  website?: string;
  email?: string;
  phone?: string;
}): LeadScore {
  let score = 30; // Base score
  const factors: string[] = [];

  if (companyData.email) {
    score += 20;
    factors.push('Email disponível');
  }

  if (companyData.phone) {
    score += 15;
    factors.push('Telefone disponível');
  }

  if (companyData.website) {
    score += 10;
    factors.push('Website identificado');
  }

  const typeScores: Record<string, number> = {
    SHIPOWNER: 20,
    ARMADOR: 20,
    BROKER: 15,
    AGENT: 10
  };

  const typeBonus = typeScores[companyData.type] || 5;
  score += typeBonus;
  factors.push(`Tipo: ${companyData.type}`);

  if (!companyData.email && !companyData.phone) {
    factors.push('Contactos incompletos - requer investigação');
  }

  let recommendation = 'Prosseguir com contacto';
  if (score >= 70) {
    recommendation = 'Lead qualificado - priorizar contacto imediato';
  } else if (score >= 50) {
    recommendation = 'Lead promissor - recolher mais informações';
  } else {
    recommendation = 'Lead inicial - investigar antes de contactar';
  }

  return {
    score: Math.min(100, score),
    factors,
    recommendation
  };
}

/**
 * Generate a summary for reports using AI
 */
export async function generateReportSummary(data: {
  type: string;
  leadsCount?: number;
  emailsSent?: number;
  openRate?: number;
  responseRate?: number;
  topCompanies?: string[];
  period?: string;
}): Promise<string> {
  try {
    const zai = await ZAI.create();

    const prompt = `Gere um resumo executivo em PORTUGUÊS para um relatório ${data.type}:

Dados:
- Total de leads: ${data.leadsCount || 0}
- Emails enviados: ${data.emailsSent || 0}
- Taxa de abertura: ${data.openRate || 0}%
- Taxa de resposta: ${data.responseRate || 0}%
- Período: ${data.period || 'Não especificado'}
- Top empresas: ${data.topCompanies?.join(', ') || 'N/A'}

O resumo deve:
1. Ser conciso (máximo 150 palavras)
2. Destacar insights principais
3. Sugerir próximas acções
4. Usar linguagem profissional`;

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Você é um analista de negócios especializado em relatórios executivos. Responda sempre em português de forma profissional.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    const content = completion.choices[0]?.message?.content;
    return content || 'Relatório gerado com sucesso.';
  } catch (error: any) {
    console.error('Erro na geração do relatório:', error.message);
    return `Relatório ${data.type} - ${data.leadsCount} leads identificados, ${data.emailsSent} emails enviados.`;
  }
}

/**
 * Analyze company data from web content
 */
export async function analyzeCompanyFromUrl(url: string): Promise<{
  description: string;
  services: string[];
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };
}> {
  try {
    const zai = await ZAI.create();

    // First, try to read the web page
    const webContent = await zai.functions.invoke("web_reader", {
      url: url
    });

    const content = typeof webContent === 'string' ? webContent : JSON.stringify(webContent);

    // Then use AI to extract structured information
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Extraia informações estruturadas de conteúdo web de empresas marítimas. Responda em português.'
        },
        {
          role: 'user',
          content: `Analise este conteúdo e extraia:
1. Descrição da empresa
2. Lista de serviços oferecidos
3. Informações de contacto

Conteúdo: ${content.substring(0, 2000)}

Responda em JSON:
{
  "description": "descrição",
  "services": ["serviço1", "serviço2"],
  "contactInfo": {
    "email": "email se encontrado",
    "phone": "telefone se encontrado",
    "address": "endereço se encontrado"
  }
}`
        }
      ],
      temperature: 0.2,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;
    
    if (response) {
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Return defaults
      }
    }

    return {
      description: 'Empresa do sector marítimo',
      services: [],
      contactInfo: {}
    };
  } catch (error: any) {
    console.error('Erro na análise da empresa:', error.message);
    return {
      description: 'Empresa do sector marítimo',
      services: [],
      contactInfo: {}
    };
  }
}
