/**
 * ===========================================
 * SONAR V 1.0 - Configuração Twilio WhatsApp
 * ===========================================
 * 
 * Canal Secundário - APENAS para Alertas Críticos
 * CUSTO: PAGO - Usar com moderação
 * 
 * Regra de Ouro: SOMENTE notificar o Gestor para:
 * - Novos leads qualificados com score > 80
 * - Respostas positivas de clientes potenciais
 * - Erros críticos do sistema
 */

// Configuração do Twilio
export const TWILIO_CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || '+18573825373',
  whatsappTo: process.env.TWILIO_WHATSAPP_TO || '+244923473361',
};

// Tipos de alerta permitidos
export type AlertType = 
  | 'HIGH_SCORE_LEAD'      // Lead com score > 80
  | 'POSITIVE_RESPONSE'    // Resposta positiva de cliente
  | 'SYSTEM_ERROR'         // Erro crítico do sistema
  | 'CAMPAIGN_COMPLETE'    // Campanha concluída
  | 'DAILY_SUMMARY';       // Resumo diário (opcional)

// Configuração de cada tipo de alerta
export interface AlertConfig {
  type: AlertType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  sendWhatsapp: boolean;
  sendEmail: boolean;
  template: string;
}

// Configurações de alerta
export const ALERT_CONFIGS: Record<AlertType, AlertConfig> = {
  HIGH_SCORE_LEAD: {
    type: 'HIGH_SCORE_LEAD',
    priority: 'HIGH',
    sendWhatsapp: true,
    sendEmail: true,
    template: `🎯 *NOVO LEAD QUALIFICADO*

Empresa: {company_name}
Score: {score}/100
Tipo: {company_type}
País: {country}

{notes}

🔗 Ver detalhes: {link}`,
  },
  POSITIVE_RESPONSE: {
    type: 'POSITIVE_RESPONSE',
    priority: 'HIGH',
    sendWhatsapp: true,
    sendEmail: true,
    template: `✅ *RESPOSTA POSITIVA!*

Empresa: {company_name}
Email: {email}
Tipo de Interesse: {service_type}

Mensagem:
{message}

🔗 Responder: {link}`,
  },
  SYSTEM_ERROR: {
    type: 'SYSTEM_ERROR',
    priority: 'HIGH',
    sendWhatsapp: true,
    sendEmail: true,
    template: `⚠️ *ERRO NO SISTEMA*

Tipo: {error_type}
Mensagem: {error_message}
Timestamp: {timestamp}

Verificar urgentemente.`,
  },
  CAMPAIGN_COMPLETE: {
    type: 'CAMPAIGN_COMPLETE',
    priority: 'MEDIUM',
    sendWhatsapp: false, // Apenas email para não lotar WhatsApp
    sendEmail: true,
    template: `📊 *CAMPANHA CONCLUÍDA*

Campanha: {campaign_name}
Emails Enviados: {emails_sent}
Taxa de Abertura: {open_rate}%
Respostas: {replies}

🔗 Ver relatório: {link}`,
  },
  DAILY_SUMMARY: {
    type: 'DAILY_SUMMARY',
    priority: 'LOW',
    sendWhatsapp: false, // Apenas email
    sendEmail: true,
    template: `📅 *RESUMO DIÁRIO - {date}*

Leads Descobertos: {leads_count}
Emails Enviados: {emails_sent}
Respostas: {replies}
Campanhas Ativas: {active_campaigns}

🔗 Dashboard: {link}`,
  },
};

/**
 * Valida se o Twilio está configurado
 */
export function validateTwilioConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!TWILIO_CONFIG.accountSid) missing.push('TWILIO_ACCOUNT_SID');
  if (!TWILIO_CONFIG.authToken) missing.push('TWILIO_AUTH_TOKEN');
  if (!TWILIO_CONFIG.whatsappFrom) missing.push('TWILIO_WHATSAPP_FROM');
  if (!TWILIO_CONFIG.whatsappTo) missing.push('TWILIO_WHATSAPP_TO');
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Verifica se um alerta deve ser enviado via WhatsApp
 */
export function shouldSendWhatsappAlert(alertType: AlertType): boolean {
  const config = ALERT_CONFIGS[alertType];
  return config.sendWhatsapp && config.priority === 'HIGH';
}

/**
 * Formata uma mensagem de alerta
 */
export function formatAlertMessage(
  alertType: AlertType, 
  data: Record<string, string | number>
): string {
  const config = ALERT_CONFIGS[alertType];
  let message = config.template;
  
  // Substituir placeholders
  Object.entries(data).forEach(([key, value]) => {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  
  return message;
}

/**
 * Status do sistema de alertas
 */
export function getAlertSystemStatus() {
  const validation = validateTwilioConfig();
  return {
    twilioConfigured: validation.valid,
    whatsappEnabled: validation.valid,
    recipientPhone: TWILIO_CONFIG.whatsappTo,
    botNumber: TWILIO_CONFIG.whatsappFrom,
    missingCredentials: validation.missing,
    costWarning: '⚠️ WhatsApp é um canal PAGO. Use apenas para alertas críticos.',
  };
}

/**
 * Contador de mensagens WhatsApp enviadas (para controle de custo)
 */
let whatsappMessageCount = 0;
const MAX_DAILY_WHATSAPP = 10; // Limite diário

export function canSendWhatsapp(): boolean {
  return whatsappMessageCount < MAX_DAILY_WHATSAPP;
}

export function incrementWhatsappCount(): void {
  whatsappMessageCount++;
}

export function resetWhatsappCount(): void {
  whatsappMessageCount = 0;
}

export function getWhatsappUsage(): { used: number; limit: number; remaining: number } {
  return {
    used: whatsappMessageCount,
    limit: MAX_DAILY_WHATSAPP,
    remaining: MAX_DAILY_WHATSAPP - whatsappMessageCount,
  };
}
