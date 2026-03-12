'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Mail,
  Send,
  Eye,
  MessageSquare,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface EmailStats {
  today: number;
  thisWeek: number;
  openRate: number;
  responseRate: number;
  pending: number;
  total: number;
  sent: number;
  opened: number;
  replied: number;
  failed: number;
}

interface EmailStatsCardsProps {
  stats?: EmailStats | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function EmailStatsCards({ stats, isLoading }: EmailStatsCardsProps) {
  const [animatedStats, setAnimatedStats] = useState({
    today: 0,
    thisWeek: 0,
    openRate: 0,
    responseRate: 0,
    pending: 0,
  });

  // Animate numbers
  useEffect(() => {
    if (!stats) return;
    
    const duration = 1000;
    const steps = 20;
    const interval = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setAnimatedStats({
        today: Math.round(stats.today * progress),
        thisWeek: Math.round(stats.thisWeek * progress),
        openRate: Math.round(stats.openRate * progress * 10) / 10,
        responseRate: Math.round(stats.responseRate * progress * 10) / 10,
        pending: Math.round(stats.pending * progress),
      });
      
      if (step >= steps) {
        clearInterval(timer);
        setAnimatedStats({
          today: stats.today,
          thisWeek: stats.thisWeek,
          openRate: stats.openRate,
          responseRate: stats.responseRate,
          pending: stats.pending,
        });
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [stats]);

  const statCards = [
    {
      title: 'Enviados Hoje',
      value: animatedStats.today,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      progress: stats ? (stats.today / Math.max(stats.thisWeek, 1)) * 100 : 0,
    },
    {
      title: 'Esta Semana',
      value: animatedStats.thisWeek,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Taxa de Abertura',
      value: `${animatedStats.openRate}%`,
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      progress: animatedStats.openRate,
      trend: stats && stats.openRate > 20 ? 'up' : stats && stats.openRate < 10 ? 'down' : 'neutral',
    },
    {
      title: 'Taxa de Resposta',
      value: `${animatedStats.responseRate}%`,
      icon: MessageSquare,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      progress: animatedStats.responseRate,
      trend: stats && stats.responseRate > 10 ? 'up' : stats && stats.responseRate < 5 ? 'down' : 'neutral',
    },
    {
      title: 'Na Fila',
      value: animatedStats.pending,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground mt-2">Carregando...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{stat.title}</span>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              {stat.trend && (
                <span className="mb-1">
                  {stat.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                  {stat.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                </span>
              )}
            </div>
            {stat.progress !== undefined && (
              <Progress 
                value={stat.progress} 
                className="h-1 mt-2"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Stats Summary Component for the dashboard
export function EmailStatsSummary({ stats }: { stats: EmailStats | null }) {
  if (!stats) return null;

  const getOpenRateLabel = (rate: number) => {
    if (rate >= 20) return { label: 'Excelente', color: 'text-green-600' };
    if (rate >= 10) return { label: 'Bom', color: 'text-blue-600' };
    if (rate >= 5) return { label: 'Regular', color: 'text-amber-600' };
    return { label: 'Baixo', color: 'text-red-600' };
  };

  const openRateInfo = getOpenRateLabel(stats.openRate);
  const responseRateInfo = getOpenRateLabel(stats.responseRate);

  return (
    <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
      <div>
        <p className="text-xs text-muted-foreground">Taxa de Abertura</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold">{stats.openRate}%</p>
          <span className={`text-xs ${openRateInfo.color}`}>{openRateInfo.label}</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Taxa de Resposta</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold">{stats.responseRate}%</p>
          <span className={`text-xs ${responseRateInfo.color}`}>{responseRateInfo.label}</span>
        </div>
      </div>
    </div>
  );
}
