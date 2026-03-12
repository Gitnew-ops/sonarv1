'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  Send,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  onActionComplete?: () => void;
}

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export function QuickActions({ onActionComplete }: QuickActionsProps) {
  const { toast } = useToast();
  
  const [actions, setActions] = useState({
    discovery: { loading: false, result: null as ActionResult | null },
    emailQueue: { loading: false, result: null as ActionResult | null },
    testEmail: { loading: false, result: null as ActionResult | null },
  });

  // Run Discovery
  const handleRunDiscovery = async () => {
    setActions(prev => ({ ...prev, discovery: { loading: true, result: null } }));
    
    try {
      const response = await fetch('/api/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoScore: true,
          saveToDb: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao executar descoberta');
      }

      const result: ActionResult = {
        success: true,
        message: `Encontradas ${data.summary.newCompanies} novas empresas`,
        data: data.summary,
      };

      setActions(prev => ({ ...prev, discovery: { loading: false, result } }));
      
      toast({
        title: 'Descoberta Concluída',
        description: result.message,
      });

      onActionComplete?.();
    } catch (error) {
      const result: ActionResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };

      setActions(prev => ({ ...prev, discovery: { loading: false, result } }));
      
      toast({
        title: 'Erro na Descoberta',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  // Process Email Queue
  const handleProcessEmailQueue = async () => {
    setActions(prev => ({ ...prev, emailQueue: { loading: true, result: null } }));
    
    try {
      const response = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', task: 'processEmails' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar fila');
      }

      const result: ActionResult = {
        success: data.success,
        message: data.message || 'Fila de emails processada',
        data: data.result,
      };

      setActions(prev => ({ ...prev, emailQueue: { loading: false, result } }));
      
      toast({
        title: 'Fila Processada',
        description: result.message,
      });

      onActionComplete?.();
    } catch (error) {
      const result: ActionResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };

      setActions(prev => ({ ...prev, emailQueue: { loading: false, result } }));
      
      toast({
        title: 'Erro no Processamento',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  // Send Test Email
  const handleSendTestEmail = async () => {
    setActions(prev => ({ ...prev, testEmail: { loading: true, result: null } }));
    
    try {
      // First get a company to test with
      const companiesResponse = await fetch('/api/companies?limit=1');
      const companiesData = await companiesResponse.json();
      
      if (!companiesResponse.ok || !companiesData.companies?.length) {
        throw new Error('Nenhuma empresa cadastrada para teste. Cadastre uma empresa primeiro.');
      }

      const testCompany = companiesData.companies[0];
      
      if (!testCompany.email) {
        throw new Error('A empresa não possui email cadastrado. Cadastre um email para testar.');
      }

      // Send test email via API
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: testCompany.id,
          customSubject: '[TESTE] Sistema Sonar V 1.0 - Email de Teste',
          customBody: `Este é um email de teste do sistema Sonar V 1.0.

Enviado em: ${new Date().toLocaleString('pt-BR')}

Empresa de teste: ${testCompany.name}

Se você recebeu este email, o sistema de envio está funcionando corretamente.

---
Sistema Sonar V 1.0
MTS Angola`,
          useAI: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email de teste');
      }

      const result: ActionResult = {
        success: true,
        message: `Email de teste enviado para ${testCompany.email}`,
        data,
      };

      setActions(prev => ({ ...prev, testEmail: { loading: false, result } }));
      
      toast({
        title: 'Email de Teste Enviado',
        description: result.message,
      });

      onActionComplete?.();
    } catch (error) {
      const result: ActionResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
      };

      setActions(prev => ({ ...prev, testEmail: { loading: false, result } }));
      
      toast({
        title: 'Erro no Envio',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const ActionButton = ({ 
    onClick, 
    loading, 
    icon: Icon, 
    label, 
    description,
    result,
    color = 'primary'
  }: { 
    onClick: () => void;
    loading: boolean;
    icon: React.ElementType;
    label: string;
    description: string;
    result: ActionResult | null;
    color?: 'primary' | 'secondary' | 'accent';
  }) => (
    <div className="flex flex-col gap-2">
      <Button
        onClick={onClick}
        disabled={loading}
        variant={color === 'primary' ? 'default' : 'outline'}
        className={`w-full justify-start gap-2 h-auto py-3 ${
          color === 'accent' ? 'border-amber-500 text-amber-600 hover:bg-amber-50' : ''
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        <span>{label}</span>
      </Button>
      <p className="text-xs text-muted-foreground pl-2">{description}</p>
      {result && (
        <div className={`flex items-center gap-1 text-xs pl-2 ${
          result.success ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.success ? (
            <CheckCircle className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-amber-500" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>
          Execute ações do sistema com um clique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ActionButton
          onClick={handleRunDiscovery}
          loading={actions.discovery.loading}
          icon={Search}
          label="Executar Descoberta"
          description="Busca novas empresas marítimas na web"
          result={actions.discovery.result}
          color="primary"
        />

        <ActionButton
          onClick={handleProcessEmailQueue}
          loading={actions.emailQueue.loading}
          icon={Send}
          label="Processar Fila de Emails"
          description="Envia emails pendentes na fila"
          result={actions.emailQueue.result}
          color="secondary"
        />

        <ActionButton
          onClick={handleSendTestEmail}
          loading={actions.testEmail.loading}
          icon={Mail}
          label="Enviar Email de Teste"
          description="Testa conexão com o gestor"
          result={actions.testEmail.result}
          color="accent"
        />
      </CardContent>
    </Card>
  );
}
