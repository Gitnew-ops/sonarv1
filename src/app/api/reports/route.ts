import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateReportSummary } from '@/lib/ai';

// GET /api/reports - List reports
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
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    const where = type ? { type } : {};

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { generatedAt: 'desc' }
      }),
      db.report.count({ where })
    ]);

    // Parse JSON data for each report
    const parsedReports = reports.map(report => ({
      ...report,
      data: JSON.parse(report.data)
    }));

    return NextResponse.json({
      reports: parsedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar relatórios' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Generate new report
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
    const { type, title, startDate, endDate } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Tipo de relatório é obrigatório' },
        { status: 400 }
      );
    }

    // Validate report type
    const validTypes = ['LEADS', 'EMAILS', 'CAMPAIGNS', 'PERFORMANCE'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Tipo inválido. Use: LEADS, EMAILS, CAMPAIGNS ou PERFORMANCE' },
        { status: 400 }
      );
    }

    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Collect data based on report type
    let reportData: any = {};
    let summary = '';

    switch (type) {
      case 'LEADS':
        reportData = await generateLeadsReport(start, end);
        break;
      case 'EMAILS':
        reportData = await generateEmailsReport(start, end);
        break;
      case 'CAMPAIGNS':
        reportData = await generateCampaignsReport(start, end);
        break;
      case 'PERFORMANCE':
        reportData = await generatePerformanceReport(start, end);
        break;
    }

    // Generate AI summary
    try {
      summary = await generateReportSummary({
        type,
        leadsCount: reportData.summary?.totalLeads,
        emailsSent: reportData.summary?.totalEmails,
        openRate: reportData.summary?.openRate,
        responseRate: reportData.summary?.responseRate,
        topCompanies: reportData.topCompanies?.map((c: any) => c.name),
        period: `${start.toLocaleDateString('pt-AO')} - ${end.toLocaleDateString('pt-AO')}`
      });
    } catch (aiError) {
      console.error('AI summary error:', aiError);
      summary = `Relatório ${type} gerado para o período ${start.toLocaleDateString('pt-AO')} - ${end.toLocaleDateString('pt-AO')}`;
    }

    // Save report to database
    const report = await db.report.create({
      data: {
        type,
        title: title || `Relatório ${type} - ${new Date().toLocaleDateString('pt-AO')}`,
        data: JSON.stringify({
          ...reportData,
          summary,
          period: {
            start: start.toISOString(),
            end: end.toISOString()
          }
        })
      }
    });

    return NextResponse.json({
      message: 'Relatório gerado com sucesso',
      report: {
        ...report,
        data: JSON.parse(report.data)
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}

// DELETE /api/reports - Delete report
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
        { error: 'ID do relatório é obrigatório' },
        { status: 400 }
      );
    }

    await db.report.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Relatório excluído com sucesso'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir relatório' },
      { status: 500 }
    );
  }
}

// Helper functions to generate report data
async function generateLeadsReport(startDate: Date, endDate: Date) {
  const totalLeads = await db.company.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const leadsByStatus = await db.company.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });

  const leadsByType = await db.company.groupBy({
    by: ['type'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });

  const topCompanies = await db.company.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { score: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      type: true,
      score: true,
      status: true
    }
  });

  return {
    summary: {
      totalLeads,
      statusDistribution: leadsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>)
    },
    leadsByType: leadsByType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>),
    topCompanies
  };
}

async function generateEmailsReport(startDate: Date, endDate: Date) {
  const totalEmails = await db.email.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  });

  const emailsByStatus = await db.email.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });

  const sentEmails = await db.email.count({
    where: {
      status: { in: ['SENT', 'OPENED', 'CLICKED', 'REPLIED'] },
      createdAt: { gte: startDate, lte: endDate }
    }
  });

  const openedEmails = await db.email.count({
    where: {
      status: { in: ['OPENED', 'CLICKED', 'REPLIED'] },
      createdAt: { gte: startDate, lte: endDate }
    }
  });

  const repliedEmails = await db.email.count({
    where: {
      status: 'REPLIED',
      createdAt: { gte: startDate, lte: endDate }
    }
  });

  const openRate = sentEmails > 0 ? Math.round((openedEmails / sentEmails) * 100) : 0;
  const responseRate = sentEmails > 0 ? Math.round((repliedEmails / sentEmails) * 100) : 0;

  const topCompanies = await db.$queryRaw<Array<{ name: string; count: number }>>`
    SELECT c.name, COUNT(e.id) as count
    FROM Company c
    JOIN Email e ON c.id = e.companyId
    WHERE e.createdAt >= ${startDate.toISOString()} AND e.createdAt <= ${endDate.toISOString()}
    GROUP BY c.id, c.name
    ORDER BY count DESC
    LIMIT 10
  `;

  return {
    summary: {
      totalEmails,
      totalSent: sentEmails,
      openRate,
      responseRate
    },
    emailsByStatus: emailsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    topCompanies
  };
}

async function generateCampaignsReport(startDate: Date, endDate: Date) {
  const campaigns = await db.campaign.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      _count: {
        select: { emails: true }
      }
    }
  });

  const campaignsByStatus = await db.campaign.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });

  const campaignsByService = await db.campaign.groupBy({
    by: ['serviceType'],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    _count: true
  });

  return {
    summary: {
      totalCampaigns: campaigns.length,
      totalEmails: campaigns.reduce((sum, c) => sum + c._count.emails, 0)
    },
    campaigns,
    campaignsByStatus: campaignsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>),
    campaignsByService: campaignsByService.reduce((acc, item) => {
      if (item.serviceType) {
        acc[item.serviceType] = item._count;
      }
      return acc;
    }, {} as Record<string, number>)
  };
}

async function generatePerformanceReport(startDate: Date, endDate: Date) {
  const leadsData = await generateLeadsReport(startDate, endDate);
  const emailsData = await generateEmailsReport(startDate, endDate);
  const campaignsData = await generateCampaignsReport(startDate, endDate);

  // Calculate conversion rates
  const leadToContact = leadsData.summary.totalLeads > 0
    ? Math.round(((leadsData.summary.statusDistribution['CONTACTED'] || 0) / leadsData.summary.totalLeads) * 100)
    : 0;

  const leadToResponse = leadsData.summary.totalLeads > 0
    ? Math.round(((leadsData.summary.statusDistribution['RESPONDED'] || 0) / leadsData.summary.totalLeads) * 100)
    : 0;

  return {
    summary: {
      totalLeads: leadsData.summary.totalLeads,
      totalEmails: emailsData.summary.totalEmails,
      openRate: emailsData.summary.openRate,
      responseRate: emailsData.summary.responseRate,
      leadToContactRate: leadToContact,
      leadToResponseRate: leadToResponse
    },
    leads: leadsData,
    emails: emailsData,
    campaigns: campaignsData,
    topCompanies: [...leadsData.topCompanies].slice(0, 5)
  };
}
