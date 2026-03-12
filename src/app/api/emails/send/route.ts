/**
 * ===========================================
 * SONAR V 1.0 - API de Envio de Email
 * ===========================================
 * 
 * Envia emails usando o serviço SMTP real
 * Agentes: Mariana (outreach), Claudia (commercial), Pedro (discovery)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateEmailContent } from '@/lib/ai';
import { getTemplateById, processTemplate, EMAIL_TEMPLATES } from '@/lib/email-templates';
import { sendEmail, sendPresentationEmail, type SendEmailOptions } from '@/lib/email-service';
import type { AgentId } from '@/lib/agents-config';

// Mapeamento de tipo de serviço para agente responsável
function getAgentForServiceType(serviceType: string): AgentId {
  const mapping: Record<string, AgentId> = {
    'GENERAL': 'mariana',    // Mariana faz apresentações gerais
    'DIVING': 'claudia',     // Claudia trata serviços técnicos/comerciais
    'SHIPCHANDLER': 'claudia',
    'WASTE': 'claudia',
    'BUNKER': 'claudia',
  };
  return mapping[serviceType] || 'mariana';
}

// POST /api/emails/send - Enviar email usando SMTP real
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      companyId,
      campaignId,
      templateId,
      serviceType,
      customSubject,
      customBody,
      useAI = true,
      additionalContext,
      agentId // Permitir especificar agente manualmente
    } = body;

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar detalhes da empresa
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        vessels: {
          take: 1
        }
      }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    if (!company.email) {
      return NextResponse.json(
        { error: 'Empresa não possui email cadastrado' },
        { status: 400 }
      );
    }

    let subject = customSubject;
    let emailBody = customBody;
    let htmlBody = customBody;

    // Gerar conteúdo usando template ou IA
    if (!subject || !emailBody) {
      if (templateId) {
        // Usar template pré-definido
        const template = getTemplateById(templateId);
        
        if (!template) {
          return NextResponse.json(
            { error: 'Template não encontrado' },
            { status: 404 }
          );
        }

        const variables = {
          company_name: company.name,
          vessel_name: company.vessels[0]?.name || 'vosso navio',
          service: serviceType || ''
        };

        const processed = processTemplate(template, variables);
        subject = subject || processed.subject;
        emailBody = emailBody || processed.body;
        htmlBody = emailBody.replace(/\n/g, '<br>');
      } else if (useAI && serviceType) {
        // Usar IA para gerar conteúdo personalizado
        try {
          const generated = await generateEmailContent(
            company.name,
            serviceType,
            additionalContext
          );
          subject = subject || generated.subject;
          emailBody = emailBody || generated.body;
          htmlBody = emailBody.replace(/\n/g, '<br>');
        } catch (aiError: any) {
          console.error('❌ Erro na geração AI:', aiError);
          return NextResponse.json(
            { error: `Erro na geração do email: ${aiError.message}` },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Forneça templateId ou serviceType com useAI=true' },
          { status: 400 }
        );
      }
    }

    // Determinar agente responsável
    const agent: AgentId = agentId || getAgentForServiceType(serviceType || 'GENERAL');
    
    console.log(`📧 Enviando email via SMTP...`);
    console.log(`   Empresa: ${company.name}`);
    console.log(`   Para: ${company.email}`);
    console.log(`   Agente: ${agent}`);
    console.log(`   Assunto: ${subject}`);

    // Criar registro do email
    const email = await db.email.create({
      data: {
        subject: subject!,
        body: emailBody!,
        status: 'QUEUED',
        companyId: company.id,
        campaignId,
        createdById: session.id
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Enviar email via SMTP real
    try {
      // Preparar HTML completo com template profissional
      const fullHtml = generateEmailHtml(subject!, htmlBody!, agent);
      
      const emailOptions: SendEmailOptions = {
        to: company.email,
        subject: subject!,
        html: fullHtml,
        text: emailBody,
        from: agent,
      };

      // Enviar via SMTP
      const result = await sendEmail(emailOptions);

      if (!result.success) {
        // Marcar email como falhou
        await db.email.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            failedReason: result.error
          }
        });

        console.error(`❌ Falha no envio SMTP: ${result.error}`);
        
        return NextResponse.json(
          { error: `Falha no envio: ${result.error}` },
          { status: 500 }
        );
      }

      // Atualizar status para ENVIADO
      const sentEmail = await db.email.update({
        where: { id: email.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      // Atualizar último contato da empresa
      await db.company.update({
        where: { id: company.id },
        data: {
          lastContact: new Date(),
          status: 'CONTACTED'
        }
      });

      console.log(`✅ Email enviado com sucesso! MessageID: ${result.messageId}`);

      return NextResponse.json({
        message: 'Email enviado com sucesso',
        email: sentEmail,
        messageId: result.messageId,
        agent: agent,
        sentVia: 'SMTP'
      }, { status: 200 });

    } catch (sendError: any) {
      // Marcar email como falhou
      await db.email.update({
        where: { id: email.id },
        data: {
          status: 'FAILED',
          failedReason: sendError.message
        }
      });

      console.error('❌ Erro no envio:', sendError);
      
      return NextResponse.json(
        { error: `Falha no envio: ${sendError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Send email error:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar email' },
      { status: 500 }
    );
  }
}

// GET /api/emails/send - Obter templates e tipos de serviço disponíveis
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      templates: EMAIL_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        serviceType: t.serviceType,
        subject: t.subject,
        variables: t.variables
      })),
      serviceTypes: [
        { value: 'GENERAL', label: 'Apresentação Geral', agent: 'mariana' },
        { value: 'DIVING', label: 'Mergulho Comercial', agent: 'claudia' },
        { value: 'SHIPCHANDLER', label: 'Shipchandler', agent: 'claudia' },
        { value: 'WASTE', label: 'Gestão de Resíduos', agent: 'claudia' },
        { value: 'BUNKER', label: 'Bunker MGO', agent: 'claudia' }
      ],
      agents: [
        { id: 'mariana', name: 'Mariana', role: 'Marketing & CRM', email: 'info@mts-angola.com' },
        { id: 'claudia', name: 'Claudia', role: 'Comercial & Financeiro', email: 'accounts@mts-angola.com' },
        { id: 'pedro', name: 'Pedro', role: 'Operações & Inteligência', email: 'supply.chain@mts-angola.com' }
      ]
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar templates' },
      { status: 500 }
    );
  }
}

/**
 * Gera HTML completo para o email com template profissional
 */
function generateEmailHtml(subject: string, body: string, agent: AgentId): string {
  const agentNames: Record<AgentId, { name: string; role: string }> = {
    mariana: { name: 'Mariana', role: 'Agente de Marketing & CRM' },
    claudia: { name: 'Claudia', role: 'Agente Comercial & Financeiro' },
    pedro: { name: 'Pedro', role: 'Agente de Operações & Inteligência' }
  };

  const agentInfo = agentNames[agent];
  const currentDate = new Date().toLocaleDateString('pt-AO', { 
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.7; 
          color: #334155; 
          max-width: 650px; 
          margin: 0 auto; 
          background: #f8fafc;
        }
        .email-wrapper {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); 
          color: white; 
          padding: 35px 30px; 
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 14px;
        }
        .content { 
          padding: 35px 30px; 
          background: #ffffff;
        }
        .content p {
          margin: 0 0 16px 0;
        }
        .service-highlight {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
          border-left: 4px solid #0ea5e9;
        }
        .service-highlight h3 {
          margin: 0 0 8px 0;
          color: #0f172a;
          font-size: 16px;
        }
        .service-highlight p {
          margin: 0;
          font-size: 14px;
          color: #475569;
        }
        .signature { 
          margin-top: 35px; 
          padding-top: 25px; 
          border-top: 2px solid #e2e8f0;
        }
        .signature p {
          margin: 0 0 4px 0;
          font-size: 14px;
        }
        .signature strong {
          color: #0f172a;
        }
        .footer { 
          background: #f8fafc; 
          padding: 25px 30px; 
          text-align: center; 
          font-size: 12px; 
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer p {
          margin: 0 0 8px 0;
        }
        .emoji {
          font-size: 18px;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background: #f8fafc;">
      <div class="email-wrapper">
        <div class="header">
          <h1>⚓ MTS Angola</h1>
          <p>Serviços Marítimos Profissionais</p>
        </div>
        
        <div class="content">
          ${body}
          
          <div class="signature">
            <p>Com os melhores cumprimentos,</p>
            <p><strong>${agentInfo.name}</strong><br>
            ${agentInfo.role}<br>
            <strong>MTS Angola</strong></p>
            <p>
              <span class="emoji">📧</span> ${agent}@mts-angola.com<br>
              <span class="emoji">🌐</span> www.mts-angola.com
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>Este email foi enviado por ${agentInfo.name} via Sistema Sonar V 1.0</p>
          <p>MTS Angola | Serviços Marítimos | Angola</p>
          <p>${currentDate}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
