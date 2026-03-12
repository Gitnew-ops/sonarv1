/**
 * ===========================================
 * SONAR V 1.0 - Configuração de Email SMTP
 * ===========================================
 * 
 * Comunicação Primária - Gratuito e Ilimitado
 * Servidor: mail.mts-angola.com | Porta: 465 (SSL/TLS)
 */

export interface EmailAccount {
  name: string;
  role: string;
  email: string;
  password: string;
  description: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
}

// Configuração do servidor SMTP
export const SMTP_CONFIG: SmtpConfig = {
  host: process.env.SMTP_HOST || 'mail.mts-angola.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || true,
};

// Contas corporativas configuradas
export const EMAIL_ACCOUNTS: Record<string, EmailAccount> = {
  mariana: {
    name: 'Mariana',
    role: 'Marketing/CRM',
    email: process.env.SMTP_USER_MARIANA || 'info@mts-angola.com',
    password: process.env.SMTP_PASS_MARIANA || 'mts@2026',
    description: 'Agente de Marketing e CRM - Responsável por campanhas e comunicação com clientes',
  },
  claudia: {
    name: 'Claudia',
    role: 'Comercial/Financeiro',
    email: process.env.SMTP_USER_CLAUDIA || 'accounts@mts-angola.com',
    password: process.env.SMTP_PASS_CLAUDIA || 'mts@2026',
    description: 'Agente Comercial e Financeiro - Responsável por propostas e faturação',
  },
  pedro: {
    name: 'Pedro',
    role: 'Operações/Inteligência',
    email: process.env.SMTP_USER_PEDRO || 'supply.chain@mts-angola.com',
    password: process.env.SMTP_PASS_PEDRO || 'mts@2026',
    description: 'Agente de Operações e Inteligência - Responsável por discovery e análise',
  },
  gestor: {
    name: 'Gestor Humano',
    role: 'Gestor de Operações',
    email: process.env.SMTP_USER_GESTOR || 'ops.manager@mts-angola.com',
    password: process.env.SMTP_PASS_GESTOR || 'Abencoado@2026',
    description: 'Destinatário de Relatórios - Recebe alertas e relatórios do sistema',
  },
};

/**
 * Mapeamento de agentes para contas de email
 */
export const AGENT_EMAIL_MAPPING = {
  discovery: 'pedro',      // Pedro faz o discovery
  outreach: 'mariana',     // Mariana faz outreach marketing
  commercial: 'claudia',   // Claudia faz contato comercial
  reports: 'gestor',       // Gestor recebe relatórios
} as const;

/**
 * Retorna a configuração de email para um agente específico
 */
export function getEmailConfigForAgent(agentKey: keyof typeof AGENT_EMAIL_MAPPING): EmailAccount {
  const accountKey = AGENT_EMAIL_MAPPING[agentKey];
  return EMAIL_ACCOUNTS[accountKey];
}

/**
 * Valida se as credenciais SMTP estão configuradas
 */
export function validateSmtpConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!SMTP_CONFIG.host) missing.push('SMTP_HOST');
  if (!SMTP_CONFIG.port) missing.push('SMTP_PORT');
  
  // Verificar pelo menos uma conta com senha
  const hasValidAccount = Object.values(EMAIL_ACCOUNTS).some(acc => acc.password);
  if (!hasValidAccount) {
    missing.push('SMTP_PASS_* (nenhuma senha de email configurada)');
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Status do sistema de email
 */
export function getEmailSystemStatus() {
  const validation = validateSmtpConfig();
  return {
    configured: validation.valid,
    server: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    accounts: Object.keys(EMAIL_ACCOUNTS).length,
    missingCredentials: validation.missing,
  };
}

/**
 * Verifica se todas as contas têm senhas configuradas
 */
export function checkAllAccountsConfigured(): { 
  allConfigured: boolean; 
  accounts: Record<string, { email: string; hasPassword: boolean }> 
} {
  const accounts: Record<string, { email: string; hasPassword: boolean }> = {};
  
  Object.entries(EMAIL_ACCOUNTS).forEach(([key, account]) => {
    accounts[key] = {
      email: account.email,
      hasPassword: !!account.password,
    };
  });
  
  return {
    allConfigured: Object.values(accounts).every(a => a.hasPassword),
    accounts,
  };
}
