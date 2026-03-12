'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { QuickActions } from '@/components/emails/quick-actions';
import { EmailStatsCards } from '@/components/emails/email-stats';
import { 
  Plus, 
  MoreHorizontal, 
  Trash2,
  Mail,
  Send,
  FileText,
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  User,
  Ship,
  Wrench,
  Fuel,
  Recycle,
  Building2,
  Calendar,
  TrendingUp,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface Email {
  id: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  repliedAt: string | null;
  failedReason: string | null;
  createdAt: string;
  company: {
    id: string;
    name: string;
    email: string | null;
    type: string;
  };
  campaign?: {
    id: string;
    name: string;
    serviceType: string | null;
  } | null;
}

interface Company {
  id: string;
  name: string;
  email: string | null;
  type: string;
}

interface Campaign {
  id: string;
  name: string;
  serviceType: string | null;
}

interface Template {
  id: string;
  name: string;
  serviceType: string;
  subject: string;
  body?: string;
  variables: string[];
  description?: string;
}

interface ServiceType {
  value: string;
  label: string;
  description?: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  avatarColor: string;
  specialties: string[];
}

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

// Email status colors and labels
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

const emailStatusIcons: Record<string, React.ReactNode> = {
  QUEUED: <Clock className="h-4 w-4" />,
  SENT: <Send className="h-4 w-4" />,
  OPENED: <Eye className="h-4 w-4" />,
  CLICKED: <CheckCircle className="h-4 w-4" />,
  REPLIED: <Mail className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
};

const serviceTypeLabels: Record<string, string> = {
  DIVING: 'Mergulho Comercial',
  SHIPCHANDLER: 'Shipchandler',
  WASTE: 'Gestão de Resíduos',
  BUNKER: 'Bunker MGO',
  GENERAL: 'Apresentação Geral',
};

const serviceTypeDescriptions: Record<string, string> = {
  GENERAL: 'Apresentação completa de todos os serviços marítimos disponíveis',
  DIVING: 'Inspeção subaquática, reparos em casco, limpeza de hélices',
  SHIPCHANDLER: 'Abastecimento de navios, provisões, equipamentos náuticos',
  WASTE: 'Gestão de resíduos, descarte ambiental conforme MARPOL',
  BUNKER: 'Fornecimento de combustível marítimo (Gasóleo Marítimo)',
};

const serviceTypeIcons: Record<string, React.ReactNode> = {
  GENERAL: <Building2 className="h-5 w-5" />,
  DIVING: <Wrench className="h-5 w-5" />,
  SHIPCHANDLER: <Ship className="h-5 w-5" />,
  WASTE: <Recycle className="h-5 w-5" />,
  BUNKER: <Fuel className="h-5 w-5" />,
};

export default function EmailsPage() {
  const { toast } = useToast();
  
  // Email list state
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Stats
  const [stats, setStats] = useState<EmailStats>({
    today: 0,
    thisWeek: 0,
    openRate: 0,
    responseRate: 0,
    pending: 0,
    total: 0,
    sent: 0,
    opened: 0,
    replied: 0,
    failed: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Dialogs
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Compose form
  const [companies, setCompanies] = useState<Company[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  
  const [composeForm, setComposeForm] = useState({
    companyId: '',
    campaignId: '',
    templateId: '',
    serviceType: '',
    agentId: '',
    subject: '',
    body: '',
    useAI: true,
    additionalContext: '',
  });

  // Fetch email stats
  const fetchEmailStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Get all emails to calculate stats
      const response = await fetch('/api/emails?limit=1000');
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');

      const data = await response.json();
      const allEmails = data.emails || [];
      
      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const sentToday = allEmails.filter((e: Email) => 
        e.sentAt && new Date(e.sentAt) >= today
      ).length;
      
      const sentThisWeek = allEmails.filter((e: Email) => 
        e.sentAt && new Date(e.sentAt) >= weekAgo
      ).length;

      const totalSent = allEmails.filter((e: Email) => 
        e.status === 'SENT' || e.status === 'OPENED' || e.status === 'CLICKED' || e.status === 'REPLIED'
      ).length;

      const totalOpened = allEmails.filter((e: Email) => 
        e.status === 'OPENED' || e.status === 'CLICKED' || e.status === 'REPLIED'
      ).length;

      const totalReplied = allEmails.filter((e: Email) => 
        e.status === 'REPLIED'
      ).length;

      const pending = allEmails.filter((e: Email) => e.status === 'QUEUED').length;

      setStats({
        today: sentToday,
        thisWeek: sentThisWeek,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        responseRate: totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0,
        pending,
        total: data.pagination?.total || allEmails.length,
        sent: totalSent,
        opened: totalOpened,
        replied: totalReplied,
        failed: allEmails.filter((e: Email) => e.status === 'FAILED').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await fetch(`/api/emails?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar emails');

      const data = await response.json();
      setEmails(data.emails);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os emails',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, toast]);

  // Fetch companies, campaigns, templates and agents for compose
  const fetchComposeData = async () => {
    try {
      const [companiesRes, campaignsRes, templatesRes, configRes] = await Promise.all([
        fetch('/api/companies?limit=100'),
        fetch('/api/campaigns?limit=100'),
        fetch('/api/emails/send'),
        fetch('/api/config/status'),
      ]);

      if (companiesRes.ok) {
        const data = await companiesRes.json();
        setCompanies(data.companies);
      }

      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns);
      }

      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates(data.templates || []);
        setServiceTypes(data.serviceTypes || []);
      }

      if (configRes.ok) {
        const data = await configRes.json();
        if (data.data?.agents?.list) {
          setAgents(data.data.agents.list);
          // Set default agent (Mariana for marketing/outreach)
          if (!composeForm.agentId && data.data.agents.list.length > 0) {
            const mariana = data.data.agents.list.find((a: Agent) => a.id === 'mariana');
            setComposeForm(prev => ({ ...prev, agentId: mariana?.id || data.data.agents.list[0].id }));
          }
        }
      }
    } catch {
      console.error('Error fetching compose data');
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchEmailStats();
  }, [fetchEmails, fetchEmailStats]);

  useEffect(() => {
    if (isComposeDialogOpen) {
      fetchComposeData();
    }
  }, [isComposeDialogOpen]);

  // Reset compose form
  const resetComposeForm = () => {
    setComposeForm({
      companyId: '',
      campaignId: '',
      templateId: '',
      serviceType: '',
      agentId: agents.find(a => a.id === 'mariana')?.id || agents[0]?.id || '',
      subject: '',
      body: '',
      useAI: true,
      additionalContext: '',
    });
  };

  // Preview email content
  const handlePreview = () => {
    if (!composeForm.companyId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma empresa para visualizar',
        variant: 'destructive',
      });
      return;
    }
    setIsPreviewDialogOpen(true);
  };

  // Send email
  const handleSendEmail = async () => {
    if (!composeForm.companyId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma empresa',
        variant: 'destructive',
      });
      return;
    }

    if (!composeForm.subject || !composeForm.body) {
      if (!composeForm.templateId && !composeForm.serviceType) {
        toast({
          title: 'Erro',
          description: 'Forneça um template ou tipo de serviço para gerar o conteúdo',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: composeForm.companyId,
          campaignId: composeForm.campaignId || null,
          templateId: composeForm.templateId || null,
          serviceType: composeForm.serviceType || null,
          customSubject: composeForm.subject || null,
          customBody: composeForm.body || null,
          useAI: composeForm.useAI,
          additionalContext: composeForm.additionalContext || null,
          agentId: composeForm.agentId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar email');
      }

      toast({
        title: 'Sucesso',
        description: 'Email enviado com sucesso',
      });
      setIsComposeDialogOpen(false);
      resetComposeForm();
      fetchEmails();
      fetchEmailStats();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar email',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open email details
  const openEmailDetails = (email: Email) => {
    setSelectedEmail(email);
    setIsEmailDialogOpen(true);
  };

  // Get selected agent info
  const getSelectedAgent = () => agents.find(a => a.id === composeForm.agentId);

  // Get selected company info
  const getSelectedCompany = () => companies.find(c => c.id === composeForm.companyId);

  // Refresh all data
  const handleRefresh = () => {
    fetchEmails();
    fetchEmailStats();
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Emails" 
        subtitle="Gerenciamento de templates e histórico de emails" 
      />

      <div className="p-6">
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="history">
              <Send className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Email History Tab */}
          <TabsContent value="history" className="space-y-6">
            {/* Stats Cards */}
            <EmailStatsCards stats={stats} isLoading={statsLoading} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Emails Table - Takes 3 columns */}
              <div className="lg:col-span-3 space-y-6">
                {/* Filters and Actions */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="flex flex-col md:flex-row gap-4 flex-1">
                        {/* Search */}
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Pesquisar emails..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="QUEUED">Na fila</SelectItem>
                            <SelectItem value="SENT">Enviado</SelectItem>
                            <SelectItem value="OPENED">Aberto</SelectItem>
                            <SelectItem value="CLICKED">Clicado</SelectItem>
                            <SelectItem value="REPLIED">Respondido</SelectItem>
                            <SelectItem value="FAILED">Falhou</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Refresh Button */}
                        <Button variant="outline" size="icon" onClick={handleRefresh}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Compose Button */}
                      <Button onClick={() => setIsComposeDialogOpen(true)}>
                        <Send className="h-4 w-4 mr-2" />
                        Compor Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Emails Table */}
                <Card>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : emails.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Mail className="h-12 w-12 mb-4" />
                        <p>Nenhum email encontrado</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Assunto</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Campanha</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Enviado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emails.map((email) => (
                            <TableRow key={email.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{email.subject}</p>
                                    <p className="text-sm text-muted-foreground">{email.company.email || '-'}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{email.company.name}</TableCell>
                              <TableCell>{email.campaign?.name || '-'}</TableCell>
                              <TableCell>
                                <Badge className={emailStatusColors[email.status]}>
                                  <span className="flex items-center gap-1">
                                    {emailStatusIcons[email.status]}
                                    {emailStatusLabels[email.status]}
                                  </span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {email.sentAt 
                                  ? new Date(email.sentAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEmailDetails(email)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Send className="h-4 w-4 mr-2" />
                                      Reenviar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((page - 1) * 10) + 1} a {Math.min(page * 10, total)} de {total} emails
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {page} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions Sidebar - Takes 1 column */}
              <div className="lg:col-span-1">
                <QuickActions onActionComplete={handleRefresh} />
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Templates de Email</h2>
                <p className="text-sm text-muted-foreground">
                  Modelos pré-definidos para suas campanhas de prospecção
                </p>
              </div>
            </div>

            {/* Templates Grid with Descriptions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center`}>
                          {serviceTypeIcons[template.serviceType] || <Building2 className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {serviceTypeLabels[template.serviceType] || template.serviceType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Descrição:</p>
                      <p className="text-sm">{serviceTypeDescriptions[template.serviceType] || 'Template personalizado para comunicação com clientes'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Assunto:</p>
                      <p className="text-sm font-medium line-clamp-2">{template.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Variáveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((v) => (
                          <Badge key={v} variant="secondary" className="text-xs">
                            {`{${v}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={() => {
                        setComposeForm(prev => ({ ...prev, templateId: template.id }));
                        setIsComposeDialogOpen(true);
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Service Types Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Tipos de Serviço para IA
                </CardTitle>
                <CardDescription>
                  Categorias disponíveis para geração automática de emails com inteligência artificial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {serviceTypes.map((type) => (
                    <div 
                      key={type.value}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setComposeForm(prev => ({ ...prev, serviceType: type.value }));
                        setIsComposeDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          {serviceTypeIcons[type.value]}
                        </div>
                        <p className="font-medium">{type.label}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {serviceTypeDescriptions[type.value]}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Email Dialog */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Detalhes do Email
              </DialogTitle>
            </DialogHeader>
            {selectedEmail && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Badge className={emailStatusColors[selectedEmail.status]}>
                    <span className="flex items-center gap-1">
                      {emailStatusIcons[selectedEmail.status]}
                      {emailStatusLabels[selectedEmail.status]}
                    </span>
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Assunto</p>
                  <p className="font-medium">{selectedEmail.subject}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="font-medium">{selectedEmail.company.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedEmail.company.email || 'Não informado'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Campanha</p>
                    <p className="font-medium">{selectedEmail.campaign?.name || 'Sem campanha'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Enviado em</p>
                    <p className="font-medium">
                      {selectedEmail.sentAt 
                        ? new Date(selectedEmail.sentAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Não enviado'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Corpo do Email</p>
                  <ScrollArea className="h-48 border rounded-lg p-4">
                    <p className="text-sm whitespace-pre-line">{selectedEmail.body}</p>
                  </ScrollArea>
                </div>

                {selectedEmail.failedReason && (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <p className="font-medium">Motivo da falha:</p>
                    <p>{selectedEmail.failedReason}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Compose Email Dialog */}
        <Dialog open={isComposeDialogOpen} onOpenChange={(v) => { setIsComposeDialogOpen(v); if (!v) resetComposeForm(); }}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compor Novo Email
              </DialogTitle>
              <DialogDescription>
                Crie e envie um email personalizado para uma empresa
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Agent Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Agente Remetente
                </Label>
                <Select 
                  value={composeForm.agentId} 
                  onValueChange={(v) => setComposeForm({ ...composeForm, agentId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <span>{agent.avatar}</span>
                          <span>{agent.name}</span>
                          <span className="text-muted-foreground text-xs">({agent.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Selected Agent Info */}
                {getSelectedAgent() && (
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg mt-2">
                    <Avatar className={`h-10 w-10 ${getSelectedAgent()!.avatarColor}`}>
                      <AvatarFallback className={`${getSelectedAgent()!.avatarColor} text-white`}>
                        {getSelectedAgent()!.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{getSelectedAgent()!.name}</p>
                      <p className="text-sm text-muted-foreground">{getSelectedAgent()!.email}</p>
                    </div>
                    <Badge variant="outline">{getSelectedAgent()!.role}</Badge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Empresa *</Label>
                  <Select 
                    value={composeForm.companyId} 
                    onValueChange={(v) => setComposeForm({ ...composeForm, companyId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                          {company.email && <span className="text-muted-foreground text-xs ml-2">({company.email})</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Campanha (opcional)</Label>
                  <Select 
                    value={composeForm.campaignId} 
                    onValueChange={(v) => setComposeForm({ ...composeForm, campaignId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma campanha" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template</Label>
                  <Select 
                    value={composeForm.templateId} 
                    onValueChange={(v) => setComposeForm({ ...composeForm, templateId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Tipo de Serviço (IA)
                  </Label>
                  <Select 
                    value={composeForm.serviceType} 
                    onValueChange={(v) => setComposeForm({ ...composeForm, serviceType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Gerar com IA" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input 
                  id="subject" 
                  placeholder="Assunto do email"
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Corpo do Email</Label>
                <Textarea 
                  id="body" 
                  placeholder="Conteúdo do email..." 
                  className="min-h-[200px]"
                  value={composeForm.body}
                  onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalContext">Contexto Adicional (para IA)</Label>
                <Textarea 
                  id="additionalContext" 
                  placeholder="Informações adicionais para personalizar o email..." 
                  className="min-h-[60px]"
                  value={composeForm.additionalContext}
                  onChange={(e) => setComposeForm({ ...composeForm, additionalContext: e.target.value })}
                />
              </div>

              {/* Selected Company Info */}
              {getSelectedCompany() && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Destinatário: {getSelectedCompany()!.name}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    {getSelectedCompany()!.email || 'Email não cadastrado'}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handlePreview} disabled={!composeForm.companyId}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </Button>
              <Button variant="outline" onClick={() => setIsComposeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendEmail} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Pré-visualização do Email
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* From/To Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">De:</p>
                  <p className="font-medium">
                    {getSelectedAgent()?.name || 'Sistema'} &lt;{getSelectedAgent()?.email || 'sistema'}&gt;
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Para:</p>
                  <p className="font-medium">
                    {getSelectedCompany()?.name} &lt;{getSelectedCompany()?.email}&gt;
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-xs text-muted-foreground">Assunto:</p>
                <p className="font-medium">{composeForm.subject || '[Assunto será gerado automaticamente]'}</p>
              </div>

              {/* Body */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Corpo:</p>
                <ScrollArea className="h-64 border rounded-lg p-4 bg-muted/20">
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {composeForm.body || '[Conteúdo será gerado automaticamente baseado no template ou tipo de serviço selecionado]'}
                  </pre>
                </ScrollArea>
              </div>

              {/* Template Info */}
              {(composeForm.templateId || composeForm.serviceType) && (
                <div className="flex gap-2">
                  {composeForm.templateId && (
                    <Badge variant="outline">
                      Template: {templates.find(t => t.id === composeForm.templateId)?.name}
                    </Badge>
                  )}
                  {composeForm.serviceType && (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      <Sparkles className="h-3 w-3 mr-1" />
                      IA: {serviceTypeLabels[composeForm.serviceType]}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => { setIsPreviewDialogOpen(false); handleSendEmail(); }} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" />
                Enviar Agora
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
