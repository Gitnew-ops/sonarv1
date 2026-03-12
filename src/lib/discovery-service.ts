/**
 * ===========================================
 * SONAR V 1.0 - Serviço de Discovery
 * ===========================================
 * 
 * Motor de descoberta de empresas marítimas
 * Usa AI para buscar, qualificar e salvar leads
 */

import { db } from './db';
import { searchMaritimeCompanies, scoreLead, type CompanySearchResult } from './ai';

// Tipos
export interface DiscoveryResult {
  totalFound: number;
  newCompanies: number;
  duplicates: number;
  errors: string[];
  companies: DiscoveredCompany[];
}

export interface DiscoveredCompany {
  id?: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  website?: string;
  score: number;
  snippet?: string;
}

// Queries de busca para empresas marítimas em Angola
const SEARCH_QUERIES = [
  'shipowner Angola Luanda port',
  'shipping company Angola maritime',
  'naval agent Luanda Lobito',
  'armador Angola navios',
  'broker marítimo Angola',
  'agente marítimo Luanda',
  'companhia de navegação Angola',
  'ship management Angola maritime',
  'vessel operator Angola port',
  'maritime services Luanda Angola',
];

/**
 * Log com timestamp
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [DISCOVERY] ${message}`;
  
  if (level === 'error') {
    console.error(logMessage);
  } else if (level === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
}

/**
 * Executa o scan completo de discovery
 */
export async function runDiscoveryScan(): Promise<DiscoveryResult> {
  log('Iniciando scan de discovery...');

  const result: DiscoveryResult = {
    totalFound: 0,
    newCompanies: 0,
    duplicates: 0,
    errors: [],
    companies: [],
  };

  // Processar cada query de busca
  for (const query of SEARCH_QUERIES) {
    try {
      log(`Buscando: "${query}"`);
      
      const companies = await searchMaritimeCompanies(query);
      result.totalFound += companies.length;

      log(`Encontradas ${companies.length} empresas para "${query}"`);

      // Processar e salvar cada empresa
      for (const companyData of companies) {
        try {
          const processedCompany = await processSearchResult(companyData);
          
          if (processedCompany) {
            result.companies.push(processedCompany);
            result.newCompanies++;
          }
        } catch (companyError) {
          const errorMessage = companyError instanceof Error ? companyError.message : 'Erro desconhecido';
          log(`Erro ao processar empresa ${companyData.name}: ${errorMessage}`, 'error');
          result.errors.push(`Erro ao processar ${companyData.name}: ${errorMessage}`);
        }
      }

      // Delay entre buscas para respeitar rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (searchError) {
      const errorMessage = searchError instanceof Error ? searchError.message : 'Erro desconhecido';
      log(`Erro na busca "${query}": ${errorMessage}`, 'error');
      result.errors.push(`Erro na busca "${query}": ${errorMessage}`);
    }
  }

  log(`Discovery concluído: ${result.newCompanies} novas empresas, ${result.duplicates} duplicados`);

  // Registrar execução no banco
  await logDiscoveryRun(result);

  return result;
}

/**
 * Processa um resultado individual de busca
 */
export async function processSearchResult(
  companyData: CompanySearchResult
): Promise<DiscoveredCompany | null> {
  // Verificar duplicados
  const existingCompany = await findDuplicate(companyData);
  
  if (existingCompany) {
    log(`Empresa duplicada encontrada: ${companyData.name}`);
    return null;
  }

  // Calcular score do lead
  const leadScore = await scoreLead(companyData);

  // Salvar no banco
  const company = await db.company.create({
    data: {
      name: companyData.name,
      type: companyData.type,
      email: companyData.email,
      phone: companyData.phone,
      country: companyData.country || 'Angola',
      city: companyData.city,
      website: companyData.website,
      status: 'NEW',
      score: leadScore.score,
      notes: companyData.snippet,
    },
  });

  log(`Nova empresa salva: ${company.name} (Score: ${leadScore.score})`);

  // Notificar se score alto
  if (leadScore.score >= 80) {
    await notifyHighScoreLead(company, leadScore);
  }

  return {
    id: company.id,
    name: company.name,
    type: company.type,
    email: company.email || undefined,
    phone: company.phone || undefined,
    country: company.country || undefined,
    city: company.city || undefined,
    website: company.website || undefined,
    score: company.score,
    snippet: company.notes || undefined,
  };
}

/**
 * Verifica se a empresa já existe no banco (deduplicação)
 */
export async function findDuplicate(
  companyData: CompanySearchResult
): Promise<boolean> {
  // Verificar por nome similar
  const byName = await db.company.findFirst({
    where: {
      name: {
        equals: companyData.name,
        mode: 'insensitive',
      },
    },
  });

  if (byName) return true;

  // Verificar por website
  if (companyData.website) {
    const byWebsite = await db.company.findFirst({
      where: {
        website: companyData.website,
      },
    });

    if (byWebsite) return true;
  }

  // Verificar por email
  if (companyData.email) {
    const byEmail = await db.company.findFirst({
      where: {
        email: companyData.email,
      },
    });

    if (byEmail) return true;
  }

  return false;
}

/**
 * Deduplica uma lista de empresas
 */
export function deduplicateCompanies(
  companies: CompanySearchResult[]
): CompanySearchResult[] {
  const seen = new Set<string>();
  const unique: CompanySearchResult[] = [];

  for (const company of companies) {
    // Criar chave única baseada em nome normalizado
    const normalizedName = company.name.toLowerCase().trim();
    
    if (!seen.has(normalizedName)) {
      seen.add(normalizedName);
      unique.push(company);
    }
  }

  return unique;
}

/**
 * Salva empresas com score no banco
 */
export async function scoreAndSaveCompanies(
  companies: CompanySearchResult[]
): Promise<DiscoveredCompany[]> {
  const saved: DiscoveredCompany[] = [];

  // Deduplicar primeiro
  const unique = deduplicateCompanies(companies);

  for (const companyData of unique) {
    try {
      // Verificar duplicados no banco
      const isDuplicate = await findDuplicate(companyData);
      
      if (isDuplicate) {
        continue;
      }

      // Calcular score
      const leadScore = await scoreLead(companyData);

      // Salvar no banco
      const company = await db.company.create({
        data: {
          name: companyData.name,
          type: companyData.type,
          email: companyData.email,
          phone: companyData.phone,
          country: companyData.country || 'Angola',
          city: companyData.city,
          website: companyData.website,
          status: 'NEW',
          score: leadScore.score,
          notes: companyData.snippet,
        },
      });

      saved.push({
        id: company.id,
        name: company.name,
        type: company.type,
        email: company.email || undefined,
        phone: company.phone || undefined,
        country: company.country || undefined,
        city: company.city || undefined,
        website: company.website || undefined,
        score: company.score,
        snippet: company.notes || undefined,
      });

      // Delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      log(`Erro ao salvar ${companyData.name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    }
  }

  return saved;
}

/**
 * Notifica sobre lead de alto score
 */
async function notifyHighScoreLead(
  company: { id: string; name: string; score: number; email?: string | null },
  leadScore: { score: number; factors: string[]; recommendation: string }
): Promise<void> {
  try {
    // Criar notificação no sistema
    await db.notification.create({
      data: {
        type: 'SUCCESS',
        title: '🎯 Lead de Alto Valor Descoberto!',
        message: `${company.name} foi qualificado com score ${company.score}. ${leadScore.recommendation}`,
        link: `/empresas/${company.id}`,
      },
    });

    log(`Notificação criada para lead de alto score: ${company.name}`);

    // Tentar enviar alerta via WhatsApp (se configurado)
    try {
      const { alertHighScoreLead } = await import('./whatsapp-service');
      await alertHighScoreLead(
        company.name,
        company.score,
        leadScore.factors
      );
    } catch {
      // WhatsApp pode não estar configurado, ignorar erro
      log('WhatsApp não configurado ou indisponível para alerta', 'warn');
    }
  } catch (error) {
    log(`Erro ao notificar lead de alto score: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
  }
}

/**
 * Registra execução do discovery no banco
 */
async function logDiscoveryRun(result: DiscoveryResult): Promise<void> {
  try {
    await db.setting.upsert({
      where: { key: 'last_discovery_scan' },
      create: {
        key: 'last_discovery_scan',
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          totalFound: result.totalFound,
          newCompanies: result.newCompanies,
          duplicates: result.duplicates,
          errorCount: result.errors.length,
        }),
        description: 'Último scan de discovery executado',
      },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          totalFound: result.totalFound,
          newCompanies: result.newCompanies,
          duplicates: result.duplicates,
          errorCount: result.errors.length,
        }),
      },
    });
  } catch (error) {
    log(`Erro ao registrar discovery: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
  }
}

/**
 * Obtém estatísticas de discovery
 */
export async function getDiscoveryStats(): Promise<{
  lastScan: Date | null;
  totalNew: number;
  totalQualified: number;
  averageScore: number;
  topCompanies: { name: string; score: number }[];
}> {
  // Buscar último scan
  const lastScanSetting = await db.setting.findUnique({
    where: { key: 'last_discovery_scan' },
  });

  const lastScan = lastScanSetting
    ? new Date(JSON.parse(lastScanSetting.value).timestamp)
    : null;

  // Contar empresas por status
  const totalNew = await db.company.count({
    where: { status: 'NEW' },
  });

  const totalQualified = await db.company.count({
    where: { status: 'QUALIFIED' },
  });

  // Calcular score médio
  const companies = await db.company.findMany({
    select: { score: true },
  });

  const averageScore = companies.length > 0
    ? Math.round(companies.reduce((sum, c) => sum + c.score, 0) / companies.length)
    : 0;

  // Top empresas por score
  const topCompanies = await db.company.findMany({
    where: {
      score: { gte: 70 },
    },
    select: {
      name: true,
      score: true,
    },
    orderBy: {
      score: 'desc',
    },
    take: 5,
  });

  return {
    lastScan,
    totalNew,
    totalQualified,
    averageScore,
    topCompanies,
  };
}

// Exportar queries para uso externo
export { SEARCH_QUERIES };
