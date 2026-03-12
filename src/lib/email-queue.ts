/**
 * ===========================================
 * SONAR V 1.0 - Sistema de Fila de Emails
 * ===========================================
 * 
 * Fila em memória para gestão de envio de emails
 * com rate limiting e processamento assíncrono
 * 
 * IMPORTANTE: Esta é uma fila em memória.
 * Em produção, considere usar Redis ou BullMQ para persistência.
 */

import { sendEmail, type SendEmailOptions, type EmailResult } from './email-service';
import type { AgentId } from './agents-config';

// Tipos
export interface QueuedEmail {
  id: string;
  data: SendEmailOptions;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  result?: EmailResult;
  error?: string;
}

export interface QueueStatus {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  isProcessing: boolean;
  rateLimitDelay: number;
}

// Configuração
const RATE_LIMIT_DELAY = 2000; // 2 segundos entre emails
const MAX_ATTEMPTS = 3; // Máximo de tentativas por email
const BATCH_SIZE = 5; // Emails por lote

// Estado da fila (em memória)
let emailQueue: QueuedEmail[] = [];
let isProcessing = false;
let lastSentTime = 0;

/**
 * Gera ID único para o email
 */
function generateId(): string {
  return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Adiciona email à fila
 */
export function addToQueue(emailData: SendEmailOptions): QueuedEmail {
  const email: QueuedEmail = {
    id: generateId(),
    data: emailData,
    status: 'pending',
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    createdAt: new Date(),
  };
  
  emailQueue.push(email);
  
  console.log(`📤 Email adicionado à fila: ${email.id}`);
  console.log(`   Para: ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}`);
  console.log(`   Assunto: ${emailData.subject}`);
  console.log(`   Fila: ${emailQueue.length} emails`);
  
  // Iniciar processamento se não estiver rodando
  if (!isProcessing) {
    processQueue().catch(err => {
      console.error('❌ Erro no processamento da fila:', err);
    });
  }
  
  return email;
}

/**
 * Adiciona múltiplos emails à fila
 */
export function addMultipleToQueue(emails: SendEmailOptions[]): QueuedEmail[] {
  return emails.map(email => addToQueue(email));
}

/**
 * Processa a fila de emails com rate limiting
 */
export async function processQueue(): Promise<void> {
  if (isProcessing) {
    console.log('⏳ Fila já está sendo processada...');
    return;
  }
  
  isProcessing = true;
  console.log('🔄 Iniciando processamento da fila...');
  
  try {
    while (true) {
      // Buscar próximo email pendente
      const pendingEmails = emailQueue.filter(e => e.status === 'pending');
      
      if (pendingEmails.length === 0) {
        console.log('✅ Fila vazia. Processamento concluído.');
        break;
      }
      
      // Processar em lotes
      const batch = pendingEmails.slice(0, BATCH_SIZE);
      
      for (const email of batch) {
        await processEmail(email);
        
        // Rate limiting
        const now = Date.now();
        const timeSinceLastSent = now - lastSentTime;
        
        if (timeSinceLastSent < RATE_LIMIT_DELAY) {
          const delay = RATE_LIMIT_DELAY - timeSinceLastSent;
          console.log(`⏳ Rate limiting: aguardando ${delay}ms...`);
          await sleep(delay);
        }
        
        lastSentTime = Date.now();
      }
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Processa um email individual
 */
async function processEmail(email: QueuedEmail): Promise<void> {
  email.status = 'processing';
  email.attempts++;
  
  console.log(`📧 Processando email ${email.id} (tentativa ${email.attempts}/${email.maxAttempts})`);
  
  try {
    const result = await sendEmail(email.data);
    
    if (result.success) {
      email.status = 'sent';
      email.processedAt = new Date();
      email.result = result;
      
      console.log(`✅ Email enviado: ${email.id}`);
      console.log(`   MessageID: ${result.messageId}`);
    } else {
      throw new Error(result.error || 'Erro desconhecido');
    }
  } catch (error) {
    email.error = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (email.attempts >= email.maxAttempts) {
      email.status = 'failed';
      email.processedAt = new Date();
      
      console.error(`❌ Email falhou definitivamente: ${email.id}`);
      console.error(`   Erro: ${email.error}`);
    } else {
      email.status = 'pending';
      
      console.warn(`⚠️ Email falhou, será reprocessado: ${email.id}`);
      console.warn(`   Erro: ${email.error}`);
    }
  }
}

/**
 * Obtém status da fila
 */
export function getQueueStatus(): QueueStatus {
  return {
    total: emailQueue.length,
    pending: emailQueue.filter(e => e.status === 'pending').length,
    processing: emailQueue.filter(e => e.status === 'processing').length,
    sent: emailQueue.filter(e => e.status === 'sent').length,
    failed: emailQueue.filter(e => e.status === 'failed').length,
    isProcessing,
    rateLimitDelay: RATE_LIMIT_DELAY,
  };
}

/**
 * Obtém emails na fila com filtros
 */
export function getQueuedEmails(status?: 'pending' | 'processing' | 'sent' | 'failed'): QueuedEmail[] {
  if (status) {
    return emailQueue.filter(e => e.status === status);
  }
  return [...emailQueue];
}

/**
 * Obtém um email específico da fila
 */
export function getQueuedEmail(id: string): QueuedEmail | undefined {
  return emailQueue.find(e => e.id === id);
}

/**
 * Remove emails enviados/failed da fila (limpeza)
 */
export function cleanQueue(olderThanHours: number = 24): number {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const initialLength = emailQueue.length;
  
  emailQueue = emailQueue.filter(e => {
    // Manter emails pendentes ou em processamento
    if (e.status === 'pending' || e.status === 'processing') {
      return true;
    }
    // Remover emails antigos já processados
    return e.processedAt && e.processedAt > cutoff;
  });
  
  const removed = initialLength - emailQueue.length;
  
  if (removed > 0) {
    console.log(`🧹 Limpeza da fila: ${removed} emails removidos`);
  }
  
  return removed;
}

/**
 * Reenvia emails falhados
 */
export function retryFailed(): number {
  const failedEmails = emailQueue.filter(e => e.status === 'failed');
  
  failedEmails.forEach(email => {
    email.status = 'pending';
    email.attempts = 0;
    email.error = undefined;
  });
  
  console.log(`🔄 Retentando ${failedEmails.length} emails falhados`);
  
  // Iniciar processamento
  if (!isProcessing && failedEmails.length > 0) {
    processQueue().catch(err => {
      console.error('❌ Erro no reprocessamento:', err);
    });
  }
  
  return failedEmails.length;
}

/**
 * Cancela emails pendentes
 */
export function cancelPending(): number {
  const pendingEmails = emailQueue.filter(e => e.status === 'pending');
  
  emailQueue = emailQueue.filter(e => e.status !== 'pending');
  
  console.log(`❌ ${pendingEmails.length} emails cancelados`);
  
  return pendingEmails.length;
}

/**
 * Limpa toda a fila (cuidado!)
 */
export function clearQueue(): void {
  emailQueue = [];
  console.log('🗑️ Fila limpa completamente');
}

/**
 * Helper para sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Estatísticas da fila
 */
export function getQueueStats(): {
  totalProcessed: number;
  successRate: number;
  averageAttempts: number;
  oldestPending?: Date;
} {
  const processed = emailQueue.filter(e => e.status === 'sent' || e.status === 'failed');
  const sent = emailQueue.filter(e => e.status === 'sent');
  const pending = emailQueue.filter(e => e.status === 'pending');
  
  return {
    totalProcessed: processed.length,
    successRate: processed.length > 0 ? (sent.length / processed.length) * 100 : 0,
    averageAttempts: processed.length > 0 
      ? processed.reduce((sum, e) => sum + e.attempts, 0) / processed.length 
      : 0,
    oldestPending: pending.length > 0 
      ? pending.reduce((oldest, e) => e.createdAt < oldest ? e.createdAt : oldest, pending[0].createdAt)
      : undefined,
  };
}

// Auto-limpeza a cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanQueue(24);
  }, 60 * 60 * 1000);
}
