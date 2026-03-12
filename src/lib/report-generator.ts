/**
 * ===========================================
 * SONAR V 1.0 - Gerador de Relatórios
 * ===========================================
 * 
 * Gera relatórios automáticos diários e semanais
 * Envia para o Gestor via email SMTP
 */

import { db } from './db';
import { generateReportSummary } from './ai';
import { sendReportToManager as sendEmailReport } from './email-service';

// Tipos
export interface ReportData {
  type: 'DAILY' | 'WEEKLY';
  title: string;
  summary: string;
  stats: {
    leadsDiscovered: number;
    emailsSent: number;
    openRate: number;
    responseRate: number;
    activeCampaigns: number;
  };
  topCompanies: {
    name: string;
    type: string;
    score: number;
    status: string;
  }[];
  activeCampaigns: {
    name: string;
    serviceType: string;
    emailsSent: number;
    status: string;
  }[];
  recentActivity: {
    type: string;
    description: string;
    timestamp: Date;
  }[];
  generatedAt: Date;
}

export interface ReportResult {
  success: boolean;
  report?: ReportData;
  error?: string;
}

/**
 * Log com timestamp
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [REPORT] ${message}`;
  
  if (level === 'error') {
    console.error(logMessage);
  } else if (level === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
}

/**
 * Gera relatório diário
 */
export async function generateDailyReport(): Promise<ReportData> {
  log('Gerando relatório diário...');

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Leads descobertos hoje
  const leadsDiscovered = await db.company.count({
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
  });

  // Emails enviados hoje
  const emailsSentToday = await db.email.findMany({
    where: {
      sentAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
    select: {
      status: true,
    },
  });

  const emailsSent = emailsSentToday.length;
  const openedCount = emailsSentToday.filter(e => 
    ['OPENED', 'CLICKED', 'REPLIED'].includes(e.status)
  ).length;
  const repliedCount = emailsSentToday.filter(e => e.status === 'REPLIED').length;

  const openRate = emailsSent > 0 ? Math.round((openedCount / emailsSent) * 100) : 0;
  const responseRate = emailsSent > 0 ? Math.round((repliedCount / emailsSent) * 100) : 0;

  // Campanhas activas
  const activeCampaigns = await db.campaign.count({
    where: {
      status: 'ACTIVE',
    },
  });

  // Top empresas por score
  const topCompanies = await db.company.findMany({
    where: {
      score: { gte: 50 },
    },
    select: {
      name: true,
      type: true,
      score: true,
      status: true,
    },
    orderBy: {
      score: 'desc',
    },
    take: 5,
  });

  // Campanhas activas detalhes
  const activeCampaignsList = await db.campaign.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      name: true,
      serviceType: true,
      status: true,
      emails: {
        select: {
          id: true,
        },
      },
    },
    take: 5,
  });

  const campaignsWithCount = activeCampaignsList.map(c => ({
    name: c.name,
    serviceType: c.serviceType || 'N/A',
    status: c.status,
    emailsSent: c.emails.length,
  }));

  // Actividade recente
  const recentCompanies = await db.company.findMany({
    where: {
      createdAt: {
        gte: todayStart,
      },
    },
    select: {
      name: true,
      createdAt: true,
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const recentActivity = recentCompanies.map(c => ({
    type: 'NEW_LEAD',
    description: `Nova empresa descoberta: ${c.name}`,
    timestamp: c.createdAt,
  }));

  // Gerar resumo com AI
  const aiSummary = await generateReportSummary({
    type: 'Diário',
    leadsCount: leadsDiscovered,
    emailsSent: emailsSent,
    openRate: openRate,
    responseRate: responseRate,
    topCompanies: topCompanies.map(c => c.name),
    period: now.toLocaleDateString('pt-AO', { timeZone: 'Africa/Luanda' }),
  });

  const report: ReportData = {
    type: 'DAILY',
    title: `Relatório Diário - ${now.toLocaleDateString('pt-AO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Africa/Luanda'
    })}`,
    summary: aiSummary,
    stats: {
      leadsDiscovered,
      emailsSent,
      openRate,
      responseRate,
      activeCampaigns,
    },
    topCompanies,
    activeCampaigns: campaignsWithCount,
    recentActivity,
    generatedAt: now,
  };

  // Salvar relatório no banco
  await saveReportToDatabase(report);

  log('Relatório diário gerado com sucesso');
  return report;
}

/**
 * Gera relatório semanal
 */
export async function generateWeeklyReport(): Promise<ReportData> {
  log('Gerando relatório semanal...');

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  // Leads descobertos na semana
  const leadsDiscovered = await db.company.count({
    where: {
      createdAt: {
        gte: weekStart,
      },
    },
  });

  // Emails enviados na semana
  const emailsSentWeek = await db.email.findMany({
    where: {
      sentAt: {
        gte: weekStart,
      },
    },
    select: {
      status: true,
    },
  });

  const emailsSent = emailsSentWeek.length;
  const openedCount = emailsSentWeek.filter(e => 
    ['OPENED', 'CLICKED', 'REPLIED'].includes(e.status)
  ).length;
  const repliedCount = emailsSentWeek.filter(e => e.status === 'REPLIED').length;

  const openRate = emailsSent > 0 ? Math.round((openedCount / emailsSent) * 100) : 0;
  const responseRate = emailsSent > 0 ? Math.round((repliedCount / emailsSent) * 100) : 0;

  // Campanhas activas
  const activeCampaigns = await db.campaign.count({
    where: {
      status: 'ACTIVE',
    },
  });

  // Top empresas por score
  const topCompanies = await db.company.findMany({
    where: {
      createdAt: {
        gte: weekStart,
      },
      score: { gte: 50 },
    },
    select: {
      name: true,
      type: true,
      score: true,
      status: true,
    },
    orderBy: {
      score: 'desc',
    },
    take: 10,
  });

  // Campanhas activas detalhes
  const activeCampaignsList = await db.campaign.findMany({
    where: {
      status: 'ACTIVE',
    },
    select: {
      name: true,
      serviceType: true,
      status: true,
      emails: {
        where: {
          createdAt: {
            gte: weekStart,
          },
        },
        select: {
          id: true,
        },
      },
    },
    take: 5,
  });

  const campaignsWithCount = activeCampaignsList.map(c => ({
    name: c.name,
    serviceType: c.serviceType || 'N/A',
    status: c.status,
    emailsSent: c.emails.length,
  }));

  // Actividade recente
  const recentCompanies = await db.company.findMany({
    where: {
      createdAt: {
        gte: weekStart,
      },
    },
    select: {
      name: true,
      createdAt: true,
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  const recentActivity = recentCompanies.map(c => ({
    type: 'NEW_LEAD',
    description: `Nova empresa descoberta: ${c.name}`,
    timestamp: c.createdAt,
  }));

  // Estatísticas adicionais semanais
  const leadsByType = await db.company.groupBy({
    by: ['type'],
    where: {
      createdAt: {
        gte: weekStart,
      },
    },
    _count: true,
  });

  // Gerar resumo com AI
  const aiSummary = await generateReportSummary({
    type: 'Semanal',
    leadsCount: leadsDiscovered,
    emailsSent: emailsSent,
    openRate: openRate,
    responseRate: responseRate,
    topCompanies: topCompanies.map(c => c.name),
    period: `${weekStart.toLocaleDateString('pt-AO')} - ${now.toLocaleDateString('pt-AO')}`,
  });

  const report: ReportData = {
    type: 'WEEKLY',
    title: `Relatório Semanal - Semana de ${weekStart.toLocaleDateString('pt-AO', {
      day: 'numeric',
      month: 'long',
      timeZone: 'Africa/Luanda',
    })} a ${now.toLocaleDateString('pt-AO', {
      day: 'numeric',
      month: 'long',
      timeZone: 'Africa/Luanda',
    })}`,
    summary: aiSummary,
    stats: {
      leadsDiscovered,
      emailsSent,
      openRate,
      responseRate,
      activeCampaigns,
    },
    topCompanies,
    activeCampaigns: campaignsWithCount,
    recentActivity,
    generatedAt: now,
  };

  // Salvar relatório no banco
  await saveReportToDatabase(report);

  log('Relatório semanal gerado com sucesso');
  return report;
}

/**
 * Envia relatório para o gestor
 */
export async function sendReportToManager(report: ReportData): Promise<{
  success: boolean;
  message: string;
}> {
  log(`Enviando relatório ${report.type} para o gestor...`);

  try {
    // Gerar HTML do relatório
    const html = generateReportHtml(report);

    // Enviar por email
    const result = await sendEmailReport(
      report.type === 'DAILY' ? 'Diário' : 'Semanal',
      html,
      report.summary
    );

    if (result.success) {
      log(`Relatório ${report.type} enviado com sucesso para o gestor`);
      
      // Registrar envio
      await db.setting.upsert({
        where: { key: `last_${report.type.toLowerCase()}_report_sent` },
        create: {
          key: `last_${report.type.toLowerCase()}_report_sent`,
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            messageId: result.messageId,
          }),
          description: `Último relatório ${report.type.toLowerCase()} enviado`,
        },
        update: {
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            messageId: result.messageId,
          }),
        },
      });

      return {
        success: true,
        message: `Relatório ${report.type} enviado com sucesso`,
      };
    } else {
      throw new Error(result.error || 'Erro desconhecido');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    log(`Erro ao enviar relatório: ${errorMessage}`, 'error');
    
    return {
      success: false,
      message: `Erro ao enviar relatório: ${errorMessage}`,
    };
  }
}

/**
 * Gera HTML do relatório
 */
function generateReportHtml(report: ReportData): string {
  const statsHtml = `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 15px; background: #f0f9ff; border-radius: 8px; text-align: center; width: 20%;">
          <div style="font-size: 24px; font-weight: bold; color: #0ea5e9;">${report.stats.leadsDiscovered}</div>
          <div style="font-size: 12px; color: #64748b;">Leads Descobertos</div>
        </td>
        <td style="width: 5%;"></td>
        <td style="padding: 15px; background: #f0fdf4; border-radius: 8px; text-align: center; width: 20%;">
          <div style="font-size: 24px; font-weight: bold; color: #10b981;">${report.stats.emailsSent}</div>
          <div style="font-size: 12px; color: #64748b;">Emails Enviados</div>
        </td>
        <td style="width: 5%;"></td>
        <td style="padding: 15px; background: #fefce8; border-radius: 8px; text-align: center; width: 20%;">
          <div style="font-size: 24px; font-weight: bold; color: #eab308;">${report.stats.openRate}%</div>
          <div style="font-size: 12px; color: #64748b;">Taxa de Abertura</div>
        </td>
        <td style="width: 5%;"></td>
        <td style="padding: 15px; background: #fdf4ff; border-radius: 8px; text-align: center; width: 20%;">
          <div style="font-size: 24px; font-weight: bold; color: #a855f7;">${report.stats.responseRate}%</div>
          <div style="font-size: 12px; color: #64748b;">Taxa de Resposta</div>
        </td>
      </tr>
    </table>
  `;

  const topCompaniesHtml = report.topCompanies.length > 0 ? `
    <h3 style="color: #0f172a; margin-top: 30px;">🏆 Top Empresas por Score</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="background: #f8fafc;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Empresa</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Tipo</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Score</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.topCompanies.map((company, index) => `
          <tr style="${index % 2 === 0 ? '' : 'background: #f8fafc;'}">
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${company.name}</td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${company.type}</td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <span style="background: ${company.score >= 70 ? '#dcfce7' : company.score >= 50 ? '#fef9c3' : '#fee2e2'}; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                ${company.score}
              </span>
            </td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${company.status}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #64748b; margin-top: 30px;">Nenhuma empresa qualificada neste período.</p>';

  const campaignsHtml = report.activeCampaigns.length > 0 ? `
    <h3 style="color: #0f172a; margin-top: 30px;">📈 Campanhas Activas</h3>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <thead>
        <tr style="background: #f8fafc;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Campanha</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Serviço</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Emails Enviados</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${report.activeCampaigns.map((campaign, index) => `
          <tr style="${index % 2 === 0 ? '' : 'background: #f8fafc;'}">
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${campaign.name}</td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${campaign.serviceType}</td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">${campaign.emailsSent}</td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">
              <span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px;">${campaign.status}</span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '<p style="color: #64748b; margin-top: 30px;">Nenhuma campanha activa.</p>';

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #0f172a; margin-bottom: 5px;">${report.title}</h2>
      <p style="color: #64748b; font-size: 14px;">Gerado em ${report.generatedAt.toLocaleString('pt-AO', { timeZone: 'Africa/Luanda' })}</p>
      
      ${statsHtml}
      
      ${topCompaniesHtml}
      
      ${campaignsHtml}
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 12px;">
          Este relatório foi gerado automaticamente pelo Sistema Sonar V 1.0<br>
          MTS Angola | Serviços Marítimos | Angola
        </p>
      </div>
    </div>
  `;
}

/**
 * Salva relatório no banco de dados
 */
async function saveReportToDatabase(report: ReportData): Promise<void> {
  try {
    await db.report.create({
      data: {
        type: report.type,
        title: report.title,
        data: JSON.stringify(report),
      },
    });

    log(`Relatório ${report.type} salvo no banco de dados`);
  } catch (error) {
    log(`Erro ao salvar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
  }
}

/**
 * Obtém últimos relatórios
 */
export async function getRecentReports(limit: number = 10): Promise<{
  id: string;
  type: string;
  title: string | null;
  generatedAt: Date;
}[]> {
  const reports = await db.report.findMany({
    select: {
      id: true,
      type: true,
      title: true,
      generatedAt: true,
    },
    orderBy: {
      generatedAt: 'desc',
    },
    take: limit,
  });

  return reports;
}

/**
 * Obtém relatório por ID
 */
export async function getReportById(id: string): Promise<ReportData | null> {
  const report = await db.report.findUnique({
    where: { id },
  });

  if (!report) return null;

  return JSON.parse(report.data) as ReportData;
}
