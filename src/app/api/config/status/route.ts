/**
 * API: Status dos Agentes e Configurações de Comunicação
 * GET /api/config/status
 */

import { NextResponse } from 'next/server';
import { getActiveAgents, getAgentsOverview, HUMAN_MANAGER } from '@/lib/agents-config';
import { getEmailSystemStatus } from '@/lib/email-config';
import { getAlertSystemStatus, getWhatsappUsage } from '@/lib/twilio-config';

export async function GET() {
  try {
    const agents = getActiveAgents();
    const overview = getAgentsOverview();
    const emailStatus = getEmailSystemStatus();
    const alertStatus = getAlertSystemStatus();
    const whatsappUsage = getWhatsappUsage();
    
    return NextResponse.json({
      success: true,
      data: {
        // Agentes IA
        agents: {
          total: overview.total,
          list: agents.map(a => ({
            id: a.id,
            name: a.name,
            role: a.role,
            email: a.email,
            avatar: a.avatar,
            avatarColor: a.avatarColor,
            specialties: a.specialties,
            responsibilities: a.responsibilities,
          })),
        },
        
        // Gestor Humano
        humanManager: {
          name: HUMAN_MANAGER.name,
          email: HUMAN_MANAGER.email,
          phone: HUMAN_MANAGER.phone,
          receivesReports: HUMAN_MANAGER.receivesReports,
          receivesAlerts: HUMAN_MANAGER.receivesAlerts,
        },
        
        // Status de Comunicação
        communication: {
          primary: {
            channel: 'Email SMTP',
            server: emailStatus.server,
            port: emailStatus.port,
            secure: emailStatus.secure,
            configured: emailStatus.configured,
            accounts: emailStatus.accounts,
            cost: 'GRATUITO',
            limit: 'Ilimitado',
          },
          secondary: {
            channel: 'WhatsApp (Twilio)',
            configured: alertStatus.twilioConfigured,
            botNumber: alertStatus.botNumber,
            recipientPhone: alertStatus.recipientPhone,
            cost: 'PAGO',
            usage: whatsappUsage,
            costWarning: alertStatus.costWarning,
          },
        },
        
        // Configurações
        config: {
          emailMissing: emailStatus.missingCredentials,
          alertMissing: alertStatus.missingCredentials,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao obter status do sistema' },
      { status: 500 }
    );
  }
}
