import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/campaigns - List campaigns
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
    const serviceType = searchParams.get('serviceType') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        status ? { status } : {},
        serviceType ? { serviceType } : {}
      ]
    };

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
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
              emails: true
            }
          }
        }
      }),
      db.campaign.count({ where })
    ]);

    // Get email statistics for each campaign
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const emailStats = await db.email.groupBy({
          by: ['status'],
          where: { campaignId: campaign.id },
          _count: true
        });

        const stats = {
          total: campaign._count.emails,
          sent: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          failed: 0
        };

        emailStats.forEach(stat => {
          if (stat.status === 'SENT') stats.sent = stat._count;
          if (stat.status === 'OPENED') stats.opened = stat._count;
          if (stat.status === 'CLICKED') stats.clicked = stat._count;
          if (stat.status === 'REPLIED') stats.replied = stat._count;
          if (stat.status === 'FAILED') stats.failed = stat._count;
        });

        return {
          ...campaign,
          stats
        };
      })
    );

    return NextResponse.json({
      campaigns: campaignsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar campanhas' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - Create campaign
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
      description,
      serviceType,
      startDate,
      endDate
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da campanha é obrigatório' },
        { status: 400 }
      );
    }

    // Validate service type
    const validServiceTypes = ['DIVING', 'SHIPCHANDLER', 'WASTE', 'BUNKER', null];
    if (serviceType && !validServiceTypes.includes(serviceType)) {
      return NextResponse.json(
        { error: 'Tipo de serviço inválido' },
        { status: 400 }
      );
    }

    const campaign = await db.campaign.create({
      data: {
        name,
        description,
        serviceType,
        status: 'DRAFT',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
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

    return NextResponse.json({
      message: 'Campanha criada com sucesso',
      campaign
    }, { status: 201 });
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar campanha' },
      { status: 500 }
    );
  }
}

// PUT /api/campaigns - Update campaign
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
    const {
      id,
      name,
      description,
      serviceType,
      status,
      startDate,
      endDate
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da campanha é obrigatório' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const existingCampaign = await db.campaign.findUnique({
      where: { id }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    // Validate status if provided
    const validStatuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: DRAFT, ACTIVE, PAUSED ou COMPLETED' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    const campaign = await db.campaign.update({
      where: { id },
      data: updateData,
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
            emails: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Campanha atualizada',
      campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar campanha' },
      { status: 500 }
    );
  }
}

// DELETE /api/campaigns - Delete campaign
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID da campanha é obrigatório' },
        { status: 400 }
      );
    }

    // Check if campaign exists
    const existingCampaign = await db.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            emails: true
          }
        }
      }
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campanha não encontrada' },
        { status: 404 }
      );
    }

    // Prevent deletion if campaign has emails
    if (existingCampaign._count.emails > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir campanha com emails associados. Pause ou arquive a campanha.' },
        { status: 400 }
      );
    }

    await db.campaign.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Campanha excluída com sucesso'
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir campanha' },
      { status: 500 }
    );
  }
}
