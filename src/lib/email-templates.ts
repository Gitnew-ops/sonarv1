/**
 * Email Templates System for Sonar V 1.0
 * All templates in Portuguese for maritime companies in Angola
 */

export interface EmailTemplate {
  id: string;
  name: string;
  serviceType: string;
  subject: string;
  body: string;
  variables: string[];
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'template-1',
    name: 'Apresentação Geral de Serviços',
    serviceType: 'GENERAL',
    subject: 'Proposta de Parceria - Serviços Marítimos em Angola | {company_name}',
    body: `Prezados Senhores da {company_name},

Esperamos que esta mensagem o encontre bem.

Somos uma empresa líder em serviços marítimos em Angola, oferecendo soluções completas para o sector naval. As nossas áreas de actuação incluem:

• Mergulho Comercial - Inspeção subaquática, reparos em casco e limpeza de hélices
• Shipchandler - Abastecimento completo de navios, provisões e equipamentos náuticos
• Gestão de Resíduos - Descarte ambiental conforme normas MARPOL
• Bunker MGO - Fornecimento de combustível marítimo de alta qualidade

Gostaríamos de agendar uma reunião para apresentar as nossas soluções e discutir como podemos apoiar as operações da vossa empresa nos portos angolanos.

Estamos disponíveis para uma chamada ou reunião presencial em Luanda.

Com os melhores cumprimentos,

Equipa Comercial
Serviços Marítimos Angola`,
    variables: ['company_name']
  },
  {
    id: 'template-2',
    name: 'Mergulho Comercial',
    serviceType: 'DIVING',
    subject: 'Serviços de Mergulho Comercial - Inspeção e Manutenção Subaquática | {company_name}',
    body: `Prezados Senhores da {company_name},

Contactamos a vossa empresa para apresentar os nossos serviços especializados em mergulho comercial para navios em portos angolanos.

Os nossos serviços incluem:

• Inspeção subaquática de cascos
• Reparos e manutenção em casco
• Limpeza de hélices e lemes
• Remoção de incrustações
• Inspeção de válvulas e tomadas de água
• Relatórios fotográficos e vídeo

Nossa equipa é certificada e opera em conformidade com as normas internacionais de segurança. Dispomos de equipamentos modernos e experiência comprovada em todos os principais portos de Angola.

Benefícios para {company_name}:
- Redução de tempo de inactividade
- Relatórios detalhados para documentação
- Conformidade com requisitos de seguradora
- Atendimento 24/7

Gostaríamos de apresentar uma proposta personalizada para as necessidades específicas do vosso navio {vessel_name}.

Agendemos uma conversa?

Com os melhores cumprimentos,

Equipa de Mergulho Comercial
Serviços Marítimos Angola`,
    variables: ['company_name', 'vessel_name']
  },
  {
    id: 'template-3',
    name: 'Shipchandler',
    serviceType: 'SHIPCHANDLER',
    subject: 'Abastecimento de Navios - Provisões e Equipamentos | {company_name}',
    body: `Prezados Senhores da {company_name},

Somos fornecedores autorizados de provisões e equipamentos para navios em todos os portos angolanos, oferecendo um serviço de shipchandler completo e fiável.

Os nossos produtos e serviços:

• Provisões de padaria e talho
• Produtos alimentares frescos e congelados
• Bebidas e produtos de consumo
• Equipamentos náuticos e de segurança
• Materiais de limpeza e higiene
• Cabos, correntes e ferragens
• Uniformes e equipamentos de trabalho

Porquê escolher-nos:
- Entrega directa ao navio
- Preços competitivos
- Produtos de qualidade certificada
- Atendimento personalizado
- Disponibilidade 24 horas

Para o navio {vessel_name}, podemos preparar uma lista de provisões personalizada conforme as vossas necessidades específicas.

Solicite já um orçamento sem compromisso.

Com os melhores cumprimentos,

Equipa de Shipchandler
Serviços Marítimos Angola`,
    variables: ['company_name', 'vessel_name']
  },
  {
    id: 'template-4',
    name: 'Waste Management',
    serviceType: 'WASTE',
    subject: 'Gestão de Resíduos Marítimos - Conformidade MARPOL | {company_name}',
    body: `Prezados Senhores da {company_name},

Oferecemos serviços completos de gestão de resíduos marítimos, garantindo total conformidade com as normas MARPOL e a legislação ambiental angolana.

Os nossos serviços incluem:

• Recolha de águas residuais (águas negras e cinzas)
• Gestão de lixo sólido do navio
• Tratamento de resíduos oleosos
• Recolha de resíduos perigosos
• Certificados de descarte para documentação
• Consultoria ambiental

Cumprimos rigorosamente:
- Convenção MARPOL 73/78
- Regulamentos da IMO
- Legislação ambiental angolana
- Normas portuárias locais

Benefícios para {company_name}:
- Evite multas e sanções
- Documentação completa para auditorias
- Responsabilidade ambiental demonstrada
- Processo simplificado e rápido

Para o navio {vessel_name}, podemos providenciar um plano de gestão de resíduos personalizado.

Contacte-nos para mais informações.

Com os melhores cumprimentos,

Equipa de Gestão de Resíduos
Serviços Marítimos Angola`,
    variables: ['company_name', 'vessel_name']
  },
  {
    id: 'template-5',
    name: 'Bunker MGO',
    serviceType: 'BUNKER',
    subject: 'Fornecimento de Combustível Marítimo MGO | {company_name}',
    body: `Prezados Senhores da {company_name},

Somos fornecedores de combustível marítimo (Gasóleo Marítimo - MGO) de alta qualidade para navios em portos angolanos.

Características do nosso combustível:

• Gasóleo Marítimo (MGO) conforme especificações ISO 8217
• Baixo teor de enxofre (conforme IMO 2020)
• Qualidade certificada com análise laboratorial
• Disponibilidade imediata nos principais portos

Nossos serviços de bunkering:

- Entrega por barcaça ou camião cisterna
- Operações 24/7
- Medições precisas e transparentes
- Documentação completa (Bunker Delivery Note)
- Preços competitivos e condições flexíveis
- Assistência técnica durante a operação

Portos atendidos:
• Luanda
• Lobito
• Namibe
• Cabinda
• Soyo

Para o navio {vessel_name}, podemos preparar uma proposta de fornecimento com as quantidades necessárias e melhor data para operação.

Solicite uma cotação sem compromisso.

Com os melhores cumprimentos,

Equipa de Bunker
Serviços Marítimos Angola`,
    variables: ['company_name', 'vessel_name']
  }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find(template => template.id === id);
}

/**
 * Get templates by service type
 */
export function getTemplatesByServiceType(serviceType: string): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter(template => 
    template.serviceType === serviceType || template.serviceType === 'GENERAL'
  );
}

/**
 * Replace template variables with actual values
 */
export function processTemplate(
  template: EmailTemplate,
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    body = body.replace(new RegExp(placeholder, 'g'), value);
  }

  // Replace any remaining placeholders with default values
  subject = subject.replace(/\{([^}]+)\}/g, (_, key) => `[${key}]`);
  body = body.replace(/\{([^}]+)\}/g, (_, key) => `[${key}]`);

  return { subject, body };
}

/**
 * Get all available service types
 */
export const SERVICE_TYPES = [
  { value: 'GENERAL', label: 'Apresentação Geral' },
  { value: 'DIVING', label: 'Mergulho Comercial' },
  { value: 'SHIPCHANDLER', label: 'Shipchandler' },
  { value: 'WASTE', label: 'Gestão de Resíduos' },
  { value: 'BUNKER', label: 'Bunker MGO' }
] as const;

/**
 * Get service type label
 */
export function getServiceTypeLabel(serviceType: string): string {
  const service = SERVICE_TYPES.find(s => s.value === serviceType);
  return service?.label || serviceType;
}
