/**
 * ===========================================
 * SONAR V 1.0 - Serviço de WhatsApp (Twilio)
 * ===========================================
 * 
 * ⚠️ CANAL PAGO - Usar APENAS para alertas críticos
 * 
 * Regra de Ouro: Somente notificar o Gestor para:
 * - Leads com score > 80
 * - Respostas positivas de clientes
 * - Erros críticos do sistema
 */

import { TWILIO_CONFIG, formatAlertMessage, shouldSendWhatsappAlert, canSendWhatsapp, incrementWhatsappCount, type AlertType } from './twilio-config';

// Tipos
export interface WhatsAppResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  costWarning?: string;
}

/**
 * Envia uma mensagem de WhatsApp via Twilio
 */
export async function sendWhatsAppMessage(message: string): Promise<WhatsAppResult> {
  try {
    // Verificar se podemos enviar (limite diário)
    if (!canSendWhatsapp()) {
      return {
        success: false,
        error: 'Limite diário de mensagens WhatsApp atingido',
        costWarning: '⚠️ Economize créditos - use com moderação',
      };
    }
    
    // Verificar configuração
    if (!TWILIO_CONFIG.accountSid || !TWILIO_CONFIG.authToken) {
      return {
        success: false,
        error: 'Twilio não configurado',
      };
    }
    
    // Formatar número para WhatsApp
    const from = `whatsapp:${TWILIO_CONFIG.whatsappFrom}`;
    const to = `whatsapp:${TWILIO_CONFIG.whatsappTo}`;
    
    // Enviar via API do Twilio
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(
            `${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`
          ).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: from,
          To: to,
          Body: message,
        }),
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro Twilio:', data);
      return {
        success: false,
        error: data.message || 'Erro ao enviar mensagem',
      };
    }
    
    // Incrementar contador
    incrementWhatsappCount();
    
    console.log(`✅ WhatsApp enviado: ${data.sid}`);
    
    return {
      success: true,
      messageSid: data.sid,
      costWarning: '⚠️ Mensagem WhatsApp enviada (CUSTO: PAGO)',
    };
  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Envia um alerta formatado via WhatsApp
 */
export async function sendAlert(
  alertType: AlertType,
  data: Record<string, string | number>
): Promise<WhatsAppResult> {
  // Verificar se este tipo de alerta deve ir via WhatsApp
  if (!shouldSendWhatsappAlert(alertType)) {
    return {
      success: false,
      error: `Alertas do tipo ${alertType} não são enviados via WhatsApp (configurado para email apenas)`,
    };
  }
  
  const message = formatAlertMessage(alertType, data);
  return sendWhatsAppMessage(message);
}

/**
 * Envia alerta de novo lead qualificado (score > 80)
 */
export async function alertHighScoreLead(
  companyName: string,
  score: number,
  companyType: string,
  country: string,
  notes: string,
  link: string
): Promise<WhatsAppResult> {
  return sendAlert('HIGH_SCORE_LEAD', {
    company_name: companyName,
    score,
    company_type: companyType,
    country,
    notes,
    link,
  });
}

/**
 * Envia alerta de resposta positiva de cliente
 */
export async function alertPositiveResponse(
  companyName: string,
  email: string,
  serviceType: string,
  message: string,
  link: string
): Promise<WhatsAppResult> {
  return sendAlert('POSITIVE_RESPONSE', {
    company_name: companyName,
    email,
    service_type: serviceType,
    message,
    link,
  });
}

/**
 * Envia alerta de erro crítico do sistema
 */
export async function alertSystemError(
  errorType: string,
  errorMessage: string
): Promise<WhatsAppResult> {
  return sendAlert('SYSTEM_ERROR', {
    error_type: errorType,
    error_message: errorMessage,
    timestamp: new Date().toLocaleString('pt-AO'),
  });
}

/**
 * Testa a conexão com Twilio
 */
export async function testTwilioConnection(): Promise<{ 
  success: boolean; 
  message: string 
}> {
  try {
    if (!TWILIO_CONFIG.accountSid || !TWILIO_CONFIG.authToken) {
      return {
        success: false,
        message: '❌ Twilio não configurado - verifique as credenciais no .env',
      };
    }
    
    // Testar com uma chamada simples à API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_CONFIG.accountSid}.json`,
      {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(
            `${TWILIO_CONFIG.accountSid}:${TWILIO_CONFIG.authToken}`
          ).toString('base64'),
        },
      }
    );
    
    if (response.ok) {
      return {
        success: true,
        message: '✅ Conexão Twilio estabelecida com sucesso!',
      };
    } else {
      return {
        success: false,
        message: '❌ Credenciais Twilio inválidas',
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `❌ Erro na conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Status do serviço WhatsApp
 */
export function getWhatsAppStatus() {
  return {
    configured: !!(TWILIO_CONFIG.accountSid && TWILIO_CONFIG.authToken),
    botNumber: TWILIO_CONFIG.whatsappFrom,
    recipientNumber: TWILIO_CONFIG.whatsappTo,
    costWarning: '⚠️ WhatsApp é um canal PAGO - Use apenas para alertas críticos',
    allowedAlerts: ['HIGH_SCORE_LEAD', 'POSITIVE_RESPONSE', 'SYSTEM_ERROR'],
  };
}
