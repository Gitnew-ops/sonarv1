/**
 * ===========================================
 * SONAR V 1.0 - API de Empresas
 * ===========================================
 * 
 * CRUD de empresas com notificações automáticas
 * - WhatsApp para leads com score >= 80
 * - Email para o gestor
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyNewLead } from '@/lib/notifications';

// GET /api/companies - Listar empresas com filtros
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const country = searchParams.get('country') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { country: { contains: search } },
            { city: { contains: search } }
          ]
        } : {},
        type ? { type } : {},
        status ? { status } : {},
        country ? { country } : {}
      ]
    };

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              vessels: true,
              emails: true
            }
          }
        }
      }),
      db.company.count({ where })
    ]);

    return NextResponse.json({
      companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar empresas' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Criar nova empresa
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
      name,
      type = 'SHIPOWNER',
      email,
      phone,
      country,
      city,
      website,
      status = 'NEW',
      score = 0,
      notes,
      skipNotification = false // Permitir pular notificação
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da empresa é obrigatório' },
        { status: 400 }
      );
    }

    // Validar tipo
    const validTypes = ['SHIPOWNER', 'ARMADOR', 'BROKER', 'AGENT'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use: SHIPOWNER, ARMADOR, BROKER ou AGENT' },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = ['NEW', 'QUALIFIED', 'CONTACTED', 'RESPONDED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: NEW, QUALIFIED, CONTACTED, RESPONDED ou CLOSED' },
        { status: 400 }
      );
    }

    console.log(`🏢 Criando empresa: ${name}`);
    console.log(`   Tipo: ${type}`);
    console.log(`   Score: ${score}`);
    console.log(`   País: ${country || 'N/A'}`);

    // Criar empresa
    const company = await db.company.create({
      data: {
        name,
        type,
        email,
        phone,
        country,
        city,
        website,
        status,
        score,
        notes,
        createdById: session.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`✅ Empresa criada: ${company.id}`);

    // Notificar se score >= 80 (lead qualificado)
    const companyScore = score || 0;
    
    if (!skipNotification && companyScore >= 80) {
      console.log(`🎯 Lead qualificado! Score ${companyScore} >= 80`);
      console.log(`📱 Enviando notificação via Email e WhatsApp...`);
      
      // Enviar notificação (Email + WhatsApp)
      try {
        const notificationResult = await notifyNewLead(company);
        
        console.log(`📬 Resultado da notificação:`);
        console.log(`   Email: ${notificationResult.email?.success ? '✅ Enviado' : '❌ Falhou'}`);
        console.log(`   WhatsApp: ${notificationResult.whatsapp?.success ? '✅ Enviado' : '❌ ' + (notificationResult.whatsapp?.error || 'Falhou')}`);
        console.log(`   Mensagem: ${notificationResult.message}`);
      } catch (notificationError) {
        console.error('❌ Erro ao enviar notificação:', notificationError);
        // Não falhar a criação da empresa por causa da notificação
      }
    } else if (!skipNotification) {
      console.log(`📊 Lead com score ${companyScore} - Notificação apenas por email`);
      
      // Enviar apenas email (não é lead qualificado para WhatsApp)
      try {
        const notificationResult = await notifyNewLead(company);
        console.log(`📬 Email enviado: ${notificationResult.email?.success ? '✅' : '❌'}`);
      } catch (notificationError) {
        console.error('❌ Erro ao enviar email:', notificationError);
      }
    }

    return NextResponse.json({
      message: 'Empresa criada com sucesso',
      company,
      notification: {
        sent: companyScore >= 80,
        channels: companyScore >= 80 ? ['email', 'whatsapp'] : ['email']
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar empresa' },
      { status: 500 }
    );
  }
}
