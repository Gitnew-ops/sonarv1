/**
 * ===========================================
 * SONAR V 1.0 - Sistema de Agendamento Cron
 * ===========================================
 * 
 * Sistema automatizado para tarefas recorrentes:
 * - Discovery Scan: A cada 6 horas
 * - Relatório Diário: Todos os dias às 09:00
 * - Fila de Emails: A cada 5 minutos
 */

import { runDiscoveryScan } from './discovery-service';
import { generateDailyReport, generateWeeklyReport, sendReportToManager } from './report-generator';
import { db } from './db';

// Tipos
export type TaskName = 'discovery' | 'dailyReport' | 'weeklyReport' | 'processEmails';

export interface ScheduledTask {
  name: TaskName;
  interval: number; // em milissegundos
  callback: () => Promise<void>;
  lastRun?: Date;
  nextRun?: Date;
  isRunning: boolean;
  intervalId?: NodeJS.Timeout;
}

export interface SchedulerStatus {
  isRunning: boolean;
  tasks: {
    name: TaskName;
    interval: string;
    lastRun: string | null;
    nextRun: string | null;
    isRunning: boolean;
  }[];
  uptime: number;
}

// Estado do scheduler
let schedulerRunning = false;
let schedulerStartTime: Date | null = null;
const scheduledTasks: Map<TaskName, ScheduledTask> = new Map();

// Configuração de intervalos
const TASK_CONFIGS = {
  discovery: {
    intervalMs: 6 * 60 * 60 * 1000, // 6 horas
    description: 'Discovery Scan - Busca de novas empresas',
  },
  dailyReport: {
    intervalMs: 24 * 60 * 60 * 1000, // 24 horas
    description: 'Relatório Diário - Enviado às 09:00',
  },
  weeklyReport: {
    intervalMs: 7 * 24 * 60 * 60 * 1000, // 7 dias
    description: 'Relatório Semanal - Resumo da semana',
  },
  processEmails: {
    intervalMs: 5 * 60 * 1000, // 5 minutos
    description: 'Processar Fila de Emails',
  },
};

/**
 * Log com timestamp
 */
function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] [CRON] ${message}`;
  
  if (level === 'error') {
    console.error(logMessage);
  } else if (level === 'warn') {
    console.warn(logMessage);
  } else {
    console.log(logMessage);
  }
}

/**
 * Executa o discovery scan
 */
async function executeDiscoveryScan(): Promise<void> {
  const task = scheduledTasks.get('discovery');
  if (!task) return;

  if (task.isRunning) {
    log('Discovery scan já está em execução, ignorando...', 'warn');
    return;
  }

  task.isRunning = true;
  log('Iniciando Discovery Scan...');

  try {
    const result = await runDiscoveryScan();
    log(`Discovery Scan concluído: ${result.newCompanies} novas empresas encontradas`);
    
    // Salvar log no banco
    await db.setting.upsert({
      where: { key: 'last_discovery_run' },
      create: {
        key: 'last_discovery_run',
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          result,
        }),
        description: 'Última execução do discovery scan',
      },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          result,
        }),
      },
    });
  } catch (error) {
    log(`Erro no Discovery Scan: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
  } finally {
    task.isRunning = false;
    task.lastRun = new Date();
    task.nextRun = new Date(Date.now() + task.interval);
    log('Discovery Scan finalizado');
  }
}

/**
 * Executa o relatório diário
 */
async function executeDailyReport(): Promise<void> {
  const task = scheduledTasks.get('dailyReport');
  if (!task) return;

  if (task.isRunning) {
    log('Relatório diário já está em execução, ignorando...', 'warn');
    return;
  }

  task.isRunning = true;
  log('Gerando Relatório Diário...');

  try {
    const report = await generateDailyReport();
    await sendReportToManager(report);
    log('Relatório Diário enviado com sucesso');
    
    // Salvar log no banco
    await db.setting.upsert({
      where: { key: 'last_daily_report' },
      create: {
        key: 'last_daily_report',
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          summary: report.summary,
        }),
        description: 'Último relatório diário enviado',
      },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          summary: report.summary,
        }),
      },
    });
  } catch (error) {
    log(`Erro no Relatório Diário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
  } finally {
    task.isRunning = false;
    task.lastRun = new Date();
    task.nextRun = new Date(Date.now() + task.interval);
    log('Relatório Diário finalizado');
  }
}

/**
 * Executa o relatório semanal
 */
async function executeWeeklyReport(): Promise<void> {
  const task = scheduledTasks.get('weeklyReport');
  if (!task) return;

  if (task.isRunning) {
    log('Relatório semanal já está em execução, ignorando...', 'warn');
    return;
  }

  task.isRunning = true;
  log('Gerando Relatório Semanal...');

  try {
    const report = await generateWeeklyReport();
    await sendReportToManager(report);
    log('Relatório Semanal enviado com sucesso');
    
    // Salvar log no banco
    await db.setting.upsert({
      where: { key: 'last_weekly_report' },
      create: {
        key: 'last_weekly_report',
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          summary: report.summary,
        }),
        description: 'Último relatório semanal enviado',
      },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          summary: report.summary,
        }),
      },
    });
  } catch (error) {
    log(`Erro no Relatório Semanal: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
  } finally {
    task.isRunning = false;
    task.lastRun = new Date();
    task.nextRun = new Date(Date.now() + task.interval);
    log('Relatório Semanal finalizado');
  }
}

/**
 * Processa a fila de emails
 */
async function executeProcessEmails(): Promise<void> {
  const task = scheduledTasks.get('processEmails');
  if (!task) return;

  if (task.isRunning) {
    log('Processamento de emails já em execução, ignorando...', 'warn');
    return;
  }

  task.isRunning = true;
  log('Processando fila de emails...');

  try {
    // Buscar emails na fila
    const queuedEmails = await db.email.findMany({
      where: { status: 'QUEUED' },
      take: 10, // Processar no máximo 10 por vez
      include: {
        company: true,
      },
    });

    if (queuedEmails.length === 0) {
      log('Nenhum email na fila');
      return;
    }

    log(`Processando ${queuedEmails.length} emails...`);

    // Importar serviço de email dinamicamente para evitar problemas de bundling
    const { sendEmail } = await import('./email-service');

    let sent = 0;
    let failed = 0;

    for (const email of queuedEmails) {
      try {
        const result = await sendEmail({
          to: email.company.email || '',
          subject: email.subject,
          html: email.body,
          from: 'mariana',
        });

        if (result.success) {
          await db.email.update({
            where: { id: email.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          });
          sent++;
        } else {
          await db.email.update({
            where: { id: email.id },
            data: {
              status: 'FAILED',
              failedReason: result.error || 'Erro desconhecido',
            },
          });
          failed++;
        }

        // Pequeno delay entre envios
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (emailError) {
        log(`Erro ao enviar email ${email.id}: ${emailError instanceof Error ? emailError.message : 'Erro desconhecido'}`, 'error');
        failed++;

        await db.email.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            failedReason: emailError instanceof Error ? emailError.message : 'Erro desconhecido',
          },
        });
      }
    }

    log(`Processamento concluído: ${sent} enviados, ${failed} falharam`);
  } catch (error) {
    log(`Erro no processamento de emails: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
  } finally {
    task.isRunning = false;
    task.lastRun = new Date();
    task.nextRun = new Date(Date.now() + task.interval);
  }
}

/**
 * Agenda uma tarefa
 */
export function scheduleTask(
  name: TaskName,
  interval: number,
  callback: () => Promise<void>
): ScheduledTask {
  const task: ScheduledTask = {
    name,
    interval,
    callback,
    isRunning: false,
    lastRun: undefined,
    nextRun: undefined,
  };

  scheduledTasks.set(name, task);
  log(`Tarefa "${name}" registrada com intervalo de ${interval}ms`);

  return task;
}

/**
 * Inicia o scheduler
 */
export function startScheduler(): void {
  if (schedulerRunning) {
    log('Scheduler já está em execução', 'warn');
    return;
  }

  log('Iniciando scheduler...');
  schedulerRunning = true;
  schedulerStartTime = new Date();

  // Registrar tarefas
  scheduleTask('discovery', TASK_CONFIGS.discovery.intervalMs, executeDiscoveryScan);
  scheduleTask('dailyReport', TASK_CONFIGS.dailyReport.intervalMs, executeDailyReport);
  scheduleTask('weeklyReport', TASK_CONFIGS.weeklyReport.intervalMs, executeWeeklyReport);
  scheduleTask('processEmails', TASK_CONFIGS.processEmails.intervalMs, executeProcessEmails);

  // Iniciar intervalos
  scheduledTasks.forEach((task, name) => {
    // Calcular próximo horário de execução
    task.nextRun = new Date(Date.now() + task.interval);

    // Criar intervalo
    task.intervalId = setInterval(async () => {
      try {
        await task.callback();
      } catch (error) {
        log(`Erro na execução da tarefa ${name}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
      }
    }, task.interval);

    log(`Tarefa "${name}" agendada para executar a cada ${task.interval / 1000 / 60} minutos`);
  });

  log('Scheduler iniciado com sucesso!');
}

/**
 * Para o scheduler
 */
export function stopScheduler(): void {
  if (!schedulerRunning) {
    log('Scheduler não está em execução', 'warn');
    return;
  }

  log('Parando scheduler...');

  scheduledTasks.forEach((task, name) => {
    if (task.intervalId) {
      clearInterval(task.intervalId);
      log(`Tarefa "${name}" interrompida`);
    }
  });

  scheduledTasks.clear();
  schedulerRunning = false;
  schedulerStartTime = null;

  log('Scheduler parado');
}

/**
 * Obtém status do scheduler
 */
export function getSchedulerStatus(): SchedulerStatus {
  const tasks = Array.from(scheduledTasks.values()).map(task => ({
    name: task.name,
    interval: TASK_CONFIGS[task.name]?.description || `${task.interval}ms`,
    lastRun: task.lastRun ? task.lastRun.toISOString() : null,
    nextRun: task.nextRun ? task.nextRun.toISOString() : null,
    isRunning: task.isRunning,
  }));

  return {
    isRunning: schedulerRunning,
    tasks,
    uptime: schedulerStartTime ? Date.now() - schedulerStartTime.getTime() : 0,
  };
}

/**
 * Executa uma tarefa manualmente
 */
export async function runTaskManually(taskName: TaskName): Promise<{
  success: boolean;
  message: string;
  result?: any;
}> {
  const task = scheduledTasks.get(taskName);
  
  if (!task) {
    return {
      success: false,
      message: `Tarefa "${taskName}" não encontrada`,
    };
  }

  if (task.isRunning) {
    return {
      success: false,
      message: `Tarefa "${taskName}" já está em execução`,
    };
  }

  log(`Execução manual iniciada para "${taskName}"`);

  try {
    await task.callback();
    return {
      success: true,
      message: `Tarefa "${taskName}" executada com sucesso`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    log(`Erro na execução manual de "${taskName}": ${errorMessage}`, 'error');
    return {
      success: false,
      message: `Erro ao executar tarefa: ${errorMessage}`,
    };
  }
}

/**
 * Verifica se é hora de executar o relatório diário (09:00 WAT)
 */
export function shouldRunDailyReport(): boolean {
  const now = new Date();
  const luandaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Luanda' }));
  const hour = luandaTime.getHours();
  const minute = luandaTime.getMinutes();
  
  // Executar entre 09:00 e 09:05
  return hour === 9 && minute < 5;
}

// Exportar configurações para uso externo
export { TASK_CONFIGS };
