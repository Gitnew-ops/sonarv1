import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/dashboard - Return aggregated statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Get date ranges
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Execute all queries in parallel for performance
    const [
      totalLeads,
      emailsSent,
      emailsOpened,
      emailsReplied,
      leadsOverTime,
      companiesByType,
      recentActivity,
      campaignStats
    ] = await Promise.all([
      // Total leads count
      db.company.count(),
      
      // Emails sent count
      db.email.count({
        where: { status: { in: ['SENT', 'OPENED', 'CLICKED', 'REPLIED'] } }
      }),
      
      // Emails opened count
      db.email.count({
        where: { status: { in: ['OPENED', 'CLICKED', 'REPLIED'] } }
      }),
      
      // Emails replied count
      db.email.count({
        where: { status: 'REPLIED' }
      }),
      
      // Leads over time (last 7 days)
      db.$queryRaw<Array<{ date: string; count: number }>>`
        SELECT date(createdAt) as date, COUNT(*) as count
        FROM Company
        WHERE createdAt >= ${sevenDaysAgo.toISOString()}
        GROUP BY date(createdAt)
        ORDER BY date(createdAt) ASC
      `,
      
      // Companies by type distribution
      db.company.groupBy({
        by: ['type'],
        _count: true
      }),
      
      // Recent activity (last 10 actions)
      Promise.all([
        db.company.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            type: true,
            createdAt: true
          }
        }),
        db.email.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          where: { status: 'SENT' },
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
            company: {
              select: { name: true }
            }
          }
        })
      ]),
      
      // Campaign statistics
      db.campaign.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          serviceType: true,
          _count: {
            select: { emails: true }
          }
        }
      })
    ]);

    // Calculate rates
    const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0;
    const responseRate = emailsSent > 0 ? Math.round((emailsReplied / emailsSent) * 100) : 0;

    // Format leads over time data
    const leadsData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const existing = leadsOverTime.find(l => l.date === dateStr);
      leadsData.push({
        date: dateStr,
        count: existing ? existing.count : 0
      });
    }

    // Format companies by type
    const typeDistribution = companiesByType.reduce((acc, item) => {
      acc[item.type] = item._count;
      return acc;
    }, {} as Record<string, number>);

    // Combine recent activity
    const recentLeads = recentActivity[0].map(company => ({
      type: 'LEAD',
      id: company.id,
      title: company.name,
      subtitle: company.type,
      timestamp: company.createdAt
    }));

    const recentEmails = recentActivity[1].map(email => ({
      type: 'EMAIL',
      id: email.id,
      title: email.subject,
      subtitle: email.company.name,
      timestamp: email.createdAt
    }));

    const allActivity = [...recentLeads, ...recentEmails]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    // Get additional metrics
    const [
      qualifiedLeads,
      contactedLeads,
      respondedLeads,
      closedLeads
    ] = await Promise.all([
      db.company.count({ where: { status: 'QUALIFIED' } }),
      db.company.count({ where: { status: 'CONTACTED' } }),
      db.company.count({ where: { status: 'RESPONDED' } }),
      db.company.count({ where: { status: 'CLOSED' } })
    ]);

    // Lead funnel
    const leadFunnel = {
      total: totalLeads,
      qualified: qualifiedLeads,
      contacted: contactedLeads,
      responded: respondedLeads,
      closed: closedLeads
    };

    // Email funnel
    const emailFunnel = {
      queued: await db.email.count({ where: { status: 'QUEUED' } }),
      sent: emailsSent,
      opened: emailsOpened,
      clicked: await db.email.count({ where: { status: 'CLICKED' } }),
      replied: emailsReplied,
      failed: await db.email.count({ where: { status: 'FAILED' } })
    };

    return NextResponse.json({
      overview: {
        totalLeads,
        emailsSent,
        openRate,
        responseRate
      },
      leadsOverTime: leadsData,
      companiesByType: typeDistribution,
      leadFunnel,
      emailFunnel,
      recentActivity: allActivity,
      activeCampaigns: campaignStats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
