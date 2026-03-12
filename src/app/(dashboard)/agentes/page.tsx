'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Phone,
  Server,
  Shield
} from 'lucide-react';

// Types
interface Agent {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  avatarColor: string;
  specialties: string[];
  responsibilities: string[];
}

interface CommunicationStatus {
  primary: {
    channel: string;
    server: string;
    port: number;
    secure: boolean;
    configured: boolean;
    accounts: number;
    cost: string;
    limit: string;
  };
  secondary: {
    channel: string;
    configured: boolean;
    botNumber: string;
    recipientPhone: string;
    cost: string;
    usage: { used: number; limit: number; remaining: number };
    costWarning: string;
  };
}

interface ConfigData {
  agents: {
    total: number;
    list: Agent[];
  };
  humanManager: {
    name: string;
    email: string;
    phone: string;
    receivesReports: boolean;
    receivesAlerts: boolean;
  };
  communication: CommunicationStatus;
  config: {
    emailMissing: string[];
    alertMissing: string[];
  };
}

export default function AgentesPage() {
  const [data, setData] = useState<ConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }> | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/config/status');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (type: 'email' | 'whatsapp' | 'all') => {
    setTesting(type);
    setTestResults(null);
    try {
      const response = await fetch('/api/config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: type }),
      });
      const result = await response.json();
      setTestResults(result.results);
    } catch (error) {
      console.error('Erro ao testar:', error);
    } finally {
      setTesting(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title="Agentes & Comunicação" 
        subtitle="Configuração dos agentes IA e canais de comunicação" 
      />

      <div className="p-6 space-y-6">
        {/* Agentes IA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data?.agents.list.map((agent) => (
            <Card key={agent.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${agent.avatarColor}`} />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full ${agent.avatarColor} flex items-center justify-center text-2xl`}>
                    {agent.avatar}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>{agent.role}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {agent.email}
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Especialidades:</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.specialties.map((spec, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Responsabilidades:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {agent.responsibilities.slice(0, 3).map((resp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 mt-0.5 text-green-500" />
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gestor Humano */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center text-2xl">
                👨‍💼
              </div>
              <div>
                <CardTitle>{data?.humanManager.name}</CardTitle>
                <CardDescription>Recebe relatórios e alertas do sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {data?.humanManager.email}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {data?.humanManager.phone}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Recebe alertas WhatsApp: {data?.humanManager.receivesAlerts ? 'Sim' : 'Não'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Canais de Comunicação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email SMTP */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-lg">Email SMTP</CardTitle>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  GRATUITO
                </Badge>
              </div>
              <CardDescription>Canal Primário - Comunicação ilimitada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Servidor:</span>
                  <span>{data?.communication.primary.server}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Porta:</span>
                  <span>{data?.communication.primary.port} (SSL)</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">Status:</span>
                {data?.communication.primary.configured ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" /> Configurado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Não configurado
                  </Badge>
                )}
              </div>
              
              {data?.config.emailMissing && data.config.emailMissing.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Faltam configurar: {data.config.emailMissing.join(', ')}</span>
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => testConnection('email')}
                disabled={testing !== null}
              >
                {testing === 'email' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>
            </CardContent>
          </Card>

          {/* WhatsApp Twilio */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">WhatsApp (Twilio)</CardTitle>
                </div>
                <Badge variant="destructive">
                  PAGO
                </Badge>
              </div>
              <CardDescription>Canal Secundário - Apenas alertas críticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Bot:</span>
                  <span className="ml-2">{data?.communication.secondary.botNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gestor:</span>
                  <span className="ml-2">{data?.communication.secondary.recipientPhone}</span>
                </div>
              </div>
              
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Uso diário:</span>
                  <span>
                    {data?.communication.secondary.usage.used} / {data?.communication.secondary.usage.limit}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-2">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ 
                      width: `${((data?.communication.secondary.usage.used || 0) / (data?.communication.secondary.usage.limit || 1)) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Restam: {data?.communication.secondary.usage.remaining} mensagens hoje
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2 text-amber-800 text-sm">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>{data?.communication.secondary.costWarning}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => testConnection('whatsapp')}
                disabled={testing !== null}
              >
                {testing === 'whatsapp' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Testar Conexão
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Resultados dos Testes */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle>Resultados dos Testes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(testResults).map(([key, result]) => (
                  <div 
                    key={key}
                    className={`p-3 rounded-lg flex items-center gap-3 ${
                      result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium capitalize">{key}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
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
