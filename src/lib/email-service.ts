/**
 * ===========================================
 * SONAR V 1.0 - Serviço de Envio de Email SMTP
 * ===========================================
 * 
 * Usa nodemailer para enviar emails via SMTP
 * Servidor: mail.mts-angola.com | Porta: 465
 */

import nodemailer from 'nodemailer';
import { SMTP_CONFIG, EMAIL_ACCOUNTS, type EmailAccount } from './email-config';
import { AGENTS, type AgentId } from './agents-config';

// Tipos
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: AgentId | 'gestor';
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Mapeia agente para a chave da conta de email
 */
function getAccountKeyForAgent(agentId: AgentId | 'gestor'): keyof typeof EMAIL_ACCOUNTS {
  const mapping: Record<string, keyof typeof EMAIL_ACCOUNTS> = {
    mariana: 'mariana',
    claudia: 'claudia',
    pedro: 'pedro',
    gestor: 'gestor',
  };
  return mapping[agentId] || 'mariana';
}

/**
 * Cria um transportador SMTP para um agente específico
 */
export function createTransporter(agentId: AgentId | 'gestor' = 'mariana'): nodemailer.Transporter | null {
  const accountKey = getAccountKeyForAgent(agentId);
  const account = EMAIL_ACCOUNTS[accountKey];
  
  if (!account.password) {
    console.warn(`⚠️ Senha não configurada para ${account.email}`);
    return null;
  }
  
  return nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: account.email,
      pass: account.password,
    },
    tls: {
      rejectUnauthorized: false, // Para servidores com certificado auto-assinado
    },
  });
}

/**
 * Envia um email usando SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, html, text, from = 'mariana', replyTo, attachments } = options;
    
    const transporter = createTransporter(from);
    
    if (!transporter) {
      return {
        success: false,
        error: `Transporter não configurado para o agente ${from}`,
      };
    }
    
    const accountKey = getAccountKeyForAgent(from);
    const account = EMAIL_ACCOUNTS[accountKey];
    const agent = from !== 'gestor' ? AGENTS[from] : null;
    
    const fromName = agent ? agent.name : 'Gestor MTS Angola';
    
    const mailOptions = {
      from: `"${fromName} - MTS Angola" <${account.email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML para versão texto
      replyTo: replyTo || account.email,
      attachments,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado com sucesso!`);
    console.log(`   De: ${account.email}`);
    console.log(`   Para: ${mailOptions.to}`);
    console.log(`   ID: ${info.messageId}`);
    
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Envia email de apresentação para um potencial cliente
 */
export async function sendPresentationEmail(
  toEmail: string,
  companyName: string,
  serviceType: string,
  from: AgentId = 'mariana'
): Promise<EmailResult> {
  const agent = AGENTS[from];
  const accountKey = getAccountKeyForAgent(from);
  const account = EMAIL_ACCOUNTS[accountKey];
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; background: #ffffff; }
        .service-box { background: #f1f5f9; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #0ea5e9; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0;">⚓ MTS Angola</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Serviços Marítimos Profissionais</p>
      </div>
      <div class="content">
        <p>Prezados/as da <strong>${companyName}</strong>,</p>
        
        <p>Sou <strong>${agent.name}</strong>, ${agent.role} da MTS Angola, e gostaria de apresentar os nossos 
        serviços especializados para o setor marítimo em Angola.</p>
        
        <div class="service-box">
          <h3 style="margin: 0 0 10px 0;">🤿 Mergulho Comercial</h3>
          <p style="margin: 0;">Inspeção subaquática, reparos em casco, limpeza de hélices e válvulas, 
          inspeção de âncoras e cabos.</p>
        </div>
        
        <div class="service-box">
          <h3 style="margin: 0 0 10px 0;">🛒 Shipchandler</h3>
          <p style="margin: 0;">Abastecimento completo de navios: provisões alimentares, equipamentos náuticos, 
          consumíveis técnicos e materiais de segurança.</p>
        </div>
        
        <div class="service-box">
          <h3 style="margin: 0 0 10px 0;">♻️ Waste Management</h3>
          <p style="margin: 0;">Gestão de resíduos conforme convenção MARPOL, descarte ambiental certificado, 
          recibos de eliminação para documentação.</p>
        </div>
        
        <div class="service-box">
          <h3 style="margin: 0 0 10px 0;">⛽ Bunker MGO</h3>
          <p style="margin: 0;">Fornecimento de combustível marítimo (Gasóleo Marítimo) em todos os portos angolanos.</p>
        </div>
        
        <p><strong>Operamos nos principais portos de Angola:</strong> Luanda, Lobito, Namibe, Soyo e Cabinda.</p>
        
        <p>Teremos todo o prazer em fornecer uma proposta personalizada para as necessidades 
        da vossa frota. Aguardamos o vosso contacto.</p>
        
        <div class="signature">
          <p>Com os melhores cumprimentos,</p>
          <p><strong>${agent.name}</strong><br>
          ${agent.role}<br>
          <strong>MTS Angola</strong><br>
          📧 ${account.email}<br>
          🌐 www.mts-angola.com</p>
        </div>
      </div>
      <div class="footer">
        <p>Este email foi enviado por ${agent.name} via Sistema Sonar V 1.0</p>
        <p>MTS Angola | Serviços Marítimos | Angola</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: toEmail,
    subject: `MTS Angola - Parceria em Serviços Marítimos | ${serviceType}`,
    html,
    from,
  });
}

/**
 * Envia relatório para o Gestor
 */
export async function sendReportToManager(
  reportType: string,
  reportHtml: string,
  summary: string
): Promise<EmailResult> {
  const account = EMAIL_ACCOUNTS.gestor;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0f172a; color: white; padding: 25px 20px; }
        .content { padding: 25px 20px; background: #ffffff; }
        .summary { background: #ecfdf5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .footer { background: #f8fafc; padding: 20px; font-size: 12px; text-align: center; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin: 0;">📊 Relatório ${reportType}</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Sonar V 1.0 - Sistema de Prospecção Marítima</p>
      </div>
      <div class="content">
        <div class="summary">
          <strong>📋 Resumo Executivo:</strong><br><br>
          ${summary}
        </div>
        ${reportHtml}
      </div>
      <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema Sonar V 1.0</p>
        <p>MTS Angola | ${new Date().toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' })}</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: account.email,
    subject: `📊 Relatório ${reportType} - Sonar V 1.0`,
    html,
    from: 'pedro', // Pedro é o agente de inteligência que gera relatórios
  });
}

/**
 * Envia alerta crítico para o Gestor
 */
export async function sendAlertToManager(
  alertType: string,
  message: string,
  details: string
): Promise<EmailResult> {
  const account = EMAIL_ACCOUNTS.gestor;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #dc2626; color: white; padding: 25px 20px; }
        .content { padding: 25px 20px; background: #ffffff; }
        .alert { background: #fef2f2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .footer { background: #f8fafc; padding: 20px; font-size: 12px; text-align: center; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2 style="margin: 0;">⚠️ ALERTA ${alertType}</h2>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Sonar V 1.0 - Sistema de Prospecção Marítima</p>
      </div>
      <div class="content">
        <div class="alert">
          <strong>🔔 Atenção:</strong><br><br>
          ${message}
        </div>
        <div>
          ${details}
        </div>
      </div>
      <div class="footer">
        <p>Alerta gerado automaticamente pelo Sistema Sonar V 1.0</p>
        <p>MTS Angola | ${new Date().toLocaleString('pt-AO', { timeZone: 'Africa/Luanda' })}</p>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: account.email,
    subject: `⚠️ ALERTA ${alertType} - Sonar V 1.0`,
    html,
    from: 'pedro',
  });
}

/**
 * Testa a conexão SMTP
 */
export async function testSmtpConnection(agentId: AgentId | 'gestor' = 'mariana'): Promise<{ 
  success: boolean; 
  message: string;
  email?: string;
}> {
  try {
    const accountKey = getAccountKeyForAgent(agentId);
    const account = EMAIL_ACCOUNTS[accountKey];
    
    if (!account.password) {
      return {
        success: false,
        message: `Senha não configurada para ${account.email}`,
        email: account.email,
      };
    }
    
    const transporter = createTransporter(agentId);
    
    if (!transporter) {
      return {
        success: false,
        message: `Não foi possível criar transporter para ${account.email}`,
        email: account.email,
      };
    }
    
    await transporter.verify();
    
    return {
      success: true,
      message: `✅ Conexão SMTP OK! Servidor: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}`,
      email: account.email,
    };
  } catch (error) {
    return {
      success: false,
      message: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}

/**
 * Testa todas as conexões SMTP
 */
export async function testAllSmtpConnections(): Promise<Record<string, { success: boolean; message: string; email: string }>> {
  const results: Record<string, { success: boolean; message: string; email: string }> = {};
  
  for (const [key] of Object.entries(EMAIL_ACCOUNTS)) {
    if (key === 'mariana' || key === 'claudia' || key === 'pedro' || key === 'gestor') {
      results[key] = await testSmtpConnection(key as AgentId | 'gestor');
    }
  }
  
  return results;
}
