import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/emails - List emails with filters
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
    const status = searchParams.get('status') || '';
    const companyId = searchParams.get('companyId') || '';
    const campaignId = searchParams.get('campaignId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        status ? { status } : {},
        companyId ? { companyId } : {},
        campaignId ? { campaignId } : {}
      ]
    };

    const [emails, total] = await Promise.all([
      db.email.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true
            }
          },
          campaign: {
            select: {
              id: true,
              name: true,
              serviceType: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      db.email.count({ where })
    ]);

    return NextResponse.json({
      emails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get emails error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar emails' },
      { status: 500 }
    );
  }
}

// POST /api/emails - Queue email for sending
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
      subject,
      body: emailBody
    } = body;

    if (!companyId || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Empresa, assunto e corpo do email são obrigatórios' },
        { status: 400 }
      );
    }

    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Verify campaign exists if provided
    if (campaignId) {
      const campaign = await db.campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        return NextResponse.json(
          { error: 'Campanha não encontrada' },
          { status: 404 }
        );
      }
    }

    const email = await db.email.create({
      data: {
        subject,
        body: emailBody,
        status: 'QUEUED',
        companyId,
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
        },
        campaign: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Email adicionado à fila',
      email
    }, { status: 201 });
  } catch (error) {
    console.error('Create email error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar email' },
      { status: 500 }
    );
  }
}

// PUT /api/emails - Update email status
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status, failedReason } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do email é obrigatório' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['QUEUED', 'SENT', 'OPENED', 'CLICKED', 'REPLIED', 'FAILED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'SENT') {
        updateData.sentAt = new Date();
      } else if (status === 'OPENED') {
        updateData.openedAt = new Date();
      } else if (status === 'CLICKED') {
        updateData.clickedAt = new Date();
      } else if (status === 'REPLIED') {
        updateData.repliedAt = new Date();
      } else if (status === 'FAILED') {
        updateData.failedReason = failedReason || 'Erro desconhecido';
      }
    }

    const email = await db.email.update({
      where: { id },
      data: updateData,
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

    // Update company lastContact if email was sent
    if (status === 'SENT') {
      await db.company.update({
        where: { id: email.companyId },
        data: { 
          lastContact: new Date(),
          status: 'CONTACTED'
        }
      });
    }

    return NextResponse.json({
      message: 'Email atualizado',
      email
    });
  } catch (error) {
    console.error('Update email error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar email' },
      { status: 500 }
    );
  }
}
