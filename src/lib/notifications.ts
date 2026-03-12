/**
 * ===========================================
 * SONAR V 1.0 - Sistema de Notificações
 * ===========================================
 * 
 * Central de notificações que coordena:
 * - Email (SMTP) - Canal primário
 * - WhatsApp (Twilio) - Canal secundário para alertas críticos
 * 
 * Regra: WhatsApp APENAS para score >= 80, respostas positivas e erros
 */

import { sendEmail, sendAlertToManager, type SendEmailOptions, type EmailResult } from './email-service';
import { 
  alertHighScoreLead, 
  alertPositiveResponse, 
  alertSystemError,
  type WhatsAppResult 
} from './whatsapp-service';
import { EMAIL_ACCOUNTS } from './email-config';
import type { AgentId } from './agents-config';

// Tipos
export interface Company {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  type?: string;
  country?: string | null;
  city?: string | null;
  score?: number | null;
  status?: string;
  notes?: string | null;
}

export interface NotificationResult {
  email?: EmailResult;
  whatsapp?: WhatsAppResult;
  logged: boolean;
  message: string;
}

/**
 * Notifica sobre um novo lead
 * - Email para o gestor sempre
 * - WhatsApp se score >= 80
 */
export async function notifyNewLead(company: Company): Promise<NotificationResult> {
  console.log(`🔔 Notificando novo lead: ${company.name}`);
  console.log(`   Score: ${company.score || 0}`);
  console.log(`   Tipo: ${company.type || 'N/A'}`);
  console.log(`   País: ${company.country || 'N/A'}`);
  
  const result: NotificationResult = {
    logged: true,
    message: '',
  };
  
  // Verificar se score é alto (>= 80) para WhatsApp
  const score = company.score || 0;
  const isHighScore = score >= 80;
  
  if (isHighScore) {
    console.log(`🎯 Lead qualificado! Score ${score} >= 80. Enviando alerta WhatsApp...`);
    
    // Enviar alerta WhatsApp
    const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/empresas?id=${company.id}`;
    
    result.whatsapp = await alertHighScoreLead(
      company.name,
      score,
      company.type || 'Empresa',
      company.country || 'Não informado',
      company.notes || 'Sem observações',
      link
    );
    
    if (result.whatsapp.success) {
      console.log(`✅ Alerta WhatsApp enviado para lead qualificado`);
    } else {
      console.warn(`⚠️ Falha no WhatsApp: ${result.whatsapp.error}`);
    }
  }
  
  // Enviar email para o gestor (sempre)
  try {
    const emailHtml = generateNewLeadEmailHtml(company, isHighScore);
    
    result.email = await sendEmail({
      to: EMAIL_ACCOUNTS.gestor.email,
      subject: `${isHighScore ? '🎯' : '📋'} Novo Lead: ${company.name} ${isHighScore ? `(Score: ${score})` : ''}`,
      html: emailHtml,
      from: 'pedro', // Pedro é o agente de inteligência/descoberta
    });
    
    if (result.email.success) {
      console.log(`✅ Email de notificação enviado ao gestor`);
    } else {
      console.warn(`⚠️ Falha no email: ${result.email.error}`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email de notificação:', error);
    result.email = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
  
  result.message = isHighScore 
    ? `Lead qualificado notificado via Email e WhatsApp`
    : `Lead notificado via Email`;
  
  return result;
}

/**
 * Notifica sobre email enviado
 * - Apenas log (não há necessidade de notificar externamente)
 */
export function notifyEmailSent(
  emailId: string,
  company: string,
  to: string,
  subject: string,
  agent: AgentId
): void {
  console.log(`📧 Email enviado e registrado:`);
  console.log(`   ID: ${emailId}`);
  console.log(`   Empresa: ${company}`);
  console.log(`   Para: ${to}`);
  console.log(`   Assunto: ${subject}`);
  console.log(`   Agente: ${agent}`);
}

/**
 * Notifica sobre resposta positiva de cliente
 * - Email para o gestor
 * - WhatsApp (ALERTA ALTO)
 */
export async function notifyPositiveResponse(
  company: Company,
  serviceType: string,
  message: string
): Promise<NotificationResult> {
  console.log(`🎉 Resposta positiva recebida de: ${company.name}`);
  console.log(`   Email: ${company.email}`);
  console.log(`   Serviço: ${serviceType}`);
  
  const result: NotificationResult = {
    logged: true,
    message: '',
  };
  
  const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/empresas?id=${company.id}`;
  
  // Enviar alerta WhatsApp (ALTA PRIORIDADE)
  result.whatsapp = await alertPositiveResponse(
    company.name,
    company.email || 'Não informado',
    serviceType,
    message,
    link
  );
  
  if (result.whatsapp.success) {
    console.log(`✅ Alerta WhatsApp enviado para resposta positiva`);
  } else {
    console.warn(`⚠️ Falha no WhatsApp: ${result.whatsapp.error}`);
  }
  
  // Enviar email para o gestor
  try {
    const emailHtml = generatePositiveResponseEmailHtml(company, serviceType, message, link);
    
    result.email = await sendEmail({
      to: EMAIL_ACCOUNTS.gestor.email,
      subject: `🎉 RESPOSTA POSITIVA: ${company.name}`,
      html: emailHtml,
      from: 'mariana', // Mariana é a agente de CRM
    });
    
    if (result.email.success) {
      console.log(`✅ Email de resposta positiva enviado ao gestor`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    result.email = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
  
  result.message = `Resposta positiva notificada via Email e WhatsApp`;
  
  return result;
}

/**
 * Notifica sobre erro do sistema
 * - Email para o gestor
 * - WhatsApp (ALERTA ALTO)
 */
export async function notifyError(
  errorType: string,
  errorMessage: string,
  details?: string
): Promise<NotificationResult> {
  console.error(`🚨 Erro do sistema: ${errorType}`);
  console.error(`   Mensagem: ${errorMessage}`);
  
  const result: NotificationResult = {
    logged: true,
    message: '',
  };
  
  // Enviar alerta WhatsApp (ALTA PRIORIDADE)
  result.whatsapp = await alertSystemError(errorType, errorMessage);
  
  if (result.whatsapp.success) {
    console.log(`✅ Alerta WhatsApp de erro enviado`);
  } else {
    console.warn(`⚠️ Falha no WhatsApp: ${result.whatsapp.error}`);
  }
  
  // Enviar email para o gestor
  try {
    const emailHtml = generateErrorEmailHtml(errorType, errorMessage, details);
    
    result.email = await sendEmail({
      to: EMAIL_ACCOUNTS.gestor.email,
      subject: `🚨 ERRO DO SISTEMA: ${errorType}`,
      html: emailHtml,
      from: 'pedro',
    });
    
    if (result.email.success) {
      console.log(`✅ Email de erro enviado ao gestor`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email de erro:', error);
    result.email = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
  
  result.message = `Erro notificado via Email e WhatsApp`;
  
  return result;
}

/**
 * Notifica sobre campanha concluída
 * - Apenas email (não é urgente)
 */
export async function notifyCampaignComplete(
  campaignName: string,
  emailsSent: number,
  openRate: number,
  replies: number
): Promise<NotificationResult> {
  console.log(`📊 Campanha concluída: ${campaignName}`);
  
  const result: NotificationResult = {
    logged: true,
    message: '',
  };
  
  const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/campanhas`;
  
  // Apenas email (não é alta prioridade para WhatsApp)
  try {
    const emailHtml = generateCampaignCompleteEmailHtml(campaignName, emailsSent, openRate, replies, link);
    
    result.email = await sendEmail({
      to: EMAIL_ACCOUNTS.gestor.email,
      subject: `📊 Campanha Concluída: ${campaignName}`,
      html: emailHtml,
      from: 'mariana',
    });
    
    if (result.email.success) {
      console.log(`✅ Email de campanha concluída enviado ao gestor`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    result.email = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
  
  result.message = `Campanha notificada via Email`;
  
  return result;
}

/**
 * Notificação diária de resumo
 * - Apenas email
 */
export async function notifyDailySummary(
  leadsCount: number,
  emailsSent: number,
  replies: number,
  activeCampaigns: number
): Promise<NotificationResult> {
  console.log(`📅 Enviando resumo diário...`);
  
  const result: NotificationResult = {
    logged: true,
    message: '',
  };
  
  const today = new Date().toLocaleDateString('pt-AO', {
    timeZone: 'Africa/Luanda',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`;
  
  try {
    const emailHtml = generateDailySummaryEmailHtml(today, leadsCount, emailsSent, replies, activeCampaigns, link);
    
    result.email = await sendEmail({
      to: EMAIL_ACCOUNTS.gestor.email,
      subject: `📅 Resumo Diário - ${today}`,
      html: emailHtml,
      from: 'pedro',
    });
    
    if (result.email.success) {
      console.log(`✅ Resumo diário enviado ao gestor`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar resumo:', error);
    result.email = {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
  
  result.message = `Resumo diário enviado via Email`;
  
  return result;
}

// ==========================================
// Helpers para gerar HTML de emails
// ==========================================

function generateNewLeadEmailHtml(company: Company, isHighScore: boolean): string {
  const score = company.score || 0;
  
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: ${isHighScore ? '#059669' : '#0f172a'}; color: white; padding: 25px; text-align: center; }
        .content { padding: 25px; background: #fff; }
        .info-box { background: #f8fafc; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid ${isHighScore ? '#059669' : '#0ea5e9'}; }
        .score { font-size: 32px; font-weight: bold; color: ${isHighScore ? '#059669' : '#64748b'}; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${isHighScore ? '🎯 NOVO LEAD QUALIFICADO!' : '📋 Novo Lead Descoberto'}</h2>
      </div>
      <div class="content">
        <p>Um novo lead foi ${isHighScore ? 'qualificado com alto score' : 'adicionado ao sistema'}:</p>
        
        <div class="info-box">
          <h3 style="margin: 0 0 10px 0;">${company.name}</h3>
          <p style="margin: 0;"><strong>Tipo:</strong> ${company.type || 'Não informado'}</p>
          <p style="margin: 0;"><strong>País:</strong> ${company.country || 'Não informado'}</p>
          <p style="margin: 0;"><strong>Email:</strong> ${company.email || 'Não informado'}</p>
          <p style="margin: 0;"><strong>Status:</strong> ${company.status || 'Novo'}</p>
        </div>
        
        <div class="info-box" style="text-align: center;">
          <p style="margin: 0;"><strong>SCORE DE QUALIFICAÇÃO</strong></p>
          <p class="score" style="margin: 10px 0;">${score}/100</p>
          <p style="margin: 0; color: ${isHighScore ? '#059669' : '#64748b'};">
            ${isHighScore ? '✅ Lead Qualificado - Alta Prioridade' : '📊 Lead para Análise'}
          </p>
        </div>
        
        ${company.notes ? `
        <div class="info-box">
          <p style="margin: 0;"><strong>Observações:</strong></p>
          <p style="margin: 5px 0 0 0;">${company.notes}</p>
        </div>
        ` : ''}
        
        <p>Acesse o sistema para mais detalhes e próximo contato.</p>
      </div>
      <div class="footer">
        <p>Sistema Sonar V 1.0 - MTS Angola</p>
      </div>
    </body>
    </html>
  `;
}

function generatePositiveResponseEmailHtml(
  company: Company,
  serviceType: string,
  message: string,
  link: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #059669; color: white; padding: 25px; text-align: center; }
        .content { padding: 25px; background: #fff; }
        .info-box { background: #ecfdf5; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #059669; }
        .message-box { background: #f0fdf4; padding: 20px; margin: 15px 0; border-radius: 8px; font-style: italic; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        .cta { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>🎉 RESPOSTA POSITIVA!</h2>
        <p style="margin: 5px 0 0 0;">Um cliente demonstrou interesse nos nossos serviços!</p>
      </div>
      <div class="content">
        <div class="info-box">
          <h3 style="margin: 0 0 10px 0;">${company.name}</h3>
          <p style="margin: 0;"><strong>Email:</strong> ${company.email || 'Não informado'}</p>
          <p style="margin: 0;"><strong>Serviço de Interesse:</strong> ${serviceType}</p>
        </div>
        
        <p><strong>Mensagem do cliente:</strong></p>
        <div class="message-box">
          "${message}"
        </div>
        
        <p><strong>Ação recomendada:</strong> Entrar em contato o mais rápido possível para dar continuidade.</p>
        
        <a href="${link}" class="cta">Ver Detalhes no Sistema</a>
      </div>
      <div class="footer">
        <p>Sistema Sonar V 1.0 - MTS Angola</p>
      </div>
    </body>
    </html>
  `;
}

function generateErrorEmailHtml(
  errorType: string,
  errorMessage: string,
  details?: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #dc2626; color: white; padding: 25px; text-align: center; }
        .content { padding: 25px; background: #fff; }
        .error-box { background: #fef2f2; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>🚨 ERRO DO SISTEMA</h2>
        <p style="margin: 5px 0 0 0;">Atenção necessária!</p>
      </div>
      <div class="content">
        <div class="error-box">
          <p style="margin: 0;"><strong>Tipo de Erro:</strong> ${errorType}</p>
          <p style="margin: 10px 0 0 0;"><strong>Mensagem:</strong> ${errorMessage}</p>
        </div>
        
        ${details ? `
        <div class="error-box">
          <p style="margin: 0;"><strong>Detalhes:</strong></p>
          <pre style="margin: 10px 0 0 0; white-space: pre-wrap; font-size: 12px;">${details}</pre>
        </div>
        ` : ''}
        
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-AO', { timeZone: 'Africa/Luanda' })}</p>
        
        <p>Por favor, verifique o sistema e tome as ações necessárias.</p>
      </div>
      <div class="footer">
        <p>Sistema Sonar V 1.0 - MTS Angola</p>
      </div>
    </body>
    </html>
  `;
}

function generateCampaignCompleteEmailHtml(
  campaignName: string,
  emailsSent: number,
  openRate: number,
  replies: number,
  link: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0f172a; color: white; padding: 25px; text-align: center; }
        .content { padding: 25px; background: #fff; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; text-align: center; }
        .stat { background: #f8fafc; padding: 15px 20px; border-radius: 8px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #0f172a; }
        .stat-label { font-size: 12px; color: #64748b; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>📊 Campanha Concluída</h2>
      </div>
      <div class="content">
        <p>A campanha <strong>"${campaignName}"</strong> foi concluída.</p>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${emailsSent}</div>
            <div class="stat-label">Emails Enviados</div>
          </div>
          <div class="stat">
            <div class="stat-value">${openRate.toFixed(1)}%</div>
            <div class="stat-label">Taxa de Abertura</div>
          </div>
          <div class="stat">
            <div class="stat-value">${replies}</div>
            <div class="stat-label">Respostas</div>
          </div>
        </div>
        
        <p>Acesse o sistema para ver o relatório completo.</p>
      </div>
      <div class="footer">
        <p>Sistema Sonar V 1.0 - MTS Angola</p>
      </div>
    </body>
    </html>
  `;
}

function generateDailySummaryEmailHtml(
  date: string,
  leadsCount: number,
  emailsSent: number,
  replies: number,
  activeCampaigns: number,
  link: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: white; padding: 25px; text-align: center; }
        .content { padding: 25px; background: #fff; }
        .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: bold; color: #0f172a; }
        .stat-label { font-size: 12px; color: #64748b; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>📅 Resumo Diário</h2>
        <p style="margin: 5px 0 0 0;">${date}</p>
      </div>
      <div class="content">
        <p>Segue o resumo das atividades do dia:</p>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${leadsCount}</div>
            <div class="stat-label">Leads Descobertos</div>
          </div>
          <div class="stat">
            <div class="stat-value">${emailsSent}</div>
            <div class="stat-label">Emails Enviados</div>
          </div>
          <div class="stat">
            <div class="stat-value">${replies}</div>
            <div class="stat-label">Respostas</div>
          </div>
          <div class="stat">
            <div class="stat-value">${activeCampaigns}</div>
            <div class="stat-label">Campanhas Ativas</div>
          </div>
        </div>
        
        <p>Acesse o dashboard para mais detalhes.</p>
      </div>
      <div class="footer">
        <p>Sistema Sonar V 1.0 - MTS Angola</p>
      </div>
    </body>
    </html>
  `;
}
