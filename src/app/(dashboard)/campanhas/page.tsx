'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Pencil, 
  Trash2,
  Mail,
  Eye,
  Calendar,
  Loader2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface CampaignStats {
  total: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  failed: number;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  serviceType: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    emails: number;
  };
  stats?: CampaignStats;
}

interface CampaignsResponse {
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Status colors and labels
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  COMPLETED: 'Concluída',
};

const serviceTypeLabels: Record<string, string> = {
  DIVING: 'Mergulho',
  SHIPCHANDLER: 'Shipchandler',
  WASTE: 'Gestão de Resíduos',
  BUNKER: 'Bunker',
};

// Campaign Card Component
interface CampaignCardProps {
  campaign: Campaign;
  onView: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onStatusChange: (campaign: Campaign, newStatus: string) => void;
  onDelete: (campaign: Campaign) => void;
  isUpdating: boolean;
}

function CampaignCard({ campaign, onView, onEdit, onStatusChange, onDelete, isUpdating }: CampaignCardProps) {
  const stats = campaign.stats || { total: 0, sent: 0, opened: 0, clicked: 0, replied: 0, failed: 0 };
  const openRate = stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0;
  const replyRate = stats.sent > 0 ? Math.round((stats.replied / stats.sent) * 100) : 0;
  const progress = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {campaign.description || 'Sem descrição'}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isUpdating}>
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreHorizontal className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(campaign)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(campaign)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {campaign.status === 'ACTIVE' && (
                <DropdownMenuItem onClick={() => onStatusChange(campaign, 'PAUSED')}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </DropdownMenuItem>
              )}
              {(campaign.status === 'DRAFT' || campaign.status === 'PAUSED') && (
                <DropdownMenuItem onClick={() => onStatusChange(campaign, 'ACTIVE')}>
                  <Play className="h-4 w-4 mr-2" />
                  Ativar
                </DropdownMenuItem>
              )}
              {campaign.status === 'ACTIVE' && (
                <DropdownMenuItem onClick={() => onStatusChange(campaign, 'COMPLETED')}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Concluir
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDelete(campaign)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status and Type */}
        <div className="flex items-center gap-2">
          <Badge className={statusColors[campaign.status]}>
            {statusLabels[campaign.status]}
          </Badge>
          {campaign.serviceType && (
            <Badge variant="outline">
              {serviceTypeLabels[campaign.serviceType] || campaign.serviceType}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-2xl font-bold">{stats.sent}</p>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-2xl font-bold text-green-600">{openRate}%</p>
            <p className="text-xs text-muted-foreground">Abertura</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <p className="text-2xl font-bold text-primary">{replyRate}%</p>
            <p className="text-xs text-muted-foreground">Respostas</p>
          </div>
        </div>

        {/* Progress bar for active campaigns */}
        {campaign.status === 'ACTIVE' && stats.total > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Dates */}
        {campaign.startDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(campaign.startDate).toLocaleDateString('pt-BR')}
              {campaign.endDate && ` - ${new Date(campaign.endDate).toLocaleDateString('pt-BR')}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CampanhasPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serviceType: '',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
  });

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/campaigns?limit=100');
      if (!response.ok) throw new Error('Erro ao carregar campanhas');

      const data: CampaignsResponse = await response.json();
      setCampaigns(data.campaigns);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as campanhas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      serviceType: '',
      status: 'DRAFT',
      startDate: '',
      endDate: '',
    });
  };

  // Create campaign
  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da campanha é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          serviceType: formData.serviceType || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar campanha');
      }

      toast({
        title: 'Sucesso',
        description: 'Campanha criada com sucesso',
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar campanha',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update campaign
  const handleUpdate = async () => {
    if (!selectedCampaign) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCampaign.id,
          name: formData.name,
          description: formData.description || null,
          serviceType: formData.serviceType || null,
          status: formData.status,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar campanha');
      }

      toast({
        title: 'Sucesso',
        description: 'Campanha atualizada com sucesso',
      });
      setIsEditDialogOpen(false);
      setSelectedCampaign(null);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar campanha',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Change campaign status
  const handleStatusChange = async (campaign: Campaign, newStatus: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: campaign.id,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar status');
      }

      toast({
        title: 'Sucesso',
        description: `Campanha ${newStatus === 'ACTIVE' ? 'ativada' : newStatus === 'PAUSED' ? 'pausada' : 'atualizada'} com sucesso`,
      });
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete campaign
  const handleDelete = async () => {
    if (!selectedCampaign) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/campaigns?id=${selectedCampaign.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir campanha');
      }

      toast({
        title: 'Sucesso',
        description: 'Campanha excluída com sucesso',
      });
      setIsDeleteDialogOpen(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir campanha',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      serviceType: campaign.serviceType || '',
      status: campaign.status,
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
    });
    setIsEditDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsViewDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteDialogOpen(true);
  };

  // Group campaigns by status
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  const draftCampaigns = campaigns.filter(c => c.status === 'DRAFT');
  const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED');
  const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED');

  return (
    <div className="min-h-screen">
      <Header 
        title="Campanhas" 
        subtitle="Gerenciamento de campanhas de email" 
      />

      <div className="p-6 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold">{campaigns.length}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold text-green-600">{activeCampaigns.length}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pausadas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold text-yellow-600">{pausedCampaigns.length}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <p className="text-2xl font-bold text-blue-600">{completedCampaigns.length}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Todas as Campanhas</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchCampaigns}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={(v) => { setIsAddDialogOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Campanha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Nova Campanha</DialogTitle>
                  <DialogDescription>
                    Crie uma nova campanha de prospecção
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Campanha *</Label>
                    <Input 
                      id="name" 
                      placeholder="Ex: Campanha Diving Q1 2024"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Descreva o objetivo da campanha..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceType">Tipo de Serviço</Label>
                      <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIVING">Mergulho</SelectItem>
                          <SelectItem value="SHIPCHANDLER">Shipchandler</SelectItem>
                          <SelectItem value="WASTE">Gestão de Resíduos</SelectItem>
                          <SelectItem value="BUNKER">Bunker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status Inicial</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Rascunho</SelectItem>
                          <SelectItem value="ACTIVE">Ativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Data de Início</Label>
                      <Input 
                        id="startDate" 
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Data de Término</Label>
                      <Input 
                        id="endDate" 
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={isSaving}>
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Campanha
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Mail className="h-12 w-12 mb-4" />
            <p>Nenhuma campanha encontrada</p>
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira campanha
            </Button>
          </div>
        ) : (
          <>
            {/* Active Campaigns */}
            {activeCampaigns.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Campanhas Ativas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCampaigns.map((campaign) => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign} 
                      onView={openViewDialog}
                      onEdit={openEditDialog}
                      onStatusChange={handleStatusChange}
                      onDelete={openDeleteDialog}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Paused Campaigns */}
            {pausedCampaigns.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Campanhas Pausadas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pausedCampaigns.map((campaign) => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign} 
                      onView={openViewDialog}
                      onEdit={openEditDialog}
                      onStatusChange={handleStatusChange}
                      onDelete={openDeleteDialog}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Draft Campaigns */}
            {draftCampaigns.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Rascunhos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {draftCampaigns.map((campaign) => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign} 
                      onView={openViewDialog}
                      onEdit={openEditDialog}
                      onStatusChange={handleStatusChange}
                      onDelete={openDeleteDialog}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Campaigns */}
            {completedCampaigns.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Campanhas Concluídas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedCampaigns.map((campaign) => (
                    <CampaignCard 
                      key={campaign.id} 
                      campaign={campaign} 
                      onView={openViewDialog}
                      onEdit={openEditDialog}
                      onStatusChange={handleStatusChange}
                      onDelete={openDeleteDialog}
                      isUpdating={isUpdating}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* View Campaign Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedCampaign?.name}</DialogTitle>
              <DialogDescription>
                Detalhes da campanha
              </DialogDescription>
            </DialogHeader>
            {selectedCampaign && (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[selectedCampaign.status]}>
                    {statusLabels[selectedCampaign.status]}
                  </Badge>
                  {selectedCampaign.serviceType && (
                    <Badge variant="outline">
                      {serviceTypeLabels[selectedCampaign.serviceType] || selectedCampaign.serviceType}
                    </Badge>
                  )}
                </div>

                {selectedCampaign.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedCampaign.description}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Mail className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold">{selectedCampaign.stats?.sent || 0}</p>
                    <p className="text-xs text-muted-foreground">Emails Enviados</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Eye className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold text-green-600">
                      {selectedCampaign.stats && selectedCampaign.stats.sent > 0
                        ? Math.round((selectedCampaign.stats.opened / selectedCampaign.stats.sent) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Taxa de Abertura</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-2xl font-bold text-primary">
                      {selectedCampaign.stats && selectedCampaign.stats.sent > 0
                        ? Math.round((selectedCampaign.stats.replied / selectedCampaign.stats.sent) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Taxa de Resposta</p>
                  </div>
                </div>

                {selectedCampaign.startDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Período: {new Date(selectedCampaign.startDate).toLocaleDateString('pt-BR')}
                      {selectedCampaign.endDate && ` - ${new Date(selectedCampaign.endDate).toLocaleDateString('pt-BR')}`}
                    </span>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Criada em: {new Date(selectedCampaign.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedCampaign) openEditDialog(selectedCampaign);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Campaign Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(v) => { setIsEditDialogOpen(v); if (!v) resetForm(); }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Campanha</DialogTitle>
              <DialogDescription>
                Atualize as informações da campanha
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome da Campanha *</Label>
                <Input 
                  id="edit-name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea 
                  id="edit-description" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-serviceType">Tipo de Serviço</Label>
                  <Select value={formData.serviceType} onValueChange={(v) => setFormData({ ...formData, serviceType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIVING">Mergulho</SelectItem>
                      <SelectItem value="SHIPCHANDLER">Shipchandler</SelectItem>
                      <SelectItem value="WASTE">Gestão de Resíduos</SelectItem>
                      <SelectItem value="BUNKER">Bunker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Rascunho</SelectItem>
                      <SelectItem value="ACTIVE">Ativa</SelectItem>
                      <SelectItem value="PAUSED">Pausada</SelectItem>
                      <SelectItem value="COMPLETED">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Data de Início</Label>
                  <Input 
                    id="edit-startDate" 
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">Data de Término</Label>
                  <Input 
                    id="edit-endDate" 
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Campanha</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a campanha <strong>{selectedCampaign?.name}</strong>? 
                {(selectedCampaign?._count?.emails || 0) > 0 ? (
                  <span className="block mt-2 text-destructive">
                    Esta campanha possui emails associados e não pode ser excluída. Pause ou arquive a campanha.
                  </span>
                ) : (
                  ' Esta ação não pode ser desfeita.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
                disabled={isSaving || (selectedCampaign?._count?.emails || 0) > 0}
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
