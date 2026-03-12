'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Mail,
  Eye,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Types
interface DashboardStats {
  overview: {
    totalLeads: number;
    emailsSent: number;
    openRate: number;
    responseRate: number;
  };
  leadsOverTime: Array<{ date: string; count: number }>;
  companiesByType: Record<string, number>;
  leadFunnel: {
    total: number;
    qualified: number;
    contacted: number;
    responded: number;
    closed: number;
  };
  emailFunnel: {
    queued: number;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    failed: number;
  };
  recentActivity: Array<{
    type: string;
    id: string;
    title: string;
    subtitle: string;
    timestamp: string;
  }>;
  activeCampaigns: Array<{
    id: string;
    name: string;
    serviceType: string | null;
    _count: { emails: number };
  }>;
}

// Status badge colors
const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  QUALIFIED: 'bg-green-100 text-green-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  RESPONDED: 'bg-purple-100 text-purple-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  NEW: 'Novo',
  QUALIFIED: 'Qualificado',
  CONTACTED: 'Contactado',
  RESPONDED: 'Respondeu',
  CLOSED: 'Fechado',
};

const emailStatusColors: Record<string, string> = {
  QUEUED: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  OPENED: 'bg-green-100 text-green-800',
  CLICKED: 'bg-purple-100 text-purple-800',
  REPLIED: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-red-100 text-red-800',
};

const emailStatusLabels: Record<string, string> = {
  QUEUED: 'Na fila',
  SENT: 'Enviado',
  OPENED: 'Aberto',
  CLICKED: 'Clicado',
  REPLIED: 'Respondido',
  FAILED: 'Falhou',
};

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  isLoading: boolean;
}

function KPICard({ title, value, change, icon, isLoading }: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = (change ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span>{isPositive ? '+' : ''}{change}%</span>
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Colors for pie chart
const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Transform leads over time data for chart
  const leadsChartData = stats?.leadsOverTime.map((item, index) => ({
    name: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'][index] || item.date,
    leads: item.count,
  })) || [];

  // Transform companies by type for pie chart
  const pieData = stats?.companiesByType 
    ? Object.entries(stats.companiesByType).map(([name, value], index) => ({
        name: name.charAt(0) + name.slice(1).toLowerCase(),
        value,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }))
    : [];

  // Email performance mock data (we'd need a separate API endpoint for weekly data)
  const emailPerformanceData = [
    { name: 'Sem 1', emails: stats?.emailFunnel.sent ? Math.floor(stats.emailFunnel.sent / 4) : 0, opened: stats?.emailFunnel.opened ? Math.floor(stats.emailFunnel.opened / 4) : 0 },
    { name: 'Sem 2', emails: stats?.emailFunnel.sent ? Math.floor(stats.emailFunnel.sent / 4) : 0, opened: stats?.emailFunnel.opened ? Math.floor(stats.emailFunnel.opened / 4) : 0 },
    { name: 'Sem 3', emails: stats?.emailFunnel.sent ? Math.floor(stats.emailFunnel.sent / 4) : 0, opened: stats?.emailFunnel.opened ? Math.floor(stats.emailFunnel.opened / 4) : 0 },
    { name: 'Sem 4', emails: stats?.emailFunnel.sent ? Math.floor(stats.emailFunnel.sent / 4) : 0, opened: stats?.emailFunnel.opened ? Math.floor(stats.emailFunnel.opened / 4) : 0 },
  ];

  // Get recent companies from activity
  const recentCompanies = stats?.recentActivity
    .filter(a => a.type === 'LEAD')
    .slice(0, 5) || [];

  // Get recent emails from activity
  const recentEmails = stats?.recentActivity
    .filter(a => a.type === 'EMAIL')
    .slice(0, 5) || [];

  return (
    <div className="min-h-screen">
      <Header 
        title="Dashboard" 
        subtitle="Visão geral do sistema de prospecção" 
      />

      <div className="p-6 space-y-6">
        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total de Leads"
            value={stats?.overview.totalLeads ?? 0}
            icon={<Users className="h-6 w-6 text-primary" />}
            isLoading={isLoading}
          />
          <KPICard
            title="Emails Enviados"
            value={stats?.overview.emailsSent ?? 0}
            icon={<Mail className="h-6 w-6 text-primary" />}
            isLoading={isLoading}
          />
          <KPICard
            title="Taxa de Abertura"
            value={`${stats?.overview.openRate ?? 0}%`}
            icon={<Eye className="h-6 w-6 text-primary" />}
            isLoading={isLoading}
          />
          <KPICard
            title="Taxa de Resposta"
            value={`${stats?.overview.responseRate ?? 0}%`}
            icon={<MessageSquare className="h-6 w-6 text-primary" />}
            isLoading={isLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Leads Descobertos</CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={leadsChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      dot={{ fill: '#0ea5e9' }}
                      name="Leads"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Email Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance de Emails</CardTitle>
              <CardDescription>Últimas 4 semanas</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={emailPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="emails" fill="#0ea5e9" name="Enviados" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="opened" fill="#22c55e" name="Abertos" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart - Companies by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Empresas por Tipo</CardTitle>
              <CardDescription>Distribuição por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[250px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Companies Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Últimas ações no sistema</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                Ver todas
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.slice(0, 5).map((activity) => (
                    <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${activity.type === 'LEAD' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {activity.type === 'LEAD' ? (
                          <Users className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Mail className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{activity.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{activity.subtitle}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Sem atividade recente
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Funnel Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Funil de Leads</CardTitle>
              <CardDescription>Conversão por estágio</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Total', value: stats?.leadFunnel.total ?? 0, color: 'bg-slate-500', percent: 100 },
                    { label: 'Qualificados', value: stats?.leadFunnel.qualified ?? 0, color: 'bg-blue-500', percent: stats ? (stats.leadFunnel.qualified / Math.max(stats.leadFunnel.total, 1)) * 100 : 0 },
                    { label: 'Contactados', value: stats?.leadFunnel.contacted ?? 0, color: 'bg-yellow-500', percent: stats ? (stats.leadFunnel.contacted / Math.max(stats.leadFunnel.total, 1)) * 100 : 0 },
                    { label: 'Responderam', value: stats?.leadFunnel.responded ?? 0, color: 'bg-purple-500', percent: stats ? (stats.leadFunnel.responded / Math.max(stats.leadFunnel.total, 1)) * 100 : 0 },
                    { label: 'Fechados', value: stats?.leadFunnel.closed ?? 0, color: 'bg-green-500', percent: stats ? (stats.leadFunnel.closed / Math.max(stats.leadFunnel.total, 1)) * 100 : 0 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Funil de Emails</CardTitle>
              <CardDescription>Performance de envio</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Enviados', value: stats?.emailFunnel.sent ?? 0, color: 'bg-blue-500' },
                    { label: 'Abertos', value: stats?.emailFunnel.opened ?? 0, color: 'bg-green-500' },
                    { label: 'Clicados', value: stats?.emailFunnel.clicked ?? 0, color: 'bg-purple-500' },
                    { label: 'Respondidos', value: stats?.emailFunnel.replied ?? 0, color: 'bg-emerald-500' },
                    { label: 'Falhou', value: stats?.emailFunnel.failed ?? 0, color: 'bg-red-500' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} transition-all duration-500`}
                          style={{ width: `${stats ? (item.value / Math.max(stats.emailFunnel.sent, 1)) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Campaigns */}
        {stats?.activeCampaigns && stats.activeCampaigns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Campanhas Ativas</CardTitle>
              <CardDescription>Campanhas em andamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.activeCampaigns.map((campaign) => (
                  <div key={campaign.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{campaign.name}</h4>
                      <Badge variant="outline">{campaign.serviceType || 'Geral'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {campaign._count.emails} emails enviados
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
