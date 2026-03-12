# Sonar V 1.0 - Development Worklog

---
## Task ID: 1 - Backend & Auth Specialist
### Work Task
Build the foundation: Database schema, Authentication system, and core APIs

### Work Summary

#### 1. Prisma Schema (/prisma/schema.prisma)
Complete database schema with all models:
- **User**: id, email, password, name, role (ADMIN/USER), isActive, timestamps
- **Company**: id, name, type, email, phone, country, city, website, status, score, notes, lastContact, timestamps
- **Vessel**: id, name, imo, type, flag, status (IN_ANGOLA/EN_ROUTE/OTHER), companyId
- **Campaign**: id, name, description, status (DRAFT/ACTIVE/PAUSED/COMPLETED), serviceType, startDate, endDate
- **Email**: id, subject, body, status (QUEUED/SENT/OPENED/CLICKED/REPLIED/FAILED), timestamps
- **Report**: id, type, title, data (JSON), generatedAt
- **Setting**: id, key, value, description, updatedAt
- **Notification**: id, type, title, message, isRead, link, createdAt

#### 2. Authentication System
- `/src/lib/auth.ts` - Password hashing with bcrypt, session management via secure cookies
- `/src/lib/db.ts` - Prisma client singleton for database operations
- `/src/contexts/auth-context.tsx` - React context for client-side authentication
- `/src/app/api/auth/login/route.ts` - Login endpoint with validation
- `/src/app/api/auth/logout/route.ts` - Logout endpoint
- `/src/app/api/auth/me/route.ts` - Current user endpoint
- `/src/app/api/auth/setup/route.ts` - Initial admin setup endpoint

#### 3. User Management API
- `GET /api/users` - List users with pagination/filters (admin only)
- `POST /api/users` - Create user (admin only)
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user (with permission checks)
- `DELETE /api/users/[id]` - Delete user (admin only)

#### 4. Companies API
- `GET /api/companies` - List with advanced filtering (type, status, country, search)
- `POST /api/companies` - Create company
- `GET /api/companies/[id]` - Get with vessels and emails
- `PUT /api/companies/[id]` - Update company
- `DELETE /api/companies/[id]` - Delete with cascading

#### 5. Login Page
- `/src/app/login/page.tsx` - Professional login with dark blue theme
- Auto-setup for first admin user
- Portuguese text throughout
- Redirect to dashboard on success

### Technical Implementation
- SQLite database for development (easy migration to PostgreSQL/Supabase)
- bcrypt for password hashing
- Secure HTTP-only cookies for sessions
- Role-based access control (ADMIN/USER)
- All responses in Portuguese

---
## Task ID: 2 - Frontend & Dashboard Specialist
### Work Task
Complete the frontend UI components and pages, connecting them to real APIs

### Work Summary

Enhanced and connected all frontend pages to real API endpoints:

#### 1. Dashboard Page (/src/app/(dashboard)/dashboard/page.tsx)
- Connected to `/api/dashboard` API endpoint
- Real-time KPIs: Total Leads, Emails Sent, Open Rate, Response Rate
- Line chart for leads discovered over time
- Bar chart for email performance
- Pie chart for companies by type distribution
- Lead funnel visualization (Total → Qualified → Contacted → Responded → Closed)
- Email funnel visualization (Sent → Opened → Clicked → Replied → Failed)
- Active campaigns display
- Recent activity feed with real-time updates
- Loading states and error handling

#### 2. Companies Page (/src/app/(dashboard)/empresas/page.tsx)
- Full CRUD operations connected to `/api/companies` endpoints
- Real-time statistics cards (Total, Qualified, Contacted, Closed)
- Search and filter functionality (by name, status, type)
- Pagination support
- Add/Edit company dialog with form validation
- View company details dialog
- Delete confirmation with safety checks
- Toast notifications for success/error states

#### 3. Campaigns Page (/src/app/(dashboard)/campanhas/page.tsx)
- Full CRUD operations connected to `/api/campaigns` endpoints
- Statistics cards (Total, Active, Paused, Completed)
- Campaign cards grouped by status with stats
- Create/Edit campaign dialogs
- Status management (Activate, Pause, Complete)
- Delete functionality with validation
- Progress bars for active campaigns
- Open/Sent/Reply rate calculations

#### 4. Emails Page (/src/app/(dashboard)/emails/page.tsx)
- Connected to `/api/emails` endpoints
- Email history with filtering and pagination
- Statistics cards (Total, Sent, Opened, Replied, Failed)
- Compose email dialog with:
  - Company selection
  - Campaign association
  - Template selection
  - AI-powered content generation (service types)
  - Custom subject/body support
- Templates tab showing available email templates
- Service types for AI generation
- View email details dialog with full content
- Status tracking with visual indicators

#### 5. Users Page (/src/app/(dashboard)/usuarios/page.tsx)
- Admin-only access with role-based protection
- Full CRUD operations connected to `/api/users` endpoints
- Statistics cards (Total, Admins, Active, Inactive)
- Search and role filtering
- Create/Edit user dialogs
- Password management
- Role assignment (ADMIN/USER)
- Active/Inactive status toggle
- Delete protection (cannot delete self)
- Activity tracking (companies, campaigns, emails created)

### Technical Implementation
- All pages use React hooks (useState, useEffect, useCallback)
- Loading states with skeleton/Loader2 components
- Error handling with toast notifications
- Pagination for large datasets
- Responsive design for all screen sizes
- Dark blue theme (#0f172a primary)
- All text in Portuguese (Angola market)
- shadcn/ui components throughout
- Lucide icons for visual elements
- Recharts for data visualization

---
## Task ID: 3 - AI & Integration Specialist
### Work Task
Build the AI-powered modules: Discovery Engine, Email Outreach, and AI integration for Sonar V 1.0

### Work Summary

Created 8 comprehensive modules for the AI-powered CRM system:

#### 1. AI Integration Library (/src/lib/ai.ts)
- `searchMaritimeCompanies(query)` - Web search for maritime company discovery
- `generateEmailContent(companyName, serviceType, additionalContext)` - AI-powered email content generation
- `scoreLead(companyData)` - Lead scoring/qualification system (0-100 scale)
- `generateReportSummary(data)` - AI-generated report summaries
- `analyzeCompanyFromUrl(url)` - Web content analysis for company data extraction

#### 2. Email Templates System (/src/lib/email-templates.ts)
- Template 1: Apresentação geral de serviços (GENERAL)
- Template 2: Mergulho Comercial (DIVING)
- Template 3: Shipchandler (SHIPCHANDLER)
- Template 4: Waste Management (WASTE)
- Template 5: Bunker MGO (BUNKER)
- All templates include Portuguese content with placeholders: {company_name}, {vessel_name}, {service}

#### 3. Discovery Engine API (/src/app/api/discovery/route.ts)
- GET - Discovery status and recent discoveries
- POST - Trigger AI-powered discovery process
- Default search queries: "shipowner Angola", "shipping company Luanda", "naval agent Angola", "armador Angola", "broker marítimo Angola"
- Auto-scoring and deduplication of leads

#### 4. Email Outreach API (/src/app/api/emails/route.ts)
- GET - List emails with filters (status, companyId, campaignId, pagination)
- POST - Queue email for sending
- PUT - Update email status (QUEUED, SENT, OPENED, CLICKED, REPLIED, FAILED)

#### 5. Email Sending API (/src/app/api/emails/send/route.ts)
- POST - Send email using AI-generated content
- Supports template-based or AI-generated content
- Ready for Resend API integration
- GET - List available templates and service types

#### 6. Campaigns API (/src/app/api/campaigns/route.ts)
- GET - List campaigns with stats and email counts
- POST - Create new campaign
- PUT - Update campaign (status: DRAFT, ACTIVE, PAUSED, COMPLETED)
- DELETE - Delete campaign (with validation)

#### 7. Dashboard Stats API (/src/app/api/dashboard/route.ts)
- GET - Comprehensive dashboard statistics:
  - Total leads count
  - Emails sent count
  - Open rate percentage
  - Response rate percentage
  - Leads over time (7 days)
  - Companies by type distribution
  - Lead funnel metrics
  - Email funnel metrics
  - Recent activity feed
  - Active campaigns

#### 8. Reports API (/src/app/api/reports/route.ts)
- GET - List reports with filters
- POST - Generate new report (LEADS, EMAILS, CAMPAIGNS, PERFORMANCE)
- DELETE - Delete report
- AI-powered summary generation for all report types

### Services Promoted (Portuguese)
1. **Mergulho Comercial**: Inspeção subaquática, reparos em casco, limpeza de hélices
2. **Shipchandler**: Abastecimento de navios, provisões, equipamentos náuticos
3. **Waste Management**: Gestão de resíduos, descarte ambiental conforme MARPOL
4. **Bunker MGO**: Fornecimento de combustível marítimo (Gasóleo Marítimo)

### Technical Implementation
- All content in Portuguese (Angola market)
- Proper error handling with try-catch
- Rate limiting awareness (1s delay between searches)
- HTTP status codes: 200, 201, 400, 401, 404, 500
- z-ai-web-dev-sdk integration for AI features
- TypeScript strict typing throughout

---
## Task ID: 4 - Agent Configuration & Communication Setup
### Work Task
Configure named agents with personalities and set up communication channels (SMTP Email + Twilio WhatsApp)

### Work Summary

#### 1. Environment Configuration (.env)
Complete environment file with all credentials:
- **Database**: SQLite for development
- **SMTP Email**: mail.mts-angola.com:465 (SSL/TLS)
- **Twilio WhatsApp**: Alert channel for critical notifications

#### 2. Email SMTP Configuration (/src/lib/email-config.ts)
- **Server**: mail.mts-angola.com | Port 465 (SSL/TLS)
- **Accounts configured**:
  - `info@mts-angola.com` (Mariana - Marketing/CRM)
  - `accounts@mts-angola.com` (Claudia - Comercial/Financeiro)
  - `supply.chain@mts-angola.com` (Pedro - Operações/Inteligência)
  - `ops.manager@mts-angola.com` (Gestor Humano - Relatórios)
- Cost: **GRATUITO** - Ilimitado

#### 3. Agent Personalities Configuration (/src/lib/agents-config.ts)
Three named agents with distinct personalities:

**MARIANA** - Agente de Marketing & CRM 👩‍💼
- Email: info@mts-angola.com
- Personality: Profissional, calorosa e persuasiva
- Responsibilities: Email marketing, campanhas, CRM, comunicação com clientes
- Avatar color: Pink (bg-pink-500)

**CLAUDIA** - Agente Comercial & Financeiro 👩‍💻
- Email: accounts@mts-angola.com
- Personality: Analítica, precisa e orientada a resultados
- Responsibilities: Propostas comerciais, negociações, faturação
- Avatar color: Blue (bg-blue-500)

**PEDRO** - Agente de Operações & Inteligência 👨‍🔬
- Email: supply.chain@mts-angola.com
- Personality: Analítico, curioso e detalhista
- Responsibilities: Discovery web, análise de dados, scoring de leads
- Avatar color: Green (bg-green-500)

**GESTOR HUMANO** - Destinatário de Relatórios 👨‍💼
- Email: ops.manager@mts-angola.com
- WhatsApp: +244923473361
- Receives: Relatórios e alertas críticos

#### 4. Email Service (/src/lib/email-service.ts)
- Nodemailer integration for SMTP
- Functions:
  - `sendEmail()` - Generic email sending
  - `sendPresentationEmail()` - Marketing outreach
  - `sendReportToManager()` - Daily reports
  - `testSmtpConnection()` - Connection testing

#### 5. Twilio WhatsApp Integration (/src/lib/twilio-config.ts & /src/lib/whatsapp-service.ts)
- **Bot Number**: +18573825373
- **Recipient (Gestor)**: +244923473361
- **Cost**: PAGO - Use ONLY for critical alerts
- **Daily limit**: 10 messages (configurable)
- **Alert types allowed via WhatsApp**:
  - HIGH_SCORE_LEAD (score > 80)
  - POSITIVE_RESPONSE (client interested)
  - SYSTEM_ERROR (critical issues)
- Functions:
  - `sendWhatsAppMessage()` - Send WhatsApp via Twilio API
  - `alertHighScoreLead()` - Notify about qualified leads
  - `alertPositiveResponse()` - Notify about client responses
  - `alertSystemError()` - Notify about system issues

#### 6. Configuration APIs
- `GET /api/config/status` - Get full system configuration
- `POST /api/config/test` - Test email/WhatsApp connections

#### 7. Agentes Page (/src/app/(dashboard)/agentes/page.tsx)
Visual interface showing:
- Agent cards with personalities and specialties
- Human manager information
- Communication channel status (Email SMTP + WhatsApp)
- Connection testing buttons
- Usage tracking for WhatsApp

### Technical Implementation
- All credentials in environment variables
- nodemailer for SMTP email
- Twilio API for WhatsApp
- Rate limiting for WhatsApp (10/day default)
- Cost warnings for paid channels
- Portuguese language throughout
- Secure credential handling

---
## Task ID: 1 & 3 - Backend Integration Specialist
### Work Task
Integrate SMTP email service and WhatsApp alerts into the Sonar V 1.0 system

### Work Summary

#### 1. Updated Email Sending API (/src/app/api/emails/send/route.ts)
Completely rewrote to use real SMTP service:
- **Integration with email-service.ts**: Imports `sendEmail()` and `sendPresentationEmail()` from the SMTP service
- **Agent-based sending**: Automatically selects the correct agent based on service type:
  - Mariana (info@mts-angola.com) → General outreach/marketing
  - Claudia (accounts@mts-angola.com) → Commercial services (Diving, Shipchandler, Waste, Bunker)
  - Pedro (supply.chain@mts-angola.com) → Discovery/Intelligence
- **Professional HTML templates**: Generates beautiful HTML emails with MTS Angola branding
- **Real SMTP delivery**: Emails are actually sent via the configured SMTP server
- **Logging**: Detailed console logging for debugging and monitoring
- **Error handling**: Proper status updates to database on success/failure

#### 2. Email Queue System (/src/lib/email-queue.ts)
Created in-memory queue for managing email sends:
- **`addToQueue(emailData)`** - Add email to queue with auto-generated ID
- **`processQueue()`** - Process emails with rate limiting (2s between emails)
- **`getQueueStatus()`** - Get current queue statistics (total, pending, sent, failed)
- **`getQueuedEmails(status?)`** - Retrieve emails filtered by status
- **`retryFailed()`** - Retry all failed emails
- **`cleanQueue(olderThanHours)`** - Remove old processed emails
- **`getQueueStats()`** - Get success rate and average attempts
- **Rate limiting**: 2-second delay between emails to avoid SMTP throttling
- **Retry logic**: Max 3 attempts per email before marking as failed
- **Batch processing**: Process up to 5 emails per batch

#### 3. Notification Helper (/src/lib/notifications.ts)
Central notification system coordinating Email + WhatsApp:
- **`notifyNewLead(company)`** - Email always + WhatsApp if score >= 80
  - Sends email to ops.manager@mts-angola.com (Gestor)
  - Sends WhatsApp alert if score >= 80 (HIGH_SCORE_LEAD)
- **`notifyEmailSent(emailId, company, to, subject, agent)`** - Log notification only
- **`notifyPositiveResponse(company, serviceType, message)`** - Email + WhatsApp (ALTA PRIORIDADE)
- **`notifyError(errorType, errorMessage, details?)`** - Email + WhatsApp (ALTA PRIORIDADE)
- **`notifyCampaignComplete(campaignName, stats)`** - Email only (not urgent)
- **`notifyDailySummary(stats)`** - Email only (daily digest)

#### 4. Updated Companies API (/src/app/api/companies/route.ts)
Integrated WhatsApp alerts for high-score leads:
- **Automatic notifications**: When creating a company with score >= 80
  - Calls `notifyNewLead()` which triggers Email + WhatsApp
- **Logging**: Detailed console output for debugging
- **Non-blocking**: Email/WhatsApp failures don't affect company creation
- **skipNotification option**: Allow creating companies without notifications

### Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   NOTIFICATION FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  New Company Created                                         │
│        │                                                     │
│        ▼                                                     │
│  ┌─────────────┐                                            │
│  │ score >= 80?│                                            │
│  └─────┬───────┘                                            │
│        │                                                     │
│   YES  │  NO                                                 │
│        ▼  ──────────────────┐                               │
│  ┌─────────────────┐        │                               │
│  │ notifyNewLead() │        ▼                               │
│  └────┬────────────┘  ┌─────────────┐                       │
│       │               │ Email only │                       │
│       ▼               └─────────────┘                       │
│  ┌────────────────────────────────┐                         │
│  │ 1. Email → Gestor              │                         │
│  │    (ops.manager@mts-angola.com)│                         │
│  │                                │                         │
│  │ 2. WhatsApp → Gestor           │                         │
│  │    (+244923473361)             │                         │
│  │    (if score >= 80)            │                         │
│  └────────────────────────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Agent Email Mapping

| Service Type | Agent | Email | Purpose |
|-------------|-------|-------|---------|
| GENERAL | Mariana | info@mts-angola.com | Marketing outreach |
| DIVING | Claudia | accounts@mts-angola.com | Commercial proposal |
| SHIPCHANDLER | Claudia | accounts@mts-angola.com | Commercial proposal |
| WASTE | Claudia | accounts@mts-angola.com | Commercial proposal |
| BUNKER | Claudia | accounts@mts-angola.com | Commercial proposal |
| Discovery | Pedro | supply.chain@mts-angola.com | Lead discovery |
| Reports | Pedro | supply.chain@mts-angola.com | Intelligence reports |

### WhatsApp Alert Rules

| Alert Type | Priority | WhatsApp | Email |
|------------|----------|----------|-------|
| HIGH_SCORE_LEAD | HIGH | ✅ | ✅ |
| POSITIVE_RESPONSE | HIGH | ✅ | ✅ |
| SYSTEM_ERROR | HIGH | ✅ | ✅ |
| CAMPAIGN_COMPLETE | MEDIUM | ❌ | ✅ |
| DAILY_SUMMARY | LOW | ❌ | ✅ |

### Technical Implementation
- All content in Portuguese (Angola market)
- Real SMTP delivery via nodemailer
- Twilio WhatsApp API integration
- In-memory queue with rate limiting
- Comprehensive error handling
- Detailed logging for debugging
- Cost-aware WhatsApp usage (10/day limit)

---
## Task ID: 2 & 4 - Automation & Discovery Specialist
### Work Task
Create the automated task scheduling system (Cron Jobs) and make the Discovery Engine fully functional

### Work Summary

#### 1. Cron Job System (/src/lib/cron.ts)
Complete scheduling system for automated tasks:

**Core Functions:**
- `startScheduler()` - Start the cron scheduler with all configured tasks
- `stopScheduler()` - Stop the scheduler and clear all intervals
- `scheduleTask(name, interval, callback)` - Register a new scheduled task
- `getSchedulerStatus()` - Get current scheduler status and task states
- `runTaskManually(taskName)` - Execute a task on-demand

**Scheduled Tasks:**
| Task | Interval | Description |
|------|----------|-------------|
| discovery | 6 hours | Search for new maritime companies |
| dailyReport | 24 hours | Generate and send daily summary at 09:00 |
| weeklyReport | 7 days | Generate and send weekly summary |
| processEmails | 5 minutes | Process queued emails |

**Features:**
- Timestamp logging for all executions
- Graceful error handling (won't crash scheduler)
- Concurrent task protection (won't run same task twice)
- Database persistence of last run times
- Uptime tracking

#### 2. Discovery Service (/src/lib/discovery-service.ts)
Business logic for the discovery engine:

**Functions:**
- `runDiscoveryScan()` - Execute full discovery process across all queries
- `processSearchResult(companyData)` - Process single search result
- `findDuplicate(companyData)` - Check for duplicates in database
- `deduplicateCompanies(companies)` - Remove duplicates from list
- `scoreAndSaveCompanies(companies)` - Score and save to database
- `getDiscoveryStats()` - Get discovery statistics

**Search Queries Used:**
```
- "shipowner Angola Luanda port"
- "shipping company Angola maritime"
- "naval agent Luanda Lobito"
- "armador Angola navios"
- "broker marítimo Angola"
```

**Features:**
- AI-powered web search using z-ai-web-dev-sdk
- Automatic lead scoring (0-100 scale)
- Duplicate detection by name, email, and website
- High-score lead notifications (>=80)
- WhatsApp alerts for qualified leads
- Database logging of all discovery runs

#### 3. Report Generator (/src/lib/report-generator.ts)
Automated report generation and delivery:

**Functions:**
- `generateDailyReport()` - Create daily summary with AI
- `generateWeeklyReport()` - Create weekly summary with AI
- `sendReportToManager(report)` - Email report via SMTP
- `getRecentReports(limit)` - Get recent reports from database
- `getReportById(id)` - Get specific report details

**Report Content:**
- Total leads discovered (today/week)
- Emails sent with open/response rates
- Top companies by score
- Active campaigns with stats
- Recent activity feed
- AI-generated executive summary

**Email Delivery:**
- Sent to ops.manager@mts-angola.com
- Beautiful HTML formatting
- Professional MTS Angola branding
- Automatic database archiving

#### 4. Cron API Endpoints (/src/app/api/cron/route.ts)
REST API for scheduler control:

**GET /api/cron** - Get scheduler status
- Returns: scheduler status, task states, last run times
- Admin only access

**POST /api/cron** - Control scheduler or run tasks
- Body: `{ action: 'start' | 'stop' | 'run', task?: string }`
- Tasks: `discovery`, `report`, `weeklyReport`, `processEmails`
- Admin only access

**Response Format:**
```json
{
  "success": true,
  "message": "Discovery scan executado com sucesso",
  "result": {
    "totalFound": 10,
    "newCompanies": 5,
    "duplicates": 3,
    "errors": 0
  },
  "timestamp": "2024-01-15T09:00:00.000Z"
}
```

#### 5. Updated Discovery API (/src/app/api/discovery/route.ts)
Enhanced with full discovery service integration:

**New Features:**
- Integration with discovery-service.ts
- Option to use `useService: true` for full discovery
- Extended search queries (10 queries total)
- Better error handling and logging
- Triggered by tracking (who initiated the scan)
- 1.5s delay between searches (rate limiting)

**GET /api/discovery** - Discovery status
- Recent discoveries (last 7 days)
- Statistics: totalNew, totalQualified, averageScore
- Top companies by score
- Last scan details

**POST /api/discovery** - Run discovery
- Body options:
  - `queries`: Custom search queries
  - `autoScore`: Enable automatic scoring (default: true)
  - `saveToDb`: Save results to database (default: true)
  - `useService`: Use full discovery service (default: false)

### Technical Implementation
- All content in PORTUGUESE
- Timestamp logging for all operations
- Graceful error handling (scheduler never crashes)
- Rate limiting between API calls
- Database persistence for state
- Admin-only API access
- TypeScript strict typing
- Integration with existing AI library

### Task Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTOMATED TASKS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   DISCOVERY  │     │ DAILY REPORT │     │   EMAILS    │ │
│  │   6 hours    │     │   09:00 AM   │     │  5 minutes  │ │
│  └──────┬───────┘     └──────┬───────┘     └──────┬──────┘ │
│         │                    │                     │        │
│         ▼                    ▼                     ▼        │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │ Search Web   │     │ Generate AI  │     │ Process     │ │
│  │ for Maritime │     │ Report       │     │ Email Queue │ │
│  │ Companies    │     │ Summary      │     │             │ │
│  └──────┬───────┘     └──────┬───────┘     └──────┬──────┘ │
│         │                    │                     │        │
│         ▼                    ▼                     ▼        │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │ Score & Save │     │ Send Email   │     │ Send via    │ │
│  │ to Database  │     │ to Gestor    │     │ SMTP        │ │
│  └──────────────┘     └──────────────┘     └─────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---
## Task ID: 5 - Frontend Email Integration Specialist
### Work Task
Connect the Email page to real backend APIs and create a seamless email sending experience

### Work Summary

#### 1. Updated Emails Page (/src/app/(dashboard)/emails/page.tsx)
Complete overhaul with real API integration:

**Email Statistics:**
- Real-time stats calculation from `/api/emails` endpoint
- Cards showing: Emails sent today, this week, open rate, response rate, pending in queue
- Animated number transitions for visual appeal
- Trend indicators (up/down) for rates

**Email History:**
- Connected to `/api/emails` with pagination
- Status filtering (QUEUED, SENT, OPENED, CLICKED, REPLIED, FAILED)
- Visual status badges with icons
- View email details dialog with full content

**Agent Selection in Compose:**
- Dropdown to select sending agent (Mariana, Claudia, Pedro)
- Agent info card showing avatar, email, role, and specialties
- Default agent selection based on service type (Mariana for marketing, Claudia for commercial)

**Compose Email Dialog:**
- Company selection from `/api/companies`
- Campaign association (optional)
- Template selection from 5 predefined templates
- AI-powered content generation with service type selection
- Custom subject/body support
- Additional context for AI personalization
- Preview dialog before sending

#### 2. Quick Actions Component (/src/components/emails/quick-actions.tsx)
Sidebar component for rapid system operations:

**Actions Available:**
1. **Executar Descoberta** - Triggers `/api/discovery` POST to find new companies
2. **Processar Fila de Emails** - Calls `/api/cron` with `{action: 'run', task: 'processEmails'}`
3. **Enviar Email de Teste** - Sends a test email to the first available company

**Features:**
- Loading states for each action
- Success/error result display
- Toast notifications for feedback
- Automatic data refresh after successful actions

#### 3. Email Stats Cards Component (/src/components/emails/email-stats.tsx)
Real-time statistics display:

**Stats Shown:**
- Emails sent today (with calendar icon)
- Emails this week (with chart icon)
- Open rate % (with progress bar and trend indicator)
- Response rate % (with progress bar and trend indicator)
- Pending in queue (with clock icon)

**Features:**
- Animated number transitions (1 second duration)
- Progress bars for rates
- Color-coded cards per metric
- Trend indicators (up/down arrows)
- Loading skeleton states

#### 4. Agent Selector Component (/src/components/emails/agent-selector.tsx)
Reusable agent selection UI:

**Features:**
- Fetches agents from `/api/config/status`
- Dropdown with agent avatar, name, and role
- Selected agent info card with:
  - Avatar with color background
  - Name and role badge
  - Email address
  - Top 3 specialties as badges

#### 5. Enhanced Templates Display
Templates tab with rich information:

**Template Cards Show:**
- Service type icon (Building2, Wrench, Ship, Recycle, Fuel)
- Template name and service type badge
- Description of the template purpose
- Subject preview (truncated)
- Variables required
- "Usar Template" quick-action button

**Service Types Info Section:**
- Grid of 5 service types with icons
- Each shows label and description
- Clickable to start composing with that type

### API Endpoints Used
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/emails` | GET | List emails with pagination |
| `/api/emails/send` | POST | Send email via SMTP |
| `/api/emails/send` | GET | Get templates and service types |
| `/api/companies` | GET | List companies for dropdown |
| `/api/campaigns` | GET | List campaigns for dropdown |
| `/api/config/status` | GET | Get agents configuration |
| `/api/discovery` | POST | Run discovery process |
| `/api/cron` | POST | Process email queue |

### Portuguese Localization
All text in Portuguese for Angola market:
- "Compor Email" - Compose Email
- "Ações Rápidas" - Quick Actions
- "Executar Descoberta" - Run Discovery
- "Processar Fila de Emails" - Process Email Queue
- "Enviar Email de Teste" - Send Test Email
- Status labels: "Na fila", "Enviado", "Aberto", "Clicado", "Respondido", "Falhou"
- Service types: "Mergulho Comercial", "Shipchandler", "Gestão de Resíduos", "Bunker MGO"

### Technical Implementation
- React hooks (useState, useEffect, useCallback)
- Toast notifications for user feedback
- Loading states with Loader2 spinner
- Responsive grid layouts (1-5 columns)
- Progress bars for rate visualization
- Avatar components with fallback
- Badge components for status and tags
- Dialog components for modals
- ScrollArea for long content
- Error handling with try-catch
- shadcn/ui components throughout
- Lucide icons for visual elements
