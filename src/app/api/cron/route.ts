/**
 * ===========================================
 * SONAR V 1.0 - API de Controle Cron
 * ===========================================
 * 
 * Endpoints para gerenciar o scheduler:
 * - GET: Obter status do scheduler
 * - POST: Executar tarefas manualmente
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { 
  getSchedulerStatus, 
  runTaskManually, 
  startScheduler, 
  stopScheduler,
  type TaskName 
} from '@/lib/cron';
import { runDiscoveryScan, getDiscoveryStats } from '@/lib/discovery-service';
import { generateDailyReport, generateWeeklyReport, sendReportToManager } from '@/lib/report-generator';
import { db } from '@/lib/db';

/**
 * GET /api/cron - Obter status do scheduler
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }

    // Obter status do scheduler
    const status = getSchedulerStatus();

    // Obter estatísticas de discovery
    const discoveryStats = await getDiscoveryStats();

    // Obter últimos envios
    const lastDiscoveryRun = await db.setting.findUnique({
      where: { key: 'last_discovery_scan' },
    });

    const lastDailyReport = await db.setting.findUnique({
      where: { key: 'last_daily_report' },
    });

    const lastWeeklyReport = await db.setting.findUnique({
      where: { key: 'last_weekly_report' },
    });

    return NextResponse.json({
      scheduler: status,
      discovery: {
        ...discoveryStats,
        lastRunDetails: lastDiscoveryRun ? JSON.parse(lastDiscoveryRun.value) : null,
      },
      reports: {
        lastDaily: lastDailyReport ? JSON.parse(lastDailyReport.value) : null,
        lastWeekly: lastWeeklyReport ? JSON.parse(lastWeeklyReport.value) : null,
      },
    });
  } catch (error) {
    console.error('Get cron status error:', error);
    return NextResponse.json(
      { error: 'Erro ao obter status do scheduler' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron - Executar tarefa manualmente ou controlar scheduler
 * 
 * Body:
 * - action: 'run' | 'start' | 'stop'
 * - task: 'discovery' | 'report' | 'processEmails' (quando action='run')
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, task } = body;

    // Ação: Iniciar scheduler
    if (action === 'start') {
      startScheduler();
      return NextResponse.json({
        message: 'Scheduler iniciado com sucesso',
        status: getSchedulerStatus(),
      });
    }

    // Ação: Parar scheduler
    if (action === 'stop') {
      stopScheduler();
      return NextResponse.json({
        message: 'Scheduler parado',
        status: getSchedulerStatus(),
      });
    }

    // Ação: Executar tarefa
    if (action === 'run' && task) {
      return await executeTask(task);
    }

    return NextResponse.json(
      { error: 'Ação inválida. Use: start, stop, ou run com task' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Cron POST error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

/**
 * Executa uma tarefa específica
 */
async function executeTask(task: string): Promise<NextResponse> {
  const timestamp = new Date().toISOString();
  
  console.log(`[${timestamp}] [INFO] [CRON API] Executando tarefa manual: ${task}`);

  switch (task) {
    case 'discovery':
      try {
        const result = await runDiscoveryScan();
        return NextResponse.json({
          success: true,
          message: 'Discovery scan executado com sucesso',
          result: {
            totalFound: result.totalFound,
            newCompanies: result.newCompanies,
            duplicates: result.duplicates,
            errors: result.errors.length,
          },
          timestamp,
        }, { status: 200 });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: `Erro no discovery scan: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          timestamp,
        }, { status: 500 });
      }

    case 'report':
      try {
        const report = await generateDailyReport();
        const sendResult = await sendReportToManager(report);
        
        return NextResponse.json({
          success: sendResult.success,
          message: sendResult.message,
          report: {
            type: report.type,
            title: report.title,
            stats: report.stats,
          },
          timestamp,
        }, { status: 200 });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: `Erro ao gerar relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          timestamp,
        }, { status: 500 });
      }

    case 'weeklyReport':
      try {
        const report = await generateWeeklyReport();
        const sendResult = await sendReportToManager(report);
        
        return NextResponse.json({
          success: sendResult.success,
          message: sendResult.message,
          report: {
            type: report.type,
            title: report.title,
            stats: report.stats,
          },
          timestamp,
        }, { status: 200 });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: `Erro ao gerar relatório semanal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          timestamp,
        }, { status: 500 });
      }

    case 'processEmails':
      try {
        // Executar usando o sistema de tasks do cron
        const result = await runTaskManually('processEmails');
        
        return NextResponse.json({
          success: result.success,
          message: result.message,
          timestamp,
        }, { status: 200 });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: `Erro ao processar emails: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          timestamp,
        }, { status: 500 });
      }

    default:
      return NextResponse.json({
        success: false,
        message: `Tarefa desconhecida: ${task}. Use: discovery, report, weeklyReport, processEmails`,
        timestamp,
      }, { status: 400 });
  }
}
