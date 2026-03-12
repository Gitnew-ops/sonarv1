// Mock data for demonstration purposes
// In production, this data would come from the database via API calls

export interface MockCompany {
  id: string;
  name: string;
  type: 'SHIPOWNER' | 'ARMADOR' | 'BROKER' | 'AGENT';
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  status: 'NEW' | 'QUALIFIED' | 'CONTACTED' | 'RESPONDED' | 'CLOSED';
  score: number;
  notes: string | null;
  lastContact: Date | null;
  createdAt: Date;
}

export interface MockCampaign {
  id: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  serviceType: 'DIVING' | 'SHIPCHANDLER' | 'WASTE' | 'BUNKER' | null;
  startDate: Date | null;
  endDate: Date | null;
  emailsSent: number;
  openRate: number;
  replyRate: number;
  createdAt: Date;
}

export interface MockEmail {
  id: string;
  subject: string;
  status: 'QUEUED' | 'SENT' | 'OPENED' | 'CLICKED' | 'REPLIED' | 'FAILED';
  company: string;
  companyEmail: string;
  sentAt: Date | null;
  openedAt: Date | null;
  campaign: string | null;
  createdAt: Date;
}

export interface MockDashboardStats {
  totalLeads: number;
  leadsGrowth: number;
  emailsSent: number;
  emailsGrowth: number;
  openRate: number;
  openRateGrowth: number;
  responses: number;
  responsesGrowth: number;
}

export interface MockChartData {
  name: string;
  leads: number;
  emails: number;
  opened: number;
}

export interface MockPieData {
  name: string;
  value: number;
  color: string;
}

// Sample company data
export const mockCompanies: MockCompany[] = [
  {
    id: '1',
    name: 'Maersk Angola Lda',
    type: 'SHIPOWNER',
    email: 'operations@maersk.ao',
    phone: '+244 923 456 789',
    country: 'Angola',
    city: 'Luanda',
    website: 'https://maersk.com/ao',
    status: 'QUALIFIED',
    score: 92,
    notes: 'Interessado em serviços de mergulho para inspeção de cascos',
    lastContact: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    name: 'CMA CGM Angola',
    type: 'ARMADOR',
    email: 'info@cmacgm.ao',
    phone: '+244 923 111 222',
    country: 'Angola',
    city: 'Luanda',
    website: 'https://cmacgm.com',
    status: 'CONTACTED',
    score: 85,
    notes: 'Grande volume de navios mensais',
    lastContact: new Date('2024-01-12'),
    createdAt: new Date('2024-01-08'),
  },
  {
    id: '3',
    name: 'MSC Shipping Agency',
    type: 'AGENT',
    email: 'agency@msc.ao',
    phone: '+244 923 333 444',
    country: 'Angola',
    city: 'Luanda',
    website: 'https://msc.com',
    status: 'RESPONDED',
    score: 78,
    notes: 'Solicitou proposta para serviços de waste management',
    lastContact: new Date('2024-01-18'),
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '4',
    name: 'Trafigura Maritime',
    type: 'BROKER',
    email: 'chartering@trafigura.com',
    phone: '+244 923 555 666',
    country: 'Suiça',
    city: 'Genebra',
    website: 'https://trafigura.com',
    status: 'NEW',
    score: 65,
    notes: null,
    lastContact: null,
    createdAt: new Date('2024-01-17'),
  },
  {
    id: '5',
    name: 'Sonangol Shipping',
    type: 'ARMADOR',
    email: 'shipping@sonangol.ao',
    phone: '+244 923 777 888',
    country: 'Angola',
    city: 'Luanda',
    website: 'https://sonangol.co.ao',
    status: 'CLOSED',
    score: 95,
    notes: 'Contrato assinado para serviços de bunker',
    lastContact: new Date('2024-01-20'),
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '6',
    name: 'Hapag-Lloyd Angola',
    type: 'SHIPOWNER',
    email: 'angola@hapaglloyd.com',
    phone: '+244 923 999 000',
    country: 'Angola',
    city: 'Luanda',
    website: 'https://hapaglloyd.com',
    status: 'QUALIFIED',
    score: 88,
    notes: 'Potencial cliente para shipchandler',
    lastContact: new Date('2024-01-19'),
    createdAt: new Date('2024-01-11'),
  },
  {
    id: '7',
    name: 'Swire Shipping',
    type: 'BROKER',
    email: 'booking@swireshipping.com',
    phone: '+244 923 222 333',
    country: 'Singapura',
    city: 'Singapura',
    website: 'https://swireshipping.com',
    status: 'NEW',
    score: 72,
    notes: 'Primeiro contato via LinkedIn',
    lastContact: null,
    createdAt: new Date('2024-01-18'),
  },
  {
    id: '8',
    name: 'Grimaldi Lines Angola',
    type: 'AGENT',
    email: 'luanda@grimaldi.it',
    phone: '+244 923 444 555',
    country: 'Itália',
    city: 'Nápoles',
    website: 'https://grimaldi.napoli.it',
    status: 'CONTACTED',
    score: 80,
    notes: 'Operações regulares no Porto de Luanda',
    lastContact: new Date('2024-01-14'),
    createdAt: new Date('2024-01-07'),
  },
];

// Sample campaign data
export const mockCampaigns: MockCampaign[] = [
  {
    id: '1',
    name: 'Campanha Diving Q1 2024',
    description: 'Prospecção para serviços de mergulho comercial no primeiro trimestre',
    status: 'ACTIVE',
    serviceType: 'DIVING',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    emailsSent: 145,
    openRate: 32.5,
    replyRate: 8.2,
    createdAt: new Date('2023-12-15'),
  },
  {
    id: '2',
    name: 'Shipchander Angola',
    description: 'Campanha focada em empresas de navegação que operam em Angola',
    status: 'ACTIVE',
    serviceType: 'SHIPCHANDLER',
    startDate: new Date('2024-01-10'),
    endDate: new Date('2024-06-30'),
    emailsSent: 89,
    openRate: 28.7,
    replyRate: 12.4,
    createdAt: new Date('2024-01-05'),
  },
  {
    id: '3',
    name: 'Waste Management 2024',
    description: 'Serviços de gestão de resíduos marítimos',
    status: 'PAUSED',
    serviceType: 'WASTE',
    startDate: new Date('2024-02-01'),
    endDate: null,
    emailsSent: 34,
    openRate: 41.2,
    replyRate: 15.8,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '4',
    name: 'Bunker Services Campaign',
    description: 'Prospecção para fornecimento de combustível naval',
    status: 'COMPLETED',
    serviceType: 'BUNKER',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2023-12-31'),
    emailsSent: 210,
    openRate: 35.6,
    replyRate: 9.5,
    createdAt: new Date('2023-09-20'),
  },
  {
    id: '5',
    name: 'Nova Campanha Diving Q2',
    description: 'Continuação da campanha de mergulho para o segundo trimestre',
    status: 'DRAFT',
    serviceType: 'DIVING',
    startDate: null,
    endDate: null,
    emailsSent: 0,
    openRate: 0,
    replyRate: 0,
    createdAt: new Date('2024-01-22'),
  },
];

// Sample email data
export const mockEmails: MockEmail[] = [
  {
    id: '1',
    subject: 'Proposta de Serviços de Mergulho Comercial',
    status: 'OPENED',
    company: 'Maersk Angola Lda',
    companyEmail: 'operations@maersk.ao',
    sentAt: new Date('2024-01-15T10:30:00'),
    openedAt: new Date('2024-01-15T14:22:00'),
    campaign: 'Campanha Diving Q1 2024',
    createdAt: new Date('2024-01-14'),
  },
  {
    id: '2',
    subject: 'Parceria para Serviços de Shipchandler',
    status: 'REPLIED',
    company: 'MSC Shipping Agency',
    companyEmail: 'agency@msc.ao',
    sentAt: new Date('2024-01-16T09:00:00'),
    openedAt: new Date('2024-01-16T11:45:00'),
    campaign: 'Shipchander Angola',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    subject: 'Serviços de Gestão de Resíduos Marítimos',
    status: 'SENT',
    company: 'Trafigura Maritime',
    companyEmail: 'chartering@trafigura.com',
    sentAt: new Date('2024-01-18T08:15:00'),
    openedAt: null,
    campaign: 'Waste Management 2024',
    createdAt: new Date('2024-01-17'),
  },
  {
    id: '4',
    subject: 'Inspeção de Cascos - Proposta Comercial',
    status: 'CLICKED',
    company: 'CMA CGM Angola',
    companyEmail: 'info@cmacgm.ao',
    sentAt: new Date('2024-01-12T14:30:00'),
    openedAt: new Date('2024-01-12T16:00:00'),
    campaign: 'Campanha Diving Q1 2024',
    createdAt: new Date('2024-01-11'),
  },
  {
    id: '5',
    subject: 'Fornecimento de Bunker - Cotação',
    status: 'FAILED',
    company: 'Swire Shipping',
    companyEmail: 'booking@swireshipping.com',
    sentAt: null,
    openedAt: null,
    campaign: 'Bunker Services Campaign',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '6',
    subject: 'Serviços de Apoio Marítimo em Angola',
    status: 'QUEUED',
    company: 'Hapag-Lloyd Angola',
    companyEmail: 'angola@hapaglloyd.com',
    sentAt: null,
    openedAt: null,
    campaign: null,
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '7',
    subject: 'Proposta de Diving Services',
    status: 'OPENED',
    company: 'Grimaldi Lines Angola',
    companyEmail: 'luanda@grimaldi.it',
    sentAt: new Date('2024-01-14T11:00:00'),
    openedAt: new Date('2024-01-14T15:30:00'),
    campaign: 'Campanha Diving Q1 2024',
    createdAt: new Date('2024-01-13'),
  },
];

// Dashboard statistics
export const mockDashboardStats: MockDashboardStats = {
  totalLeads: 156,
  leadsGrowth: 12.5,
  emailsSent: 487,
  emailsGrowth: 8.3,
  openRate: 34.2,
  openRateGrowth: 5.7,
  responses: 42,
  responsesGrowth: 15.2,
};

// Leads discovered in last 7 days (line chart)
export const mockLeadsChartData: MockChartData[] = [
  { name: 'Seg', leads: 12, emails: 45, opened: 15 },
  { name: 'Ter', leads: 19, emails: 52, opened: 22 },
  { name: 'Qua', leads: 8, emails: 38, opened: 18 },
  { name: 'Qui', leads: 25, emails: 68, opened: 28 },
  { name: 'Sex', leads: 15, emails: 55, opened: 24 },
  { name: 'Sab', leads: 6, emails: 22, opened: 8 },
  { name: 'Dom', leads: 4, emails: 15, opened: 5 },
];

// Email performance data (bar chart)
export const mockEmailPerformanceData: MockChartData[] = [
  { name: 'Sem 1', leads: 0, emails: 120, opened: 42 },
  { name: 'Sem 2', leads: 0, emails: 145, opened: 58 },
  { name: 'Sem 3', leads: 0, emails: 132, opened: 45 },
  { name: 'Sem 4', leads: 0, emails: 90, opened: 38 },
];

// Companies by type (pie chart)
export const mockCompaniesByTypeData: MockPieData[] = [
  { name: 'Shipowner', value: 35, color: '#0ea5e9' },
  { name: 'Armador', value: 25, color: '#22c55e' },
  { name: 'Broker', value: 22, color: '#f59e0b' },
  { name: 'Agente', value: 18, color: '#8b5cf6' },
];

// Recent activity for dashboard
export const mockRecentActivity = {
  recentCompanies: mockCompanies.slice(0, 5),
  recentEmails: mockEmails.slice(0, 5),
};

// Email templates
export interface MockEmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  serviceType: string;
  createdAt: Date;
  updatedAt: Date;
}

export const mockEmailTemplates: MockEmailTemplate[] = [
  {
    id: '1',
    name: 'Apresentação Diving Services',
    subject: 'Serviços de Mergulho Comercial em Angola',
    body: `Prezado(a) {nome},

Gostaríamos de apresentar nossos serviços de mergulho comercial para operações portuárias em Angola.

Nossa equipe oferece:
- Inspeção de cascos
- Limpeza subaquática
- Reparos emergenciais
- Instalação de equipamentos

Agende uma visita técnica sem compromisso.

Atenciosamente,
Equipe Sonar`,
    serviceType: 'DIVING',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Proposta Shipchandler',
    subject: 'Fornecimento de Provisões Navais',
    body: `Prezado(a) {nome},

Somos especialistas em fornecimento de provisões e suprimentos para embarcações nos portos de Angola.

Nossos serviços incluem:
- Provisões de alimentos
- Equipamentos de segurança
- Materiais de consumo
- Entrega 24/7

Solicite uma cotação personalizada.

Atenciosamente,
Equipe Sonar`,
    serviceType: 'SHIPCHANDLER',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    name: 'Waste Management',
    subject: 'Gestão de Resíduos Marítimos',
    body: `Prezado(a) {nome},

Oferecemos soluções completas para gestão de resíduos marítimos em conformidade com as regulamentações MARPOL.

Nossos serviços:
- Coleta de resíduos oleosos
- Tratamento de águas residuais
- Disposição certificada
- Documentação completa

Entre em contato para mais informações.

Atenciosamente,
Equipe Sonar`,
    serviceType: 'WASTE',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-19'),
  },
];

// Users for admin page
export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date | null;
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@sonar.ao',
    role: 'ADMIN',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date('2024-01-22T08:30:00'),
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao.silva@sonar.ao',
    role: 'USER',
    isActive: true,
    createdAt: new Date('2024-01-10'),
    lastLogin: new Date('2024-01-21T14:15:00'),
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria.santos@sonar.ao',
    role: 'USER',
    isActive: true,
    createdAt: new Date('2024-01-12'),
    lastLogin: new Date('2024-01-20T09:45:00'),
  },
  {
    id: '4',
    name: 'Pedro Fernandes',
    email: 'pedro.fernandes@sonar.ao',
    role: 'USER',
    isActive: false,
    createdAt: new Date('2024-01-15'),
    lastLogin: null,
  },
];

// System settings
export interface MockSetting {
  key: string;
  value: string;
  description: string;
}

export const mockSettings: MockSetting[] = [
  {
    key: 'company_name',
    value: 'Sonar - Prospecção Marítima',
    description: 'Nome da empresa exibido nos emails',
  },
  {
    key: 'email_signature',
    value: 'Equipe Sonar\n+244 923 000 000\nwww.sonar.ao',
    description: 'Assinatura padrão dos emails',
  },
  {
    key: 'max_emails_per_day',
    value: '100',
    description: 'Limite máximo de emails por dia',
  },
  {
    key: 'auto_followup_days',
    value: '7',
    description: 'Dias para follow-up automático',
  },
];
