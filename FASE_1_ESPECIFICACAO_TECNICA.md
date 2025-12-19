# **ESPECIFICAÇÃO TÉCNICA - FASE 1**
## **Hack Running! - Aplicativo Web Mobile-First (PWA)**

**Versão:** 1.0  
**Data:** 2026  
**Status:** Desenvolvimento

---

# **SUMÁRIO**

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Sistema](#3-arquitetura-do-sistema)
4. [Estrutura de Banco de Dados](#4-estrutura-de-banco-de-dados)
5. [Autenticação e Segurança](#5-autenticação-e-segurança)
6. [Sistema de Roles e Permissões](#6-sistema-de-roles-e-permissões)
7. [Funcionalidades do Membro (App)](#7-funcionalidades-do-membro-app)
8. [Funcionalidades do Admin](#8-funcionalidades-do-admin)
9. [Integrações](#9-integrações)
10. [Design System e UI](#10-design-system-e-ui)
11. [Regras de Negócio](#11-regras-de-negócio)
12. [APIs e Endpoints](#12-apis-e-endpoints)
13. [Testes](#13-testes)
14. [Performance e Otimização](#14-performance-e-otimização)
15. [LGPD e Compliance](#15-lgpd-e-compliance)
16. [Dependências do Projeto](#16-dependências-do-projeto)
17. [Cronograma e Entregas](#17-cronograma-e-entregas)
18. [Considerações Finais](#18-considerações-finais)
19. [Lista de Tarefas Detalhadas](#19-lista-de-tarefas-detalhadas)

---

# **1. VISÃO GERAL**

## **1.1. Objetivo da Fase 1**

Desenvolver um aplicativo web mobile-first (PWA) completo que permita:

- Cadastro e onboarding de membros
- Compra obrigatória do Kickstart Kit
- Geração automática de planilhas de treino
- Registro e validação de treinos
- Sistema de HPoints com gamificação
- Loja de resgates
- Dashboard corporativo
- Painel administrativo completo
- Integração com pagamentos (Asaas) - notas fiscais geradas automaticamente pelo Asaas
- Integração com Strava para importação de treinos

## **1.2. Escopo da Fase 1**

✅ **Incluído:**
- Web App + PWA mobile-first
- Backend completo com todas as funcionalidades
- Sistema de autenticação JWT
- Integração Asaas (pagamentos e notas fiscais automáticas)
- Integração Strava (importação de treinos)
- Integração AWS S3 (armazenamento de mídias)
- Sistema de roles e permissões
- Painel admin completo
- Dashboard corporativo
- Testes automatizados

❌ **Não Incluído (Fase 2):**
- Apps nativos iOS/Android
- Notificações push nativas
- Integração com HealthKit/Google Fit
- Modelos preditivos avançados com ML
- Offline completo

---

# **2. STACK TECNOLÓGICA**

## **2.1. Frontend**

- **Framework:** Next.js 16
- **React:** 19.2
- **Linguagem:** JavaScript (não TypeScript)
- **Estilização:** Tailwind CSS v4
- **Componentes UI:** Shadcn UI
- **Gerenciamento de Estado:** Zustand
- **Gerenciamento de Estado de Servidor:** TanStack Query (React Query)
- **Validação de Formulários:** React Hook Form + Zod
- **Requisições HTTP:** Fetch API (via TanStack Query)
- **Roteamento:** Next.js App Router
- **Otimização de Imagens:** Next.js Image (lazy loading)
- **Gráficos:** Recharts (via Shadcn UI Charts)
- **Animações:** Framer Motion (CRUCIAL - tudo deve ser animado e fluido)
- **Mapas:** Mapbox GL JS
- **Manipulação de Datas:** date-fns
- **Geração de IDs:** nanoid
- **Templates de Email:** React Email

## **2.2. Backend**

- **Runtime:** Node.js
- **Framework:** Express.js
- **Linguagem:** JavaScript
- **ORM/ODM:** Mongoose (MongoDB)
- **Autenticação:** JWT + Passport.js
- **Validação:** Joi ou express-validator
- **Upload de Arquivos:** Multer + AWS SDK (S3)
- **Processamento de Imagens:** Sharp
- **Agendamento de Tarefas:** node-cron (para expiração de HPoints, etc.)
- **Segurança HTTP:** Helmet.js
- **Rate Limiting:** express-rate-limit + express-slow-down
- **Compressão:** compression (middleware)
- **Logging:** Winston
- **Envio de Emails:** Resend
- **Geração de QR Code:** qrcode
- **Geração de IDs:** nanoid
- **Manipulação de Datas:** date-fns

## **2.3. Banco de Dados**

- **Principal:** MongoDB
- **Cache:** Sem cache inicial (futuro: Redis)

## **2.4. Infraestrutura**

- **Hospedagem:** Local (desenvolvimento)
- **CI/CD:** Sem automação inicial
- **Armazenamento de Mídias:** AWS S3

## **2.5. Integrações**

- **Pagamentos e Notas Fiscais:** Asaas API (notas geradas automaticamente)
- **Treinos:** Strava API
- **Armazenamento:** AWS S3
- **Mapas:** Mapbox API
- **Emails:** Resend API

## **2.6. Bibliotecas Adicionais (Detalhamento)**

### **2.6.1. TanStack Query (React Query)**
- **Uso:** Gerenciamento de estado de servidor (fetching, caching, syncing)
- **Benefícios:**
  - Cache automático de requisições
  - Revalidação inteligente (stale-while-revalidate)
  - Estados de loading/error automáticos
  - Redução de 70% do código de fetch
  - Prefetching de dados
  - Mutations com invalidação automática
- **Padrão:** Toda requisição à API deve usar TanStack Query

### **2.6.2. Sharp**
- **Uso:** Processamento de imagens no backend antes do upload para S3
- **Benefícios:**
  - Redimensionamento automático (thumbnail, medium, full)
  - Compressão otimizada (60-80% menor)
  - Conversão de formatos (WebP para melhor performance)
  - Extração de metadados (EXIF)
- **Configuração:**
  - Fotos de treino: max 1920px largura, qualidade 80%
  - Thumbnails: 400px largura, qualidade 70%
  - Fotos de perfil: 200px, qualidade 80%

### **2.6.3. Resend + React Email**
- **Uso:** Envio de emails transacionais com templates bonitos
- **Tipos de Email:**
  - Confirmação de cadastro
  - Recuperação de senha
  - Treino aprovado/reprovado
  - HPoints ganhos
  - Resgate aprovado
  - Novo desafio disponível
  - Together/Prova próximos
  - Notificações de expiração de pontos
- **Templates:** Criados com React Email (componentes React)

### **2.6.4. Helmet.js**
- **Uso:** Segurança HTTP headers
- **Proteções:**
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options (clickjacking)
  - X-XSS-Protection
  - Strict-Transport-Security (HTTPS)

### **2.6.5. express-rate-limit + express-slow-down**
- **Uso:** Proteção contra abusos de API
- **Configuração:**
  - Rate limit geral: 100 requisições/minuto
  - Login: 5 tentativas/15 minutos
  - Registro: 3/hora por IP
  - Webhooks: sem limite (autenticados)
  - Slow down: após 50 requisições, adiciona delay progressivo

### **2.6.6. Winston**
- **Uso:** Sistema de logging estruturado
- **Níveis:** error, warn, info, debug
- **Formatos:** JSON (produção), colorizado (desenvolvimento)
- **Logs:**
  - Requisições HTTP (método, rota, status, tempo)
  - Erros com stack trace
  - Ações importantes (pagamentos, validações, ajustes de pontos)
  - Integrações (Asaas, Strava, S3)

### **2.6.7. Compression**
- **Uso:** Compressão gzip/brotli das respostas da API
- **Impacto:** Reduz tamanho das respostas em ~70%
- **Configuração:** Threshold 1kb (não comprimir respostas pequenas)

### **2.6.8. QRCode**
- **Uso:** Geração de QR Codes para resgates de HPoints
- **Formatos:** PNG (para download), Data URL (para exibição)
- **Conteúdo:** Código único de resgate
- **Armazenamento:** S3 ou geração on-demand

### **2.6.9. date-fns**
- **Uso:** Manipulação e formatação de datas
- **Funcionalidades:**
  - Formatação para pt-BR (locale)
  - Cálculo de diferenças (dias até expiração)
  - Parse de datas do Strava
  - Comparações de datas
- **Padrão:** Usar date-fns ao invés de métodos nativos de Date
- **Exemplos:**
```javascript
import { format, formatDistance, addMonths, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formatação em português
format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
// "14 de dezembro de 2025"

// Dias até expiração
formatDistance(expirationDate, new Date(), { locale: ptBR });
// "em 30 dias"

// Calcular expiração de HPoints (6 meses)
const expirationDate = addMonths(new Date(), 6);

// Verificar se expirou
const isExpired = isBefore(expirationDate, new Date());
```

### **2.6.10. nanoid**
- **Uso:** Geração de IDs únicos
- **Aplicações:**
  - Códigos de resgate (8 caracteres, URL-safe)
  - Tokens de confirmação de email
  - IDs de sessão
- **Vantagem:** Mais curto e seguro que UUID

### **2.6.11. Recharts (via Shadcn)**
- **Uso:** Gráficos e visualizações de dados
- **Tipos de Gráficos:**
  - Linha: Evolução do pace, peso ao longo do tempo
  - Barras: KM/mês, treinos/semana
  - Pizza: Distribuição de planos, tipos de treino
  - Área: Adesão ao longo do tempo
- **Integração:** Componentes Shadcn UI Charts

### **2.6.12. Framer Motion** ⚠️ **CRUCIAL**
- **Uso:** Animações e transições fluidas em TODO o frontend
- **Importância:** CRÍTICA - Tudo no frontend DEVE ser animado, fluido e extremamente suave
- **Princípios:**
  - **Nada deve aparecer instantaneamente** - sempre com transições suaves
  - **Todas as interações devem ter feedback visual animado**
  - **Transições de página devem ser fluidas** (não apenas fade, mas movimentos coordenados)
  - **Componentes devem entrar e sair com animações** (fade, slide, scale)
  - **Estados de loading devem ser animados** (skeletons com shimmer, spinners suaves)
  - **Hover, focus e active states devem ter micro-interações**
- **Onde aplicar (SEM EXCEÇÕES):**
  - Transições entre páginas/rotas
  - Aparição de componentes (cards, modais, dropdowns)
  - Mudanças de estado (loading → conteúdo, erro → sucesso)
  - Interações do usuário (cliques, hovers, scrolls)
  - Listas e grids (stagger animations)
  - Formulários (validação, erros, sucesso)
  - Navegação (menu, tabs, breadcrumbs)
  - Gráficos e visualizações (entrada de dados)
  - Notificações e toasts
  - Modais e dialogs
  - Skeleton loaders
  - Progress bars e indicadores
- **Padrões de animação:**
  - Duração padrão: 200-400ms para micro-interações, 300-600ms para transições maiores
  - Easing: ease-in-out ou spring para naturalidade
  - Stagger: 50-100ms entre itens em listas
  - Spring physics: usar para interações mais naturais (botões, cards)
- **Performance:**
  - Usar `layout` prop para animações de layout otimizadas
  - Preferir `transform` e `opacity` (GPU-accelerated)
  - Usar `AnimatePresence` para animações de saída
  - Lazy loading de animações pesadas quando necessário
- **Padrão:** TODO componente React deve usar Framer Motion para transições e animações. Não há exceções.

### **2.6.13. Mapbox GL JS**
- **Uso:** Mapas interativos para eventos
- **Funcionalidades:**
  - Exibir localização de Together e Provas
  - Marcadores personalizados (estilo Hack Running!)
  - Geocoding (endereço para coordenadas)
  - Direções (como chegar ao evento)
- **Estilo:** Mapa dark mode customizado

### **2.6.14. Vitest**
- **Uso:** Framework de testes (substitui Jest)
- **Benefícios:**
  - Mais rápido que Jest
  - Melhor integração com Vite/Next.js
  - Mesma API do Jest (fácil migração)
  - Hot Module Replacement nos testes
  - Cobertura de código nativa

---

# **3. ARQUITETURA DO SISTEMA**

## **3.1. Estrutura de Pastas (Frontend - Next.js)**

```
client/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (app)/
│   │   ├── home/
│   │   ├── training-plan/
│   │   ├── workouts/
│   │   ├── hpoints/
│   │   ├── store/
│   │   ├── community/
│   │   ├── challenges/
│   │   ├── together/
│   │   ├── races/
│   │   ├── classes/
│   │   ├── nutrition/
│   │   ├── profile/
│   │   └── layout.jsx
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── members/
│   │   ├── companies/
│   │   ├── training-plans/
│   │   ├── validation/
│   │   ├── hpoints/
│   │   ├── store/
│   │   ├── events/
│   │   ├── content/
│   │   ├── notifications/
│   │   └── layout.jsx
│   ├── api/
│   │   ├── auth/
│   │   ├── workouts/
│   │   ├── hpoints/
│   │   ├── webhooks/
│   │   └── ...
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── member/
│   ├── admin/
│   └── shared/
│       ├── Map/
│       │   └── EventMap.jsx (Mapbox GL)
│       ├── Charts/
│       │   ├── LineChartCard.jsx
│       │   ├── BarChartCard.jsx
│       │   ├── PieChartCard.jsx
│       │   └── AreaChartCard.jsx
│       ├── QRCode/
│       │   └── RedemptionQR.jsx
│       └── ...
├── lib/
│   ├── api/
│   ├── utils/
│   ├── validations/
│   └── constants/
├── store/ (Zustand stores)
├── hooks/
│   ├── useUser.js
│   ├── useWorkouts.js
│   ├── useHPoints.js
│   └── ...
├── queries/ (TanStack Query)
│   ├── useUserQuery.js
│   ├── useWorkoutsQuery.js
│   ├── useHPointsQuery.js
│   ├── useTrainingPlanQuery.js
│   └── ...
├── mutations/ (TanStack Query Mutations)
│   ├── useCreateWorkout.js
│   ├── useRedeemHPoints.js
│   └── ...
├── types/
├── public/
└── styles/
```

## **3.3. Configuração TanStack Query**

### **3.3.1. Provider**
```javascript
// app/providers.jsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto
        gcTime: 5 * 60 * 1000, // 5 minutos
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### **3.3.2. Exemplo de Query**
```javascript
// queries/useHPointsQuery.js
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useHPointsBalance() {
  return useQuery({
    queryKey: ['hpoints', 'balance'],
    queryFn: () => api.get('/hpoints/balance').then(res => res.data),
  });
}

export function useHPointsHistory() {
  return useQuery({
    queryKey: ['hpoints', 'history'],
    queryFn: () => api.get('/hpoints/history').then(res => res.data),
  });
}
```

### **3.3.3. Exemplo de Mutation**
```javascript
// mutations/useRedeemHPoints.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRedeemHPoints() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => api.post('/redemptions', data),
    onSuccess: () => {
      // Invalida cache de HPoints para atualizar saldo
      queryClient.invalidateQueries({ queryKey: ['hpoints'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
    },
  });
}
```

### **3.3.4. Padrões de Query Keys**
| Recurso | Query Key |
|---------|-----------|
| Usuário logado | `['user', 'me']` |
| Saldo HPoints | `['hpoints', 'balance']` |
| Histórico HPoints | `['hpoints', 'history']` |
| Treinos do usuário | `['workouts', userId]` |
| Planilha ativa | `['training-plan', 'active']` |
| Produtos da loja | `['products']` |
| Resgates do usuário | `['redemptions', userId]` |
| Eventos | `['events']` |
| Desafios | `['challenges']` |

## **3.5. Estrutura de Pastas (Backend - Express)**

```
server/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   ├── aws.js
│   │   ├── asaas.js
│   │   ├── strava.js
│   │   ├── resend.js
│   │   ├── mapbox.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Workout.js
│   │   ├── HPoint.js
│   │   ├── TrainingPlan.js
│   │   ├── Cycle.js
│   │   ├── Company.js
│   │   ├── Event.js
│   │   ├── Challenge.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   ├── Redemption.js
│   │   ├── Content.js
│   │   ├── Notification.js
│   │   ├── AuditLog.js
│   │   └── Setting.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── workoutController.js
│   │   ├── hpointController.js
│   │   ├── trainingPlanController.js
│   │   ├── cycleController.js
│   │   ├── eventController.js
│   │   ├── challengeController.js
│   │   ├── orderController.js
│   │   ├── productController.js
│   │   ├── redemptionController.js
│   │   ├── contentController.js
│   │   ├── companyController.js
│   │   ├── notificationController.js
│   │   ├── settingController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── workouts.js
│   │   ├── hpoints.js
│   │   ├── trainingPlans.js
│   │   ├── cycles.js
│   │   ├── events.js
│   │   ├── challenges.js
│   │   ├── orders.js
│   │   ├── products.js
│   │   ├── redemptions.js
│   │   ├── content.js
│   │   ├── companies.js
│   │   ├── notifications.js
│   │   ├── settings.js
│   │   ├── upload.js
│   │   ├── webhooks.js
│   │   ├── integrations.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roles.js
│   │   ├── validation.js
│   │   ├── rateLimiter.js
│   │   └── errorHandler.js
│   ├── services/
│   │   ├── asaasService.js
│   │   ├── stravaService.js
│   │   ├── s3Service.js
│   │   ├── imageService.js (Sharp)
│   │   ├── emailService.js (Resend)
│   │   ├── qrCodeService.js
│   │   ├── trainingPlanService.js
│   │   └── hpointService.js
│   ├── emails/ (React Email templates)
│   │   ├── WelcomeEmail.jsx
│   │   ├── PasswordResetEmail.jsx
│   │   ├── WorkoutApprovedEmail.jsx
│   │   ├── HPointsEarnedEmail.jsx
│   │   ├── RedemptionApprovedEmail.jsx
│   │   ├── PointsExpiringEmail.jsx
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       └── Button.jsx
│   ├── utils/
│   │   ├── logger.js (Winston)
│   │   ├── helpers.js
│   │   └── constants.js
│   ├── jobs/ (cron jobs)
│   │   ├── expireHPoints.js
│   │   ├── sendExpirationReminders.js
│   │   └── updateDashboardStats.js
│   └── app.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.js
└── .env
```

---

# **4. ESTRUTURA DE BANCO DE DADOS**

## **4.1. Collections MongoDB**

### **4.1.1. Users (Usuários)**

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, index),
  phone: String,
  cpf: String (unique, index),
  birthDate: Date,
  gender: String (enum: ['M', 'F', 'Other']),
  address: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipCode: String
  },
  shirtSize: String (enum: ['PP', 'P', 'M', 'G', 'GG', 'XG']),
  password: String (hashed),
  role: String (enum: ['member', 'operational_admin', 'content_admin', 'company_admin', 'media_moderator', 'coach', 'super_admin']),
  plan: {
    type: String (enum: ['free', 'paid', 'premium', 'corporate']),
    status: String (enum: ['active', 'inactive', 'suspended', 'cancelled']),
    startDate: Date,
    endDate: Date,
    autoRenew: Boolean
  },
  companyId: ObjectId (ref: 'Company', optional),
  onboarding: {
    completed: Boolean,
    runningTime: String,
    monthlyKm: Number,
    hasWatch: Boolean,
    usesStrava: Boolean,
    stravaLink: String,
    objectives: [String], // ['health', 'weight_loss', 'performance', 'race_preparation', 'discipline']
    goals: {
      currentWeight: Number,
      targetWeight: Number,
      current5KTime: Number, // in seconds
      target5KTime: Number,
      currentPace: Number, // seconds/km
      targetPace: Number,
      weeklyFrequency: Number,
      desiredMonthlyKm: Number
    }
  },
  currentTrainingPlan: {
    cycleId: ObjectId (ref: 'Cycle'),
    adherence: Number, // percentage
    startDate: Date,
    endDate: Date,
    completedWorkouts: Number,
    totalWorkouts: Number
  },
  hpoints: {
    balance: Number (default: 0),
    totalEarned: Number,
    totalRedeemed: Number
  },
  kickstartKit: {
    purchased: Boolean,
    orderId: ObjectId (ref: 'Order'),
    deliveryStatus: String (enum: ['pending', 'preparing', 'shipped', 'delivered']),
    trackingCode: String
  },
  integrations: {
    strava: {
      connected: Boolean,
      accessToken: String (encrypted),
      refreshToken: String (encrypted),
      athleteId: String,
      lastSync: Date
    }
  },
  active: Boolean (default: true),
  emailVerified: Boolean (default: false),
  lastAccess: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.2. Workouts (Treinos)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', index),
  type: String (enum: ['individual', 'together', 'race']),
  date: Date (index),
  distance: Number, // in km
  time: Number, // in seconds
  pace: Number, // seconds/km (calculated)
  workoutType: String (enum: ['base', 'pace', 'interval', 'long_run', 'recovery', 'strength']),
  trainingPlanId: ObjectId (ref: 'TrainingPlan', optional),
  cycleId: ObjectId (ref: 'Cycle', optional),
  photo: {
    url: String,
    s3Key: String,
    validated: Boolean
  },
  shares: {
    strava: Boolean,
    instagram: Boolean,
    whatsapp: Boolean
  },
  hpoints: {
    points: Number,
    status: String (enum: ['pending', 'approved', 'rejected']),
    validatedBy: ObjectId (ref: 'User', optional),
    validatedAt: Date
  },
  podium: {
    achieved: Boolean,
    type: String (enum: ['overall', 'category', 'double']), // double = overall + category
    position: Number,
    category: String
  },
  eventId: ObjectId (ref: 'Event', optional), // if together or race
  importedFromStrava: Boolean (default: false),
  stravaActivityId: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.3. TrainingPlans (Planilhas)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', index),
  objective: String (enum: ['health', 'weight_loss', 'performance', 'race_preparation', 'discipline']),
  level: String (enum: ['beginner', 'intermediate', 'advanced']),
  cycle: Number, // days (30, 45, 60, 90)
  startDate: Date,
  endDate: Date,
  workouts: [{
    day: Number, // day of cycle (1, 2, 3...)
    date: Date,
    type: String (enum: ['base', 'pace', 'interval', 'long_run', 'recovery', 'strength']),
    distance: Number,
    time: Number,
    description: String,
    completed: Boolean,
    workoutId: ObjectId (ref: 'Workout', optional)
  }],
  humanReview: {
    enabled: Boolean,
    reviewedBy: ObjectId (ref: 'User', optional),
    reviewedAt: Date,
    approved: Boolean,
    adjustments: String
  },
  adherence: Number, // calculated percentage
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.4. Cycles (Ciclos)**

```javascript
{
  _id: ObjectId,
  name: String,
  objective: String,
  level: String,
  duration: Number, // days
  workouts: [{
    day: Number,
    type: String,
    distance: Number,
    time: Number,
    description: String
  }],
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.5. HPoints (Histórico de Pontos)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', index),
  type: String (enum: ['individual_workout', 'together_workout', 'race', 'overall_podium', 'category_podium', 'double_podium', 'challenge', 'referral', 'photo_video', 'mediterraneum_cashback', 'goal_achieved', 'manual_adjustment']),
  points: Number,
  description: String,
  referenceId: ObjectId, // ID of workout, challenge, etc.
  referenceType: String, // 'Workout', 'Challenge', etc.
  expirationDate: Date, // 6 months after earned
  expired: Boolean (default: false),
  redeemed: Boolean (default: false),
  redemptionId: ObjectId (ref: 'Redemption', optional),
  createdAt: Date
}
```

### **4.1.6. Redemptions (Resgates)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', index),
  type: String (enum: ['hack_product', 'mediterraneum_product', 'paid_plan', 'race_registration', 'service']),
  itemId: ObjectId, // ID of product, plan, race, etc.
  itemName: String,
  pointsUsed: Number,
  redemptionCode: String (unique),
  qrCode: String, // URL of QR Code image
  status: String (enum: ['pending', 'approved', 'delivered', 'cancelled']),
  hpointIds: [ObjectId] (ref: 'HPoint'), // which points were used
  approvedBy: ObjectId (ref: 'User', optional),
  approvedAt: Date,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.7. Products (Loja)**

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  type: String (enum: ['hack_product', 'mediterraneum_product', 'paid_plan', 'race_registration', 'service']),
  category: String,
  points: Number,
  monetaryValue: Number (optional), // if has value in R$
  image: String, // URL
  stock: {
    available: Boolean,
    quantity: Number (optional)
  },
  active: Boolean,
  restrictions: {
    plans: [String], // which plans can redeem
    limitPerUser: Number (optional)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.8. Companies (Corporativo)**

```javascript
{
  _id: ObjectId,
  corporateName: String,
  tradeName: String,
  cnpj: String (unique, index),
  address: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipCode: String
  },
  responsible: {
    name: String,
    email: String,
    phone: String
  },
  plan: {
    type: String (enum: ['basic', 'intermediate', 'premium']),
    monthlyValue: Number,
    maxEmployees: Number,
    activeEmployees: Number,
    status: String (enum: ['active', 'suspended', 'cancelled']),
    startDate: Date,
    endDate: Date
  },
  employees: [ObjectId] (ref: 'User'),
  dashboard: {
    totalKm: Number,
    averageAdherence: Number,
    totalHpoints: Number,
    totalWorkouts: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.9. Events (Together e Provas)**

```javascript
{
  _id: ObjectId,
  type: String (enum: ['together', 'race']),
  name: String,
  description: String,
  date: Date (index),
  time: String,
  location: {
    address: String,
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  participants: [ObjectId] (ref: 'User'),
  confirmed: [ObjectId] (ref: 'User'),
  photos: [{
    url: String,
    s3Key: String,
    userId: ObjectId (ref: 'User')
  }],
  videos: [{
    url: String,
    s3Key: String,
    userId: ObjectId (ref: 'User')
  }],
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.10. Challenges (Desafios)**

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  duration: Number, // days (30, 45, 60, 90)
  startDate: Date,
  endDate: Date,
  rules: [String],
  bonusPoints: Number,
  criteria: {
    minWorkouts: Number,
    minKm: Number,
    minAdherence: Number
  },
  participants: [{
    userId: ObjectId (ref: 'User'),
    progress: {
      workouts: Number,
      km: Number,
      adherence: Number
    },
    completed: Boolean,
    pointsEarned: Number
  }],
  active: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.11. Orders (Kickstart Kit e Outros)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', index),
  type: String (enum: ['kickstart_kit', 'product', 'plan']),
  items: [{
    productId: ObjectId,
    name: String,
    quantity: Number,
    value: Number
  }],
  totalValue: Number,
  asaas: {
    chargeId: String,
    status: String (enum: ['pending', 'paid', 'overdue', 'refunded']),
    paymentMethod: String,
    paymentDate: Date
  },
  invoice: {
    number: String,
    series: String,
    key: String,
    url: String,
    issued: Boolean,
    issuedAt: Date
  },
  deliveryAddress: {
    street: String,
    number: String,
    complement: String,
    neighborhood: String,
    city: String,
    state: String,
    zipCode: String
  },
  deliveryStatus: String (enum: ['pending', 'preparing', 'shipped', 'delivered']),
  trackingCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.12. Content (Aulas e Artigos)**

```javascript
{
  _id: ObjectId,
  type: String (enum: ['class', 'article', 'video']),
  title: String,
  description: String,
  content: String, // HTML or markdown
  videoUrl: String (optional),
  thumbnail: String,
  category: String,
  tags: [String],
  planRestriction: [String], // ['free', 'paid', 'premium', 'corporate']
  views: Number,
  active: Boolean,
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **4.1.13. Notifications (Notificações)**

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', index),
  type: String (enum: ['workout_approved', 'workout_rejected', 'hpoints_earned', 'redemption_approved', 'new_challenge', 'together_upcoming', 'race_upcoming', 'goal_achieved', 'system']),
  title: String,
  message: String,
  read: Boolean (default: false),
  link: String (optional),
  createdAt: Date
}
```

### **4.1.14. AuditLogs (Auditoria)**

```javascript
{
  _id: ObjectId,
  action: String,
  userId: ObjectId (ref: 'User'),
  type: String (enum: ['create', 'update', 'delete', 'validation', 'points_adjustment', 'plan_change']),
  entity: String, // 'Workout', 'HPoint', 'User', etc.
  entityId: ObjectId,
  oldData: Object (optional),
  newData: Object,
  ip: String,
  userAgent: String,
  createdAt: Date
}
```

### **4.1.15. Settings (Configurações)**

```javascript
{
  _id: ObjectId,
  key: String (unique),
  value: Object,
  description: String,
  updatedBy: ObjectId (ref: 'User'),
  updatedAt: Date
}
```

---

# **5. AUTENTICAÇÃO E SEGURANÇA**

## **5.1. Autenticação JWT**

- **Biblioteca:** jsonwebtoken + Passport.js
- **Estratégia:** JWT Strategy
- **Token de Acesso:** Expira em 24 horas
- **Refresh Token:** Expira em 7 dias (opcional na Fase 1)
- **Hash de Senha:** bcrypt (salt rounds: 10)

## **5.2. Middleware de Autenticação**

```javascript
// middleware/auth.js
- Verificar token JWT no header Authorization
- Extrair userId do token
- Adicionar req.user com dados do usuário
- Retornar 401 se token inválido/expirado
```

## **5.3. Segurança HTTP (Helmet.js)**

### **5.3.1. Configuração**
```javascript
// Configuração do Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "*.amazonaws.com", "*.mapbox.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      connectSrc: ["'self'", "*.asaas.com", "*.strava.com", "*.mapbox.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
```

### **5.3.2. Proteções Ativas**
- **X-Content-Type-Options:** Previne MIME sniffing
- **X-Frame-Options:** Previne clickjacking
- **X-XSS-Protection:** Filtro XSS do navegador
- **Strict-Transport-Security:** Força HTTPS
- **Content-Security-Policy:** Controla origens de recursos

## **5.4. Rate Limiting (express-rate-limit + express-slow-down)**

### **5.4.1. Configuração Geral**
```javascript
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
```

### **5.4.2. Limiters Específicos**
| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/auth/login` | 5 requisições | 15 minutos |
| `/api/auth/register` | 3 requisições | 1 hora |
| `/api/auth/forgot-password` | 3 requisições | 1 hora |
| `/api/upload/*` | 10 requisições | 1 minuto |
| `/api/*` (geral) | 100 requisições | 1 minuto |
| `/api/webhooks/*` | Sem limite | - (autenticado por signature) |

### **5.4.3. Slow Down (Delay Progressivo)**
```javascript
const speedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minuto
  delayAfter: 50, // Após 50 requisições
  delayMs: (hits) => hits * 100 // Delay: 100ms, 200ms, 300ms...
});

app.use('/api/', speedLimiter);
```

## **5.5. Segurança Geral**

- **CORS:** Configurado para domínios específicos
- **Validação:** Todos os inputs validados (Joi/express-validator)
- **Sanitização:** Prevenir XSS e SQL Injection (MongoDB já protege)
- **HTTPS:** Obrigatório em produção
- **Secrets:** Variáveis sensíveis em .env (nunca commitadas)
- **Compressão:** compression middleware para respostas gzip/brotli

---

# **6. SISTEMA DE ROLES E PERMISSÕES**

## **6.1. Roles Definidas**

### **6.1.1. Super Admin**
- Acesso total ao sistema
- Pode criar/editar/deletar qualquer coisa
- Pode gerenciar outros admins
- Acesso a logs e auditoria completa

### **6.1.2. Admin Operacional**
- Gestão de membros (criar, editar, suspender)
- Gestão de empresas (corporativo)
- Validação de treinos e atividades
- Gestão de HPoints (ajustes, validações)
- Gestão de eventos (Together, Provas)
- Visualização de dashboard geral

### **6.1.3. Admin Conteúdo**
- Criar/editar/deletar aulas
- Criar/editar/deletar artigos
- Criar/editar/deletar desafios
- Enviar notificações
- Gerenciar conteúdo da loja

### **6.1.4. Admin Empresa (PJ)**
- Acesso apenas ao dashboard da própria empresa
- Visualizar colaboradores da empresa
- Ver relatórios corporativos
- Não pode editar dados de membros

### **6.1.5. Moderador de Mídias/HPoints**
- Validar fotos e vídeos de treinos
- Aprovar/reprovar atividades para HPoints
- Ajustar pontuação quando necessário
- Não pode criar/editar membros

### **6.1.6. Coach/Reviewer**
- Revisar planilhas geradas automaticamente
- Aprovar/ajustar planilhas de membros pagos
- Ver métricas e evolução dos membros
- Não pode validar HPoints

### **6.1.7. Membro**
- Acesso apenas ao próprio perfil e funcionalidades do app
- Não tem acesso ao painel admin

## **6.2. Permissões por Módulo**

| Módulo | Super Admin | Admin Operacional | Admin Conteúdo | Admin Empresa | Moderador | Coach | Membro |
|--------|-------------|-------------------|----------------|---------------|-----------|-------|--------|
| Dashboard Geral | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestão Membros | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestão Empresas | ✅ | ✅ | ❌ | ✅ (própria) | ❌ | ❌ | ❌ |
| Validação Treinos | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Gestão HPoints | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Gestão Eventos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestão Conteúdos | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Revisão Planilhas | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Notificações | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Logs/Auditoria | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

## **6.3. Middleware de Permissões**

```javascript
// middleware/roles.js
- Verificar role do usuário
- Verificar permissão específica para a ação
- Retornar 403 se não autorizado
```

---

# **7. FUNCIONALIDADES DO MEMBRO (APP)**

## **7.1. Login e Cadastro**

### **7.1.1. Tela de Login**
- Email e senha
- Link "Esqueci minha senha"
- Link "Não tem conta? Cadastre-se"

### **7.1.2. Tela de Cadastro**
**Campos obrigatórios:**
- Nome completo
- E-mail (validação de formato)
- Telefone (máscara)
- CPF (validação e máscara)
- Data de nascimento
- Sexo (M/F/Outro)
- Endereço completo (rua, número, complemento, bairro, cidade, estado, CEP)
- Tamanho da camiseta (PP/P/M/G/GG/XG)
- Senha (mínimo 8 caracteres, com validação)
- Confirmação de senha
- Aceite dos termos de uso e política de privacidade

**Fluxo:**
1. Preencher dados pessoais
2. Validar CPF único e email único
3. Criar conta (plano padrão: gratuito)
4. Redirecionar para onboarding

## **7.2. Onboarding**

### **7.2.1. Perguntas sobre Corrida**
- Há quanto tempo corre? (dropdown: Nunca, Menos de 1 mês, 1-3 meses, 3-6 meses, 6-12 meses, Mais de 1 ano)
- Quantos KM/mês? (input numérico)
- Tem relógio de corrida? (Sim/Não)
- Usa Strava? (Sim/Não)
  - Se sim: Link do perfil Strava (para entrar no clube)

### **7.2.2. Objetivos (múltipla escolha)**
- Saúde
- Emagrecimento
- Performance
- Preparar para prova
- Disciplina e rotina

### **7.2.3. Metas Pessoais**
- Peso atual (kg)
- Peso desejado (kg)
- Tempo atual nos 5K (minutos:segundos)
- Tempo alvo nos 5K (minutos:segundos)
- Pace atual (minutos:segundos por km)
- Pace alvo (minutos:segundos por km)
- Frequência semanal desejada (número de treinos)
- KM/mês desejado

### **7.2.4. Compra Obrigatória do Kickstart Kit**
**Após preencher onboarding:**
- Exibir tela de compra do Kickstart Kit
- Mostrar conteúdo: Camiseta + Sacochila + Coqueteleira + Stickers + Guia
- Selecionar tamanho da camiseta
- Escolher plano (Gratuito ou Pago)
- Valor total: R$ 120 (gratuito) ou R$ 60 + valor do plano (pago)
- Botão "Finalizar Compra"
- Redirecionar para checkout Asaas
- Após pagamento confirmado: gerar planilha automática

## **7.3. Home (Tela Inicial)**

**Componentes:**
- Saudação + nome do membro
- **Widget de Adesão à Planilha (%)**
  - Barra de progresso visual
  - Adesão semanal
  - Adesão geral do ciclo
- **Treinos da Semana**
  - Quantos treinos realizados
  - Quantos treinos previstos
  - Próximo treino do ciclo
- **HPoints**
  - Saldo atual (destaque)
  - Pontos para expirar (próximos 30 dias)
  - Link para histórico
- **Progresso das Metas**
  - Cards com metas principais
  - Barra de progresso de cada meta
- **Próximo Together**
  - Data, hora, local
  - Botão "Confirmar Presença"
- **Últimas Atividades da Comunidade**
  - Feed resumido (últimos 5 itens)
- **Status do Kickstart Kit**
  - Se ainda não entregue: mostrar status
- **Mini-gráficos (Recharts via Shadcn UI Charts):**
  - Evolução do pace (últimos 30 dias) - LineChart
  - Evolução do peso (se preenchido) - LineChart
  - KM/mês (gráfico de barras) - BarChart

## **7.4. Planilha de Treinos (CORE DO APP)**

### **7.4.1. Geração Automática**
**Após compra do Kickstart Kit:**
- Sistema cruza:
  - Nível do usuário (calculado pelo onboarding)
  - Objetivo selecionado
  - Metas pessoais
  - Disponibilidade semanal
- Algoritmo propõe ciclo ideal: **30, 45, 60 ou 90 dias**
- Gera planilha com treinos distribuídos

**Tipos de Treino:**
- **Base:** Corrida contínua em ritmo confortável
- **Ritmo:** Corrida em ritmo de prova
- **Intervalado:** Séries de alta intensidade com recuperação
- **Longão:** Corrida longa para resistência
- **Regenerativo:** Corrida leve para recuperação
- **Fortalecimento:** (opcional) Treino de força

**Estrutura da Planilha:**
- Lista de treinos por dia do ciclo
- Cada treino mostra: data, tipo, distância, tempo estimado, descrição
- Treinos concluídos aparecem marcados
- Próximo treino destacado

### **7.4.2. Revisão Humana (Planos Pagos)**
- Se membro tem plano pago/premium E revisão humana ativada:
  - Planilha gerada fica pendente de revisão
  - Coach recebe notificação
  - Coach pode: aprovar, ajustar ou personalizar
  - Membro recebe notificação quando revisada

### **7.4.3. Ajuste Inteligente**
- Se membro faltar 2+ treinos consecutivos:
  - Sistema adapta automaticamente a semana seguinte
  - Reduz carga para evitar sobrecarga
  - Exibe aviso: "Você perdeu dois treinos. Ajustamos sua semana para proteger seu corpo."

### **7.4.4. Cálculo de Adesão**
**Fórmula:**
```
Adesão = (Treinos Concluídos / Treinos Total do Ciclo) * 100
```
- Atualizado em tempo real
- Exibido na home e na tela de planilha

### **7.4.5. Registro de Treino**
**Tela de Registro:**
- Data (padrão: hoje)
- Tipo: Individual / Together / Prova
- Distância (km)
- Tempo (horas:minutos:segundos)
- Tipo de treino (base, ritmo, etc.)
- **Foto obrigatória** (upload)
- Checklist de compartilhamento:
  - [ ] Registrado no Strava
  - [ ] Postei story no Instagram (@hackrunning_)
  - [ ] Compartilhei no WhatsApp
- Botão "Enviar para Validação"
- Se for Together ou Prova: selecionar evento

**Após envio:**
- Treino fica com status "pendente"
- Aparece no histórico
- Aguarda validação de moderador
- Quando aprovado: HPoints creditados

### **7.4.6. Histórico de Treinos**
- Lista de todos os treinos registrados
- Filtros: por data, tipo, status
- Cada treino mostra:
  - Data, distância, tempo, pace
  - Status (aprovado, reprovado, pendente)
  - Pontos HPoints ganhos (se aprovado)
  - Foto
  - Motivo da reprovação (se reprovado)

## **7.5. Provas**

### **7.5.1. Lista de Provas**
- Cards com provas cadastradas
- Informações: nome, data, local, distâncias disponíveis
- Link para inscrição externa
- Botão "Resgatar com HPoints" (se disponível)

### **7.5.2. Detalhes da Prova**
- Informações completas
- Mapa do percurso (se disponível)
- Link de inscrição
- Opção de resgate com HPoints

### **7.5.3. Registro Pós-Prova**
- Após participar de prova:
  - Registrar tempo oficial
  - Upload de foto (obrigatório)
  - Informar se teve pódio (geral, categoria, ou duplo)
  - Posição no pódio
  - Sistema valida e credita HPoints

## **7.6. Together**

### **7.6.1. Lista de Togethers**
- Próximos eventos
- Data, hora, local
- Mini preview do mapa (Mapbox)
- Instruções de como chegar

### **7.6.2. Detalhes do Together**
- Informações completas
- **Mapa interativo (Mapbox GL JS):**
  - Estilo dark mode customizado
  - Marcador com logo Hack Running!
  - Popup com informações do evento
  - Zoom e navegação
- Botão "Confirmar Presença"
- Lista de participantes confirmados

### **7.6.3. Registro Pós-Together**
- Após participar:
  - Registrar treino realizado
  - Upload de foto
  - Sistema valida e credita HPoints

## **7.7. Desafios**

### **7.7.1. Lista de Desafios Ativos**
- Cards com desafios disponíveis
- Duração (30, 45, 60, 90 dias)
- Pontos bônus
- Progresso do membro (se participando)

### **7.7.2. Detalhes do Desafio**
- Regras completas
- Critérios para conclusão
- Pontos bônus
- Botão "Participar"
- Acompanhamento visual do progresso

### **7.7.3. Meus Desafios**
- Desafios em que o membro está participando
- Progresso detalhado:
  - Treinos realizados / mínimos
  - KM realizados / mínimos
  - Adesão atual
- Status: em dia / atrasado

## **7.8. HPoints**

### **7.8.1. Tela Principal**
- **Saldo Atual** (destaque grande)
- **Pontos para Expirar** (próximos 30 dias)
- Botão "Como Ganhar"
- Botão "Histórico"
- Botão "Resgatar"

### **7.8.2. Como Ganhar**
- Lista de todas as formas de ganhar pontos:
  - Treino individual: X pontos
  - Treino Together: Y pontos
  - Prova: Z pontos
  - Pódio geral: A pontos
  - Pódio categoria: B pontos
  - Pódio duplo: A + B pontos
  - Desafios: pontos variáveis
  - Indicação de membros: X pontos
  - Fotos/vídeos de qualidade: X pontos
  - Cashback Mediterraneum: X% do valor

### **7.8.3. Histórico**
- Lista de todos os ganhos de pontos
- Filtros: por tipo, por data
- Mostra: data, tipo, pontos, descrição, status (ativo/expirado/resgatado)
- Data de expiração de cada ponto

### **7.8.4. Regras de Expiração**
- HPoints expiram em **6 meses** após ganho
- Sistema mostra alerta 30 dias antes de expirar
- Pontos mais antigos são usados primeiro no resgate (FIFO)

## **7.9. Loja de Recompensas**

### **7.9.1. Catálogo**
- Produtos Hack Running (camisetas, sacochilas, etc.)
- Produtos Mediterraneum (suplementos)
- Inscrições de provas
- Planos pagos (upgrade)
- Serviços (avaliação, consultoria, etc.)

### **7.9.2. Detalhes do Produto**
- Nome, descrição, imagem
- Valor em HPoints
- Estoque disponível
- Botão "Resgatar"

### **7.9.3. Fluxo de Resgate**
1. Selecionar produto
2. Confirmar resgate
3. Sistema verifica saldo suficiente
4. Sistema usa pontos mais antigos primeiro
5. Gera código de resgate único
6. Gera QR Code
7. Envia para aprovação (se necessário)
8. Membro recebe notificação quando aprovado

### **7.9.4. Meus Resgates**
- Lista de todos os resgates realizados
- Status: pendente, aprovado, entregue, cancelado
- Código de resgate
- QR Code para apresentar
- Data do resgate

## **7.10. Comunidade**

### **7.10.1. Feed**
- Feed automático baseado em:
  - Treinos aprovados (com foto)
  - Provas realizadas
  - Pódios conquistados
  - Fotos e vídeos enviados
- Filtros:
  - Geral (todos)
  - Minha cidade
  - Destaques
- Cada item mostra: foto, nome do membro, descrição, data

## **7.11. Aulas e Conteúdos**

### **7.11.1. Lista de Aulas**
- Vídeos de aulas online
- Filtros: por categoria, por plano
- Restrição por plano (gratuito vê 1/mês, pago vê todas)

### **7.11.2. Player de Aula**
- Player de vídeo
- Descrição da aula
- Materiais complementares (se houver)

### **7.11.3. Artigos**
- Lista de artigos sobre:
  - Nutrição
  - Suplementação
  - Técnica de corrida
  - Mentalidade
  - Saúde
- Restrição por plano

## **7.12. Nutrição e Suplementação**

### **7.12.1. Protocolos por Objetivo**
- Iniciantes
- Emagrecimento
- Performance
- Alta intensidade

### **7.12.2. Suplementos Mediterraneum**
- Catálogo de produtos
- Link para compra (com cashback em HPoints)
- Informações sobre cada produto

## **7.13. Perfil do Runner**

### **7.13.1. Dados Pessoais**
- Editar: nome, telefone, endereço, tamanho camiseta
- Não pode editar: CPF, email (precisa de processo separado)

### **7.13.2. Planilha Atual**
- Ver planilha do ciclo atual
- Histórico de planilhas anteriores

### **7.13.3. Desafios**
- Desafios em que está participando
- Histórico de desafios concluídos

### **7.13.4. Métricas Corporais**
**Campos:**
- Peso (kg)
- Medidas:
  - Peito (cm)
  - Cintura (cm)
  - Abdômen (cm)
  - Quadril (cm)
  - Coxa (cm)
- % Gordura (opcional)

**Gráficos:**
- Peso × Dias (linha)
- Medidas × Meses (múltiplas linhas)
- Pace × Volume (scatter)
- Correlação: peso × pace

### **7.13.5. Metas**
- Ver todas as metas definidas no onboarding
- Editar metas
- Progresso de cada meta
- Alertas quando meta próxima de ser atingida

### **7.13.6. Privacidade**
- Configurações de privacidade
- O que aparece no feed da comunidade

### **7.13.7. Integrações**
- Conectar Strava (Fase 1: importação básica)
- Status da conexão
- Última sincronização

### **7.13.8. Plano e Assinatura**
- Ver plano atual
- Upgrade para plano pago/premium
- Cancelar assinatura
- Histórico de pagamentos

## **7.14. Notificações**

- Lista de notificações não lidas
- Marcar como lida
- Link para ação relacionada
- Tipos:
  - Treino aprovado/reprovado
  - HPoints ganhos
  - Resgate aprovado
  - Novo desafio
  - Together próximo
  - Prova próxima
  - Meta atingida
  - Mensagens do sistema

---

# **8. FUNCIONALIDADES DO ADMIN**

## **8.1. Dashboard Geral**

### **8.1.1. Indicadores Principais**
- Membros totais (ativos)
- Adesão média geral (%)
- KM total acumulado
- Evolução do pace global (gráfico)
- Status dos Kickstart Kits (pendentes, enviados, entregues)
- Treinos registrados (hoje, semana, mês)
- Pontos HPoints gerados (hoje, semana, mês)
- Provas próximas
- Top 10 membros (por HPoints, por KM, por adesão)
- Empresas ativas

### **8.1.2. Gráficos (Recharts via Shadcn UI Charts)**
- Crescimento de membros (LineChart)
- Distribuição de planos (PieChart)
- Treinos por tipo (BarChart)
- HPoints por tipo (BarChart)
- Adesão média por mês (AreaChart)
- **Estilo:** Dark mode, cores do design system (#eeff00 como primária)

## **8.2. Gestão de Membros**

### **8.2.1. Lista de Membros**
- Tabela com: nome, email, plano, status, última atividade
- Filtros: por plano, por status, por empresa
- Busca: por nome, email, CPF
- Paginação

### **8.2.2. Detalhes do Membro**
- Dados pessoais completos
- Plano e assinatura
- Histórico de pagamentos
- Planilha atual
- Treinos realizados
- HPoints (saldo, histórico)
- Métricas corporais
- Metas
- Adesão à planilha
- Participação em desafios
- Ações:
  - Editar dados
  - Suspender/reativar
  - Ajustar HPoints manualmente
  - Alterar plano
  - Ver preditivo de pace (se plano pago)

### **8.2.3. Criar Membro**
- Formulário completo de cadastro
- Pode criar membro manualmente

## **8.3. Gestão de Empresas (Corporativo)**

### **8.3.1. Lista de Empresas**
- Tabela com: nome, CNPJ, plano, colaboradores ativos, status
- Filtros: por plano, por status
- Busca: por nome, CNPJ

### **8.3.2. Detalhes da Empresa**
- Dados da empresa
- Responsável
- Plano contratado
- Colaboradores (lista)
- Dashboard da empresa:
  - Ranking interno
  - KM acumulado
  - Aderência média
  - Distribuição de treinos
  - HPoints acumulados
  - Evolução coletiva
- Relatórios mensais (download PDF)

### **8.3.3. Criar Empresa**
- Formulário completo
- Definir plano e valores
- Cadastrar responsável

## **8.4. Gestão de Planilhas e Programas**

### **8.4.1. Programas Base**
- Lista de ciclos disponíveis
- Criar/editar/deletar ciclos
- Definir: objetivo, nível, duração, treinos

### **8.4.2. Configuração do Algoritmo**
- Parâmetros para geração automática:
  - Fórmulas de cálculo (VO2 max, etc.) - **preparado para receber fórmula depois**
  - Regras de adaptação
  - Critérios de ciclo (30/45/60/90 dias)

### **8.4.3. Revisão Humana**
- Configurar revisão humana:
  - Ativar/desativar por plano
  - Ativar/desativar por usuário específico
- Fila de planilhas pendentes de revisão
- Atribuir para coach específico

## **8.5. Gestão de Desafios**

### **8.5.1. Lista de Desafios**
- Todos os desafios (ativos e inativos)
- Criar novo desafio
- Editar desafio existente
- Ativar/desativar

### **8.5.2. Criar/Editar Desafio**
- Nome, descrição
- Duração (30, 45, 60, 90 dias)
- Critérios:
  - Treinos mínimos
  - KM mínimos
  - Adesão mínima
- Pontos bônus
- Data de início/fim
- Público (todos, por plano, por empresa)

## **8.6. Eventos (Together e Provas)**

### **8.6.1. Lista de Eventos**
- Todos os eventos cadastrados
- Filtros: por tipo, por data
- Criar novo evento

### **8.6.2. Criar/Editar Evento**
- Tipo: Together ou Prova
- Nome, descrição
- Data, hora
- Local (endereço completo, coordenadas)
- Mapa integrado
- Participantes confirmados
- Fotos e vídeos do evento

### **8.6.3. Validação em Lote**
- Para Together/Prova específica:
  - Lista de participantes
  - Validar todos de uma vez
  - Creditar HPoints em lote

## **8.7. Gestão de HPoints**

### **8.7.1. Regras de Pontuação**
- Configurar pontos para cada tipo de ação:
  - Treino individual: X pontos
  - Treino Together: Y pontos
  - Prova: Z pontos
  - Pódio geral: A pontos
  - Pódio categoria: B pontos
  - Pódio duplo: A + B pontos
  - Desafios: variável
  - Indicação: X pontos
  - Foto/vídeo: X pontos
  - Cashback: X%

### **8.7.2. Ajustes Manuais**
- Adicionar pontos manualmente para membro
- Remover pontos (com justificativa)
- Histórico de ajustes

### **8.7.3. Auditoria**
- Log de todas as transações de HPoints
- Filtros: por membro, por tipo, por data
- Exportar relatório

## **8.8. Validação de Atividades**

### **8.8.1. Fila de Validação**
- Lista de treinos/provas pendentes de validação
- Cada item mostra:
  - Foto/vídeo
  - Dados do treino (distância, tempo, pace)
  - Membro
  - Pontos previstos
  - Ações: aprovar / reprovar / solicitar reenvio

### **8.8.2. Validação Individual**
- Ver foto completa
- Verificar compartilhamentos (Strava, IG, WPP)
- Aprovar ou reprovar com motivo
- Ajustar pontuação se necessário

## **8.9. Gestão da Loja**

### **8.9.1. Produtos**
- Lista de todos os produtos
- Criar/editar/deletar produto
- Categorias
- Estoque
- Valor em HPoints
- Restrições por plano

### **8.9.2. Resgates**
- Lista de todos os resgates
- Filtros: por status, por membro, por produto
- Aprovar resgate
- Marcar como entregue
- Cancelar resgate

### **8.9.3. QR Codes (biblioteca qrcode)**
- Gerar QR Code para resgate
- Visualizar QR Code gerado
- **Implementação:**
  ```javascript
  const QRCode = require('qrcode');
  
  // Gerar QR Code como Data URL (para exibição)
  const qrDataUrl = await QRCode.toDataURL(redemptionCode, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' }
  });
  
  // Gerar QR Code como PNG (para download)
  await QRCode.toFile(`./qrcodes/${redemptionCode}.png`, redemptionCode);
  ```
- **Conteúdo do QR Code:** Código único nanoid (8 caracteres)
- **Validação:** Admin escaneia e marca como entregue

## **8.10. Conteúdos e Aulas**

### **8.10.1. Aulas**
- Lista de aulas
- Criar/editar/deletar aula
- Upload de vídeo
- Thumbnail
- Restrição por plano
- Publicar/despublicar

### **8.10.2. Artigos**
- Lista de artigos
- Criar/editar/deletar artigo
- Editor de texto rico
- Imagens
- Restrição por plano
- Publicar/despublicar

## **8.11. Notificações**

### **8.11.1. Enviar Notificação**
- Criar notificação
- Selecionar destinatários:
  - Todos os membros
  - Por plano
  - Por empresa
  - Membro específico
- Tipo de notificação
- Título e mensagem
- Link opcional
- Enviar agora ou agendar

### **8.11.2. Histórico**
- Todas as notificações enviadas
- Estatísticas: quantos receberam, quantos leram

## **8.12. Planos (PF e PJ)**

### **8.12.1. Configuração de Planos**
- Lista de planos disponíveis
- Criar/editar plano
- Definir:
  - Nome
  - Valor
  - Benefícios
  - Restrições

## **8.13. Permissões**

### **8.13.1. Gestão de Roles**
- Lista de roles
- Criar role customizada
- Atribuir permissões por módulo

### **8.13.2. Atribuir Role**
- Atribuir role para usuário
- Ver usuários por role

## **8.14. Logs e Auditoria**

### **8.14.1. Logs do Sistema**
- Todas as ações realizadas
- Filtros: por usuário, por tipo, por entidade, por data
- Detalhes: dados antigos vs novos
- Exportar relatório

---

# **9. INTEGRAÇÕES**

## **9.1. Integração Asaas (Pagamentos)**

### **9.1.1. Configuração**
- Token de API do Asaas
- Ambiente: Sandbox ou Produção
- Webhooks configurados

### **9.1.2. Funcionalidades**
- **Criar Cliente:**
  - Criar cliente no Asaas (CPF/CNPJ + dados)
  - Armazenar customerId no banco

- **Criar Cobrança:**
  - Kickstart Kit (one-time)
  - Planos pagos (assinatura recorrente)
  - Planos corporativos (recorrente)

- **Links de Pagamento:**
  - Gerar link para checkout
  - Redirecionar usuário

- **Webhooks:**
  - `payment.created` - Nova cobrança criada
  - `payment.confirmed` - Pagamento confirmado
  - `payment.received` - Pagamento recebido
  - `payment.overdue` - Pagamento vencido
  - `payment.refunded` - Estorno
  - Atualizar status no banco
  - Nota fiscal é gerada automaticamente pelo Asaas (configurado no painel)

### **9.1.3. Fluxo Completo**
1. Usuário seleciona produto/plano
2. Sistema cria cliente no Asaas (se não existir)
3. Sistema cria cobrança no Asaas
4. Sistema gera link de pagamento
5. Usuário é redirecionado para Asaas
6. Usuário paga
7. Webhook recebe confirmação
8. Sistema atualiza status do pedido
9. Asaas gera nota fiscal automaticamente (configurado no painel)
10. Sistema libera produto/plano

## **9.2. Integração Strava (Importação de Treinos)**

### **9.2.1. Configuração**
- App criado no Strava
- Client ID e Client Secret
- Redirect URI configurado
- Scopes: `activity:read`

### **9.2.2. Fluxo de Conexão**
1. Usuário clica "Conectar Strava" no perfil
2. Redireciona para autorização Strava
3. Usuário autoriza
4. Strava retorna código
5. Sistema troca código por access_token e refresh_token
6. Sistema armazena tokens (criptografados)
7. Sistema armazena athleteId

### **9.2.3. Importação de Treinos**
- **Sincronização Manual:**
  - Botão "Sincronizar Treinos" no perfil
  - Busca atividades do Strava desde última sincronização
  - Filtra apenas atividades do clube Hack Running (se membro do clube no Strava)
  - Importa: data, distância, tempo, pace
  - Cria treino no sistema com status "pendente"
  - Usuário precisa adicionar foto e completar validação

- **Sincronização Automática (Futuro):**
  - Webhook do Strava quando nova atividade criada
  - Importação automática

### **9.2.4. Refresh Token**
- Tokens do Strava expiram
- Sistema renova automaticamente usando refresh_token
- Atualiza tokens no banco

## **9.3. Integração Resend (Emails)**

### **9.3.1. Configuração**
- API Key do Resend
- Domínio verificado (hackrunning.com.br)
- Templates criados com React Email

### **9.3.2. Tipos de Email**
- **Transacionais:**
  - Confirmação de cadastro
  - Recuperação de senha
  - Confirmação de pagamento
  - Kit enviado (com tracking)
- **Notificações:**
  - Treino aprovado/reprovado
  - HPoints creditados
  - Resgate aprovado
  - Meta atingida
- **Lembretes:**
  - Pontos próximos de expirar (30 dias)
  - Together/Prova próximos
  - Novo desafio disponível

### **9.3.3. Templates React Email**
- Layout base com identidade Hack Running!
- Responsivos (mobile-first)
- Dark mode
- Botões de ação (CTA)
- Footer com links úteis

### **9.3.4. Exemplo de Implementação**
```javascript
// services/emailService.js
const { Resend } = require('resend');
const { render } = require('@react-email/render');
const WelcomeEmail = require('../emails/WelcomeEmail');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail(user) {
  const html = await render(WelcomeEmail({ name: user.name }));
  
  await resend.emails.send({
    from: 'Hack Running! <noreply@hackrunning.com.br>',
    to: user.email,
    subject: 'Bem-vindo ao Hack Running! 🏃',
    html
  });
}

module.exports = { sendWelcomeEmail };
```

```jsx
// emails/WelcomeEmail.jsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export default function WelcomeEmail({ name }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#000', color: '#fff' }}>
        <Container>
          <Text>Olá, {name}! 👋</Text>
          <Text>Bem-vindo ao Hack Running!</Text>
          <Button 
            href="https://app.hackrunning.com.br"
            style={{ backgroundColor: '#eeff00', color: '#000' }}
          >
            Acessar App
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

## **9.4. Integração Mapbox (Mapas)**

### **9.4.1. Configuração**
- Access Token do Mapbox
- Estilo de mapa customizado (dark mode)

### **9.4.2. Funcionalidades**
- Exibir localização de eventos (Together, Provas)
- Marcadores personalizados
- Popup com informações do evento
- Geocoding: converter endereço em coordenadas
- Directions API (opcional): instruções de como chegar

### **9.4.3. Componente de Mapa**
- Componente React reutilizável
- Props: coordenadas, zoom, marcadores
- Estilo consistente com design system

### **9.4.4. Exemplo de Componente**
```jsx
// components/shared/Map/EventMap.jsx
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function EventMap({ lat, lng, name, address }) {
  const mapContainer = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark mode
      center: [lng, lat],
      zoom: 14
    });

    // Marcador personalizado
    const marker = new mapboxgl.Marker({ color: '#eeff00' })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <strong>${name}</strong><br/>
        <span>${address}</span>
      `))
      .addTo(map);

    return () => map.remove();
  }, [lat, lng, name, address]);

  return <div ref={mapContainer} className="h-64 w-full rounded-lg" />;
}
```

## **9.5. Integração AWS S3 (Armazenamento de Mídias)**

### **9.5.1. Configuração**
- Bucket criado no S3
- Credenciais AWS (Access Key, Secret Key)
- Região: escolher mais próxima (ex: sa-east-1)

### **9.5.2. Funcionalidades**
- **Upload de Fotos:**
  - Fotos de treinos
  - Fotos de provas
  - Fotos de eventos
  - Thumbnails de produtos
  - Fotos de perfil (futuro)

- **Upload de Vídeos:**
  - Vídeos de treinos
  - Vídeos de eventos
  - Vídeos de aulas (ou usar serviço dedicado)

- **Processamento:**
  - Redimensionar imagens (thumbnails)
  - Comprimir se necessário
  - Gerar URLs públicas ou assinadas

- **Organização:**
  - Estrutura de pastas:
    - `workouts/{userId}/{workoutId}/`
    - `events/{eventId}/`
    - `products/{productId}/`
    - `content/{contentId}/`

### **9.5.3. Políticas de Acesso**
- Fotos de treinos: privadas (acesso via URL assinada)
- Fotos públicas: acesso público
- Configurar CORS para uploads do frontend

### **9.5.4. Processamento de Imagens (Sharp)**
- **Antes do upload:**
  - Redimensionar para tamanhos padrão
  - Comprimir com qualidade otimizada
  - Converter para WebP (quando suportado)
  - Gerar thumbnails automaticamente
- **Tamanhos:**
  - Original: max 1920px (largura)
  - Medium: max 800px
  - Thumbnail: max 400px

### **9.5.5. Exemplo de Serviço de Imagem**
```javascript
// services/imageService.js
const sharp = require('sharp');
const { nanoid } = require('nanoid');
const s3Service = require('./s3Service');

async function processAndUploadImage(buffer, folder) {
  const id = nanoid(12);
  const results = {};

  // Original (max 1920px, 80% qualidade)
  const original = await sharp(buffer)
    .resize(1920, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  
  results.original = await s3Service.upload(
    original, 
    `${folder}/${id}/original.webp`
  );

  // Medium (800px)
  const medium = await sharp(buffer)
    .resize(800, null)
    .webp({ quality: 75 })
    .toBuffer();
  
  results.medium = await s3Service.upload(
    medium, 
    `${folder}/${id}/medium.webp`
  );

  // Thumbnail (400px)
  const thumbnail = await sharp(buffer)
    .resize(400, null)
    .webp({ quality: 70 })
    .toBuffer();
  
  results.thumbnail = await s3Service.upload(
    thumbnail, 
    `${folder}/${id}/thumbnail.webp`
  );

  return {
    id,
    urls: results
  };
}

module.exports = { processAndUploadImage };
```

---

# **10. DESIGN SYSTEM E UI**

## **10.1. Cores**

### **10.1.1. Paleta Principal**
- **Preto:** `#000000` (background principal)
- **Zinc:** Tons de cinza do Tailwind (zinc-50 a zinc-900)
- **Branco:** `#FFFFFF` (textos em fundo escuro)
- **Amarelo Neon (Primária):** `#eeff00`

### **10.1.2. Uso das Cores**
- Background: Preto e tons de zinc
- Textos: Branco e zinc (contraste adequado)
- Ações primárias: Amarelo neon (#eeff00)
- Ações secundárias: Zinc
- Estados: Success (verde), Error (vermelho), Warning (amarelo), Info (azul)

## **10.2. Tipografia**

### **10.2.1. Fonte Principal**
- **Montserrat** (ou fonte similar que funcione melhor na UI)
- Alternativas consideradas: Inter, Poppins

### **10.2.2. Hierarquia**
- H1: 32px, bold
- H2: 24px, bold
- H3: 20px, semibold
- Body: 16px, regular
- Small: 14px, regular
- Caption: 12px, regular

## **10.3. Componentes Shadcn UI**

### **10.3.1. Componentes Base**
- Button (variantes: primary, secondary, outline, ghost)
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Card
- Dialog/Modal
- Dropdown Menu
- Tabs
- Badge
- Avatar
- Progress Bar
- Skeleton (loading states)

### **10.3.2. Customizações**
- Todos os componentes devem seguir o design system
- Cores primárias: amarelo neon
- Background: dark mode (preto/zinc)
- Adaptar componentes Shadcn para dark mode

## **10.4. Animações e Transições** ⚠️ **CRUCIAL**

### **10.4.1. Princípios Fundamentais**
- **TUDO deve ser animado** - Não há exceções. Cada elemento, interação e transição deve ter animação fluida
- **Experiência extremamente suave** - O usuário deve sentir que está usando um app premium, não um site estático
- **Feedback visual imediato** - Toda ação do usuário deve ter resposta visual animada
- **Consistência** - Usar padrões de animação consistentes em todo o app

### **10.4.2. Biblioteca de Animações**
- **Framer Motion** é a biblioteca padrão para TODAS as animações
- Não usar CSS animations ou transitions diretamente (exceto quando necessário para performance específica)
- Todos os componentes devem ser wrappeados com `motion` do Framer Motion

### **10.4.3. Tipos de Animações Obrigatórias**
1. **Transições de Página/Rota:**
   - Fade + slide suave entre páginas
   - Animações coordenadas (elementos entram em sequência)

2. **Componentes:**
   - Cards: fade + scale ao aparecer
   - Modais: fade + scale com backdrop blur
   - Dropdowns: slide down + fade
   - Tabs: slide suave entre conteúdos

3. **Interações:**
   - Botões: scale no hover/click
   - Links: underline animado
   - Formulários: validação com animação suave
   - Loading states: shimmer nos skeletons, spinners suaves

4. **Listas e Grids:**
   - Stagger animation (itens aparecem em sequência)
   - Reorder animations ao ordenar

5. **Estados:**
   - Loading → Conteúdo: fade transition
   - Erro → Sucesso: slide + color transition
   - Empty states: fade in com micro-animação

6. **Navegação:**
   - Menu mobile: slide from side
   - Bottom nav: highlight animado
   - Breadcrumbs: fade in

### **10.4.4. Padrões de Duração e Easing**
- **Micro-interações:** 150-250ms (hover, click)
- **Transições padrão:** 300-400ms (aparecer/desaparecer)
- **Transições de página:** 400-600ms (com stagger)
- **Animações complexas:** 500-800ms (modais, drawers)
- **Easing:** `ease-in-out` ou `spring` para naturalidade
- **Spring config:** `{ type: "spring", stiffness: 300, damping: 30 }` para interações naturais

### **10.4.5. Performance**
- Sempre preferir `transform` e `opacity` (GPU-accelerated)
- Usar `will-change` apenas quando necessário
- Lazy load animações pesadas
- Reduzir animações em dispositivos com `prefers-reduced-motion`

### **10.4.6. Checklist de Implementação**
- [ ] Todas as rotas têm transição animada
- [ ] Todos os componentes aparecem com animação
- [ ] Todos os botões têm feedback visual animado
- [ ] Todos os formulários têm validação animada
- [ ] Todos os modais/dialogs têm entrada/saída animada
- [ ] Todas as listas têm stagger animation
- [ ] Todos os loading states são animados
- [ ] Todas as notificações/toasts são animadas
- [ ] Navegação tem transições suaves
- [ ] Hover states têm micro-interações

**LEMBRETE:** Se algo não está animado, está incompleto. A fluidez e suavidade são características fundamentais da experiência do usuário neste projeto.

## **10.5. Layout Mobile-First**

### **10.5.1. Breakpoints**
- Mobile: < 640px (foco principal)
- Tablet: 640px - 1024px
- Desktop: > 1024px

### **10.5.2. Navegação**
- Bottom navigation bar (mobile)
- Sidebar (desktop/admin)
- Hamburger menu quando necessário

## **10.6. Componentes Customizados**

### **10.6.1. Componentes do App**
- Card de Treino
- Card de HPoints
- Card de Produto (Loja)
- Card de Evento
- Progress Bar de Adesão
- Gráfico de Evolução
- Feed de Comunidade
- Formulário de Registro de Treino

### **10.6.2. Componentes do Admin**
- Dashboard Cards
- Tabela de Membros
- Tabela de Validação
- Formulário de Ajuste de HPoints
- Gráficos e Charts

---

# **11. REGRAS DE NEGÓCIO**

## **11.1. Planilha de Treinos**

1. **Geração Automática:**
   - Planilha é SEMPRE gerada automaticamente após compra do Kickstart Kit
   - Algoritmo usa: nível, objetivo, metas, disponibilidade
   - Ciclo sugerido: 30, 45, 60 ou 90 dias

2. **Revisão Humana:**
   - Disponível APENAS para planos pagos/premium
   - Deve estar ATIVADA no admin (por plano ou por usuário)
   - Coach revisa e pode aprovar/ajustar
   - Membro recebe notificação quando revisada

3. **Ajuste Inteligente:**
   - Se membro faltar 2+ treinos consecutivos:
     - Sistema adapta semana seguinte automaticamente
     - Reduz carga para evitar sobrecarga
     - Exibe aviso ao membro

4. **Adesão:**
   - Calculada automaticamente: (Treinos Concluídos / Total) * 100
   - Atualizada em tempo real
   - Exibida na home e planilha

## **11.2. HPoints**

1. **Ganho de Pontos:**
   - Treino individual: X pontos (configurável)
   - Treino Together: Y pontos (configurável)
   - Prova: Z pontos (configurável)
   - Pódio geral: A pontos (configurável)
   - Pódio categoria: B pontos (configurável)
   - Pódio duplo: A + B pontos (soma dos dois)
   - Desafios: variável (configurável)
   - Indicação: X pontos (configurável)
   - Foto/vídeo qualidade: X pontos (configurável)
   - Cashback Mediterraneum: X% (configurável)

2. **Validação:**
   - Toda atividade com HPoints exige validação manual
   - Moderador aprova/reprova
   - Pontos creditados apenas após aprovação

3. **Expiração:**
   - HPoints expiram em **6 meses** após ganho
   - Sistema mostra alerta 30 dias antes
   - Expiração automática (job diário)

4. **Resgate:**
   - Usa pontos mais antigos primeiro (FIFO)
   - Verifica saldo suficiente antes de permitir resgate
   - Gera código único e QR Code
   - Pode exigir aprovação (configurável por produto)

## **11.3. Kickstart Kit**

1. **Obrigatório:**
   - Membro NÃO entra no ciclo sem comprar o kit
   - Após cadastro e onboarding, tela de compra aparece
   - Valor: R$ 120 (gratuito) ou R$ 60 + valor do plano (pago)

2. **Fluxo:**
   - Selecionar tamanho camiseta
   - Escolher plano
   - Pagar via Asaas
   - Após pagamento: gerar planilha automática
   - Kit enviado para endereço cadastrado

3. **Status:**
   - Pendente (aguardando pagamento)
   - Preparando (após pagamento)
   - Enviado (com código de rastreamento)
   - Entregue

## **11.4. Planos**

1. **Gratuito:**
   - Acesso ao app
   - HPoints
   - Comunidade
   - Together
   - Planilhas básicas
   - 1 aula online/mês
   - Acesso a desafios
   - Kickstart Kit obrigatório

2. **Pago:**
   - Tudo do gratuito +
   - Treino estruturado completo
   - KPIs avançados
   - Gráficos completos
   - Aulas completas
   - Conteúdos avançados
   - Revisão humana (se ativada)
   - Suporte

3. **Premium:**
   - Tudo do pago +
   - Modelos preditivos (Fase 2)
   - Relatórios semanais (Fase 2)
   - Ajustes manuais mensais pelo coach

4. **Corporativo:**
   - Acesso completo dos colaboradores
   - Dashboard corporativo
   - 2 aulas exclusivas/mês
   - Treinos e desafios corporativos

## **11.5. Validação de Treinos**

1. **Requisitos para Validação:**
   - Foto obrigatória
   - Dados do treino (distância, tempo)
   - Checklist de compartilhamento (Strava, IG, WPP) - não obrigatório, mas influencia

2. **Processo:**
   - Membro envia treino
   - Status: "pendente"
   - Moderador revisa foto e dados
   - Aprova ou reprova (com motivo)
   - Se aprovado: HPoints creditados
   - Membro recebe notificação

## **11.6. Integração Strava**

1. **Fase 1:**
   - Importação manual (botão sincronizar)
   - Importa apenas atividades do clube Hack Running
   - Membro ainda precisa adicionar foto e validar

2. **Futuro (Fase 2):**
   - Importação automática via webhook
   - Validação automática (se critérios atendidos)

## **11.7. Pagamentos e Notas Fiscais**

1. **Fluxo:**
   - Criar cliente no Asaas
   - Criar cobrança
   - Usuário paga
   - Webhook confirma pagamento
   - Asaas gera nota fiscal automaticamente (configurado no painel)
   - Liberar produto/serviço

2. **Notas Fiscais:**
   - Geradas automaticamente pelo Asaas após pagamento confirmado
   - Configuração feita no painel do Asaas
   - Dados da nota disponíveis via API do Asaas quando necessário

---

# **12. APIs E ENDPOINTS**

## **12.1. Autenticação**

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/me
```

## **12.2. Users**

```
GET    /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
POST   /api/users/:id/suspend
POST   /api/users/:id/activate
```

## **12.3. Onboarding**

```
POST /api/onboarding
GET  /api/onboarding/:userId
PUT  /api/onboarding/:userId
```

## **12.4. Training Plans**

```
GET  /api/training-plans
GET  /api/training-plans/:id
POST /api/training-plans/generate
PUT  /api/training-plans/:id
POST /api/training-plans/:id/review
POST /api/training-plans/:id/adjust
```

## **12.5. Workouts**

```
GET    /api/workouts
GET    /api/workouts/:id
POST   /api/workouts
PUT    /api/workouts/:id
DELETE /api/workouts/:id
POST   /api/workouts/:id/validate
POST   /api/workouts/import-strava
```

## **12.6. HPoints**

```
GET  /api/hpoints
GET  /api/hpoints/balance
GET  /api/hpoints/history
POST /api/hpoints/adjust
GET  /api/hpoints/expiring
```

## **12.7. Redemptions**

```
GET  /api/redemptions
GET  /api/redemptions/:id
POST /api/redemptions
PUT  /api/redemptions/:id/approve
PUT  /api/redemptions/:id/deliver
```

## **12.8. Products**

```
GET  /api/products
GET  /api/products/:id
POST /api/products (admin)
PUT  /api/products/:id (admin)
DELETE /api/products/:id (admin)
```

## **12.9. Events**

```
GET  /api/events
GET  /api/events/:id
POST /api/events (admin)
PUT  /api/events/:id (admin)
DELETE /api/events/:id (admin)
POST /api/events/:id/confirm
POST /api/events/:id/validate-batch
```

## **12.10. Challenges**

```
GET  /api/challenges
GET  /api/challenges/:id
POST /api/challenges (admin)
PUT  /api/challenges/:id (admin)
POST /api/challenges/:id/participate
GET  /api/challenges/:id/progress
```

## **12.11. Companies**

```
GET  /api/companies
GET  /api/companies/:id
POST /api/companies (admin)
PUT  /api/companies/:id (admin)
GET  /api/companies/:id/dashboard
GET  /api/companies/:id/report
```

## **12.12. Content**

```
GET  /api/content
GET  /api/content/:id
POST /api/content (admin)
PUT  /api/content/:id (admin)
DELETE /api/content/:id (admin)
```

## **12.13. Upload**

```
POST /api/upload/workout
POST /api/upload/event
POST /api/upload/product
```

## **12.14. Webhooks**

```
POST /api/webhooks/asaas
POST /api/webhooks/strava
```

## **12.15. Admin**

```
GET  /api/admin/dashboard
GET  /api/admin/stats
GET  /api/admin/validation/queue
POST /api/admin/validation/:id/approve
POST /api/admin/validation/:id/reject
```

## **12.16. Orders**

```
GET  /api/orders
GET  /api/orders/:id
POST /api/orders
PUT  /api/orders/:id
GET  /api/orders/:id/invoice
```

## **12.17. Notifications**

```
GET  /api/notifications
GET  /api/notifications/unread
PUT  /api/notifications/:id/read
PUT  /api/notifications/read-all
POST /api/notifications (admin)
POST /api/notifications/schedule (admin)
```

## **12.18. Settings**

```
GET  /api/settings
GET  /api/settings/:key
PUT  /api/settings/:key (admin)
```

## **12.19. Cycles**

```
GET  /api/cycles
GET  /api/cycles/:id
POST /api/cycles (admin)
PUT  /api/cycles/:id (admin)
DELETE /api/cycles/:id (admin)
```

## **12.20. Integrations**

```
GET  /api/integrations/strava/connect
GET  /api/integrations/strava/callback
POST /api/integrations/strava/sync
```

---

# **13. TESTES**

## **13.1. Testes Unitários**

### **13.1.1. Backend**
- Testes de modelos (Mongoose)
- Testes de serviços (lógica de negócio)
- Testes de utilitários
- Cobertura mínima: 70%

### **13.1.2. Frontend**
- Testes de componentes React
- Testes de hooks customizados
- Testes de stores Zustand
- Cobertura mínima: 60%

## **13.2. Testes de Integração**

### **13.2.1. APIs**
- Testes de endpoints
- Testes de autenticação
- Testes de autorização (roles)
- Testes de validação de dados

### **13.2.2. Integrações Externas**
- Testes com Asaas (sandbox)
- Testes com Strava (sandbox)
- Testes com AWS S3 (test bucket)

## **13.3. Configuração do Vitest**

### **13.3.1. Arquivo vitest.config.mjs**
```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{js,jsx,mjs}',
        '.next/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### **13.3.2. Exemplo de Teste**
```javascript
// services/hpointService.test.js
import { describe, it, expect } from 'vitest';
import { calculatePoints, isExpired } from './hpointService';

describe('HPointService', () => {
  describe('calculatePoints', () => {
    it('should return 10 points for workout with photo', () => {
      const workout = { hasPhoto: true, photoValidated: true };
      expect(calculatePoints(workout)).toBe(10);
    });
    
    it('should return 5 points for workout without photo', () => {
      const workout = { hasPhoto: false };
      expect(calculatePoints(workout)).toBe(5);
    });
  });

  describe('isExpired', () => {
    it('should return true for expired points', () => {
      const expirationDate = new Date('2024-01-01');
      expect(isExpired(expirationDate)).toBe(true);
    });
  });
});
```

### **13.3.3. Scripts de Teste**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  }
}
```

## **13.4. Testes de Performance**

- Tempo de resposta das APIs (< 500ms)
- Tempo de carregamento das páginas (< 3s)
- Otimização de imagens
- Lazy loading funcionando

---

# **14. PERFORMANCE E OTIMIZAÇÃO**

## **14.1. Frontend**

### **14.1.1. Next.js**
- **Image Optimization:** Usar Next.js Image com lazy loading
- **Code Splitting:** Automático com App Router
- **SSR/SSG:** Onde fizer sentido
- **PWA:** Service Worker para cache de assets

### **14.1.2. Bundle Size**
- Analisar bundle size
- Tree shaking
- Remover dependências não usadas

### **14.1.3. Lazy Loading**
- Componentes pesados (lazy import)
- Imagens (Next.js Image)
- Rotas (dynamic import)

## **14.2. Backend**

### **14.2.1. Banco de Dados**
- Índices nas collections (email, CPF, userId, etc.)
- Queries otimizadas
- Agregações eficientes

### **14.2.2. APIs**
- Paginação em todas as listas
- Limite de resultados
- Campos selecionados (não trazer tudo)

### **14.2.3. Uploads**
- Compressão de imagens antes do upload
- Upload direto para S3 (presigned URLs)
- Processamento assíncrono quando possível

## **14.3. Infraestrutura (Futuro)**

- CDN para assets estáticos
- Cache de queries frequentes (Redis)
- Load balancer
- Monitoramento (APM)

## **14.4. Logging (Winston)**

### **14.4.1. Configuração**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.colorize({ all: true })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

### **14.4.2. Níveis de Log**
| Nível | Uso |
|-------|-----|
| `error` | Erros críticos, exceções não tratadas |
| `warn` | Avisos, operações suspeitas |
| `info` | Ações importantes (pagamentos, validações) |
| `http` | Requisições HTTP (via morgan) |
| `debug` | Debug em desenvolvimento |

### **14.4.3. O Que Logar**
- **Requisições HTTP:** Método, rota, status, tempo de resposta
- **Autenticação:** Login, logout, tentativas falhas
- **Pagamentos:** Webhooks recebidos, status alterado
- **HPoints:** Créditos, débitos, expirações
- **Validações:** Treinos aprovados/reprovados
- **Erros:** Stack trace completo
- **Integrações:** Chamadas a APIs externas

### **14.4.4. Formato de Log (Produção)**
```json
{
  "timestamp": "2025-12-14T10:30:00.000Z",
  "level": "info",
  "message": "HPoints credited",
  "userId": "507f1f77bcf86cd799439011",
  "points": 10,
  "reason": "workout_photo",
  "workoutId": "507f1f77bcf86cd799439012"
}
```

---

# **15. LGPD E COMPLIANCE**

## **15.1. Política de Privacidade**

- Documento completo
- Explicar quais dados são coletados
- Como são usados
- Com quem são compartilhados
- Direitos do usuário

## **15.2. Termos de Uso**

- Regras do serviço
- Responsabilidades
- Limitações
- Em nome da HSP (com MAP citado como executor técnico)

## **15.3. Consentimento**

- Checkbox no cadastro
- Armazenar data/hora do consentimento
- Permitir revogação

## **15.4. Dados Sensíveis**

- CPF: criptografado no banco
- Senhas: hash com bcrypt
- Tokens Strava: criptografados
- Dados de pagamento: não armazenar (usar Asaas)

## **15.5. Direitos do Usuário**

- Acesso aos dados
- Correção de dados
- Exclusão de dados
- Portabilidade
- Revogação de consentimento

## **15.6. Auditoria**

- Log de todas as ações sensíveis
- Acesso a dados pessoais
- Alterações de dados
- Exclusões

---

# **16. DEPENDÊNCIAS DO PROJETO**

## **16.1. Frontend (package.json)**

```json
{
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-query-devtools": "^5.x",
    "zustand": "^4.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "date-fns": "^3.x",
    "nanoid": "^5.x",
    "mapbox-gl": "^3.x",
    "recharts": "^2.x",
    "framer-motion": "^11.x"
  },
  "devDependencies": {
    "tailwindcss": "^4.x",
    "vitest": "^2.x",
    "@vitejs/plugin-react": "^4.x",
    "@testing-library/react": "^16.x",
    "eslint": "^8.x",
    "eslint-config-next": "^16.x"
  }
}
```

## **16.2. Backend (package.json)**

```json
{
  "dependencies": {
    "express": "^4.x",
    "mongoose": "^8.x",
    "jsonwebtoken": "^9.x",
    "passport": "^0.7.x",
    "passport-jwt": "^4.x",
    "bcrypt": "^5.x",
    "joi": "^17.x",
    "multer": "^1.x",
    "@aws-sdk/client-s3": "^3.x",
    "sharp": "^0.33.x",
    "resend": "^4.x",
    "@react-email/components": "^0.x",
    "qrcode": "^1.x",
    "helmet": "^7.x",
    "express-rate-limit": "^7.x",
    "express-slow-down": "^2.x",
    "compression": "^1.x",
    "winston": "^3.x",
    "node-cron": "^3.x",
    "cors": "^2.x",
    "dotenv": "^16.x",
    "date-fns": "^3.x",
    "nanoid": "^5.x"
  },
  "devDependencies": {
    "vitest": "^2.x",
    "nodemon": "^3.x"
  }
}
```

---

# **17. CRONOGRAMA E ENTREGAS**

## **17.1. Fases de Desenvolvimento**

### **Fase 1: Setup e Infraestrutura (Semana 1-2)**
- Setup do projeto (Next.js + Express)
- Configuração do MongoDB
- Configuração do AWS S3
- Setup de autenticação JWT
- Estrutura de pastas
- Design system básico

### **Fase 1.2: Autenticação e Cadastro (Semana 3-4)**
- Tela de login
- Tela de cadastro
- Validações
- Onboarding completo
- Integração inicial com Asaas

### **Fase 1.3: Kickstart Kit e Pagamentos (Semana 5-6)**
- Tela de compra do kit
- Integração completa Asaas
- Webhooks de pagamento
- Configuração de notas fiscais automáticas no Asaas
- Fluxo completo de compra

### **Fase 1.4: Planilhas e Treinos (Semana 7-10)**
- Algoritmo de geração de planilha (preparado para fórmula futura)
- Tela de planilha
- Registro de treinos
- Upload de fotos (S3)
- Histórico de treinos
- Cálculo de adesão

### **Fase 1.5: Validação e HPoints (Semana 11-12)**
- Sistema de validação (fila)
- Painel de validação (admin)
- Sistema de HPoints completo
- Regras de pontuação (configuráveis)
- Expiração automática (cron job)
- Histórico de pontos

### **Fase 1.6: Loja e Resgates (Semana 13-14)**
- Catálogo de produtos
- Tela de resgate
- Geração de QR Code
- Aprovação de resgates (admin)
- Histórico de resgates

### **Fase 1.7: Eventos e Desafios (Semana 15-16)**
- CRUD de eventos (Together e Provas)
- Confirmação de presença
- Registro pós-evento
- CRUD de desafios
- Acompanhamento de progresso

### **Fase 1.8: Comunidade e Conteúdos (Semana 17-18)**
- Feed da comunidade
- Filtros do feed
- CRUD de aulas (admin)
- CRUD de artigos (admin)
- Player de vídeo
- Restrições por plano

### **Fase 1.9: Dashboard e Métricas (Semana 19-20)**
- Home do membro (widgets)
- Gráficos de evolução
- Métricas corporais
- Metas pessoais
- Dashboard corporativo (admin)
- Relatórios

### **Fase 1.10: Integração Strava (Semana 21-22)**
- OAuth do Strava
- Conexão de conta
- Importação manual de treinos
- Sincronização

### **Fase 1.11: Painel Admin Completo (Semana 23-24)**
- Dashboard geral
- Gestão de membros
- Gestão de empresas
- Gestão de planilhas
- Configurações do sistema
- Logs e auditoria

### **Fase 1.12: Revisão Humana (Semana 25-26)**
- Sistema de revisão de planilhas
- Fila de revisão
- Interface do coach
- Notificações

### **Fase 1.13: Testes e Ajustes (Semana 27-28)**
- Testes unitários
- Testes de integração
- Correções de bugs
- Ajustes de performance

### **Fase 1.14: LGPD e Finalizações (Semana 29-30)**
- Política de privacidade
- Termos de uso
- Consentimentos
- Ajustes finais
- Documentação

---

# **18. CONSIDERAÇÕES FINAIS**

## **17.1. Prioridades**

Todas as funcionalidades da Fase 1 são críticas para o lançamento. O desenvolvimento deve seguir a ordem das fases para garantir que funcionalidades dependentes sejam construídas na sequência correta.

## **17.2. Flexibilidade**

O sistema deve ser construído de forma flexível para:
- Receber a fórmula de VO2 max e cálculos de planilha posteriormente
- Ajustar regras de HPoints facilmente
- Adicionar novos tipos de produtos/resgates
- Expandir funcionalidades na Fase 2

## **17.3. Documentação**

- Código bem documentado
- README com instruções de setup
- Documentação de APIs (Swagger/OpenAPI)
- Guia de contribuição (se aplicável)

## **17.4. Manutenibilidade**

- Código limpo e organizado
- Padrões consistentes
- Testes que facilitam refatoração
- Arquitetura escalável

---

# **19. LISTA DE TAREFAS DETALHADAS**

## **19.1. Setup e Infraestrutura (Tarefas 1-50)**

- [x] Criar estrutura de pastas do projeto frontend (client/)
- [x] Criar estrutura de pastas do projeto backend (server/)
- [x] Inicializar projeto Next.js 16 com App Router
- [x] Configurar package.json do frontend com todas as dependências (incluindo framer-motion)
- [x] Configurar package.json do backend com todas as dependências
- [x] Instalar e configurar Framer Motion no frontend (CRUCIAL - todas as animações devem usar Framer Motion)
- [x] Instalar e configurar Tailwind CSS v4 no frontend
- [x] Configurar arquivo tailwind.config.js com cores do design system
- [x] Criar arquivo de variáveis de ambiente .env.example para frontend
- [x] Criar arquivo de variáveis de ambiente .env.example para backend
- [x] Configurar arquivo .gitignore com padrões corretos
- [x] Configurar ESLint para Next.js no frontend
- [ ] Configurar Prettier para formatação de código
- [x] Criar arquivo next.config.js com configurações básicas
- [x] Configurar MongoDB connection no backend (server/src/config/database.js)
- [x] Criar arquivo de configuração AWS S3 (server/src/config/aws.js)
- [x] Criar arquivo de configuração Asaas (server/src/config/asaas.js)
- [x] Criar arquivo de configuração Strava (server/src/config/strava.js)
- [x] Criar arquivo de configuração Resend (server/src/config/resend.js)
- [x] Criar arquivo de configuração Mapbox (server/src/config/mapbox.js)
- [x] Configurar Express app básico (server/src/app.js)
- [x] Configurar middleware de CORS no Express
- [x] Configurar Helmet.js com Content-Security-Policy
- [x] Configurar rate limiters completos (geral 100 req/min, login 5 req/15min, registro 3 req/hora, slow-down progressivo)
- [ ] Configurar compression middleware (gzip/brotli)
- [x] Configurar Winston logger completo (server/src/utils/logger.js) - formato desenvolvimento/produção, transportes de arquivo (error.log, combined.log)
- [x] Configurar Vitest no frontend (client/vitest.config.mjs)
- [x] Configurar Vitest no backend (server/vitest.config.mjs)
- [x] Criar arquivo de setup para testes (client/tests/setup.js)
- [x] Criar arquivo de setup para testes (server/tests/setup.js)
- [x] Configurar alias @ para imports no frontend
- [x] Configurar alias @ para imports no backend
- [ ] Criar arquivo de constantes compartilhadas (client/lib/constants.js)
- [x] Criar arquivo de constantes compartilhadas (server/src/utils/constants.js)
- [ ] Configurar PWA no Next.js (manifest.json)
- [ ] Configurar Service Worker para cache de assets
- [ ] Criar arquivo de configuração de rate limiter (server/src/config/rateLimiter.js)
- [x] Configurar middleware de error handler (server/src/middleware/errorHandler.js)
- [ ] Criar estrutura de pastas app/ no frontend
- [ ] Criar estrutura de pastas components/ no frontend
- [ ] Criar estrutura de pastas lib/ no frontend
- [ ] Criar estrutura de pastas store/ (Zustand) no frontend
- [ ] Criar estrutura de pastas hooks/ no frontend
- [ ] Criar estrutura de pastas queries/ (TanStack Query) no frontend

## **19.2. Banco de Dados e Models (Tarefas 51-100)**

- [x] Criar model User (server/src/models/User.js) com schema completo
- [x] Adicionar índices no model User (email, cpf)
- [x] Criar model Workout (server/src/models/Workout.js) com schema completo
- [x] Adicionar índices no model Workout (userId, date)
- [x] Criar model TrainingPlan (server/src/models/TrainingPlan.js) com schema completo
- [x] Adicionar índices no model TrainingPlan (userId)
- [x] Criar model Cycle (server/src/models/Cycle.js) com schema completo
- [x] Criar model HPoint (server/src/models/HPoint.js) com schema completo
- [x] Adicionar índices no model HPoint (userId)
- [x] Criar model Redemption (server/src/models/Redemption.js) com schema completo
- [x] Adicionar índices no model Redemption (userId, redemptionCode)
- [x] Criar model Product (server/src/models/Product.js) com schema completo
- [x] Criar model Company (server/src/models/Company.js) com schema completo
- [x] Adicionar índices no model Company (cnpj)
- [x] Criar model Event (server/src/models/Event.js) com schema completo
- [x] Adicionar índices no model Event (date, type)
- [x] Criar model Challenge (server/src/models/Challenge.js) com schema completo
- [x] Criar model Order (server/src/models/Order.js) com schema completo
- [x] Adicionar índices no model Order (userId)
- [x] Criar model Content (server/src/models/Content.js) com schema completo
- [x] Criar model Notification (server/src/models/Notification.js) com schema completo
- [x] Adicionar índices no model Notification (userId)
- [x] Criar model AuditLog (server/src/models/AuditLog.js) com schema completo
- [x] Adicionar índices no model AuditLog (userId, createdAt)
- [x] Criar model Setting (server/src/models/Setting.js) com schema completo
- [x] Adicionar índice único no model Setting (key)
- [x] Implementar validações padrão em todos os models (timestamps automáticos, enums, campos obrigatórios)
- [x] Criar função de hash de senha com bcrypt (10 salt rounds)
- [x] Criar função de comparação de senha com bcrypt
- [x] Implementar método de instância para calcular adesão no TrainingPlan
- [x] Implementar método de instância para verificar expiração no HPoint
- [x] Implementar método estático para buscar HPoints expirando em 30 dias
- [x] Implementar método estático para buscar treinos pendentes de validação
- [x] Implementar método estático para buscar resgates pendentes de aprovação
- [ ] Criar seeders para dados iniciais (cycles, settings)
- [ ] Criar função de migração de dados (se necessário)
- [x] Implementar soft delete para Users (campo active)
- [x] Implementar validação de CPF único no model User
- [x] Implementar validação de email único no model User
- [x] Implementar validação de CNPJ único no model Company
- [x] Criar função helper para validar CPF
- [x] Criar função helper para validar CNPJ
- [x] Implementar método para calcular pace (tempo/distância) no Workout
- [x] Implementar método para atualizar saldo de HPoints no User
- [x] Implementar método para buscar próximos eventos no Event
- [x] Implementar método para buscar desafios ativos no Challenge
- [x] Criar índices compostos para queries frequentes
- [x] Documentar todos os models com JSDoc

## **19.3. Autenticação e Segurança (Tarefas 101-150)**

- [x] Instalar e configurar jsonwebtoken
- [x] Instalar e configurar Passport.js
- [x] Criar estratégia JWT para Passport (server/src/middleware/auth.js)
- [x] Criar função para gerar token JWT (expiração 24h)
- [x] Criar função para verificar token JWT
- [x] Criar middleware de autenticação (verificar token)
- [x] Criar middleware de roles (server/src/middleware/roles.js)
- [x] Implementar verificações de todas as roles no middleware (super_admin, operational_admin, content_admin, company_admin, media_moderator, coach)
- [x] Criar função helper para verificar permissões específicas
- [x] Implementar refresh token (opcional Fase 1)
- [x] Criar controller de autenticação (server/src/controllers/authController.js)
- [x] Implementar endpoint POST /api/auth/register
- [x] Implementar validação de dados no registro (Joi/express-validator)
- [x] Implementar hash de senha no registro
- [x] Implementar endpoint POST /api/auth/login
- [x] Implementar validação de credenciais no login
- [x] Implementar geração de token após login bem-sucedido
- [x] Implementar endpoint POST /api/auth/logout
- [x] Implementar endpoint GET /api/auth/me (dados do usuário logado)
- [x] Implementar endpoint POST /api/auth/forgot-password
- [x] Criar função para gerar token de reset de senha
- [x] Implementar envio de email de recuperação de senha
- [x] Implementar endpoint POST /api/auth/reset-password
- [x] Validar token de reset antes de permitir alteração
- [x] Implementar endpoint POST /api/auth/refresh (se implementado)
- [ ] Criar templates de email com React Email (recuperação senha, confirmação cadastro)
- [ ] Implementar verificação de email (opcional Fase 1)
- [x] Criar função para criptografar tokens do Strava antes de salvar
- [x] Criar função para descriptografar tokens do Strava ao usar
- [x] Implementar validação de rate limit no login
- [x] Implementar bloqueio temporário após tentativas falhas de login
- [x] Criar função para registrar tentativas de login falhas
- [x] Implementar sanitização de inputs para prevenir XSS
- [x] Configurar todos os headers de segurança do Helmet.js (Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Strict-Transport-Security)
- [x] Implementar validação de origem CORS
- [x] Criar função para validar JWT em webhooks (signature)
- [ ] Implementar proteção contra CSRF (se necessário)
- [x] Criar função para gerar tokens seguros com nanoid
- [x] Implementar rota de health check (/api/health)
- [x] Documentar todos os endpoints de autenticação

## **19.4. Frontend - Configuração Base (Tarefas 151-200)**

- [x] Criar Providers component com QueryClientProvider (app/providers.jsx)
- [x] Configurar QueryClient com defaultOptions (staleTime, gcTime, retry)
- [x] Adicionar ReactQueryDevtools no Providers
- [x] Criar layout principal (app/layout.jsx)
- [x] Configurar metadata no layout (title, description)
- [x] Configurar fontes (Montserrat ou similar) no layout
- [x] Criar layout para rotas autenticadas (app/(app)/layout.jsx)
- [ ] Criar layout para rotas de admin (app/admin/layout.jsx)
- [x] Criar layout para rotas de auth (app/(auth)/layout.jsx)
- [x] Configurar tema dark mode no Tailwind
- [x] Criar arquivo de cores do design system (styles/colors.js)
- [x] Configurar cores primárias (amarelo neon #eeff00)
- [x] Configurar cores de background (preto e zinc)
- [x] Configurar cores de texto (branco e zinc)
- [x] Criar arquivo de tipografia (styles/typography.js)
- [x] Configurar hierarquia de fontes (H1, H2, H3, Body, Small, Caption)
- [x] Instalar e configurar todos os componentes Shadcn UI necessários (Button, Input, Textarea, Select, Checkbox, Radio, Switch, Card, Dialog, Dropdown Menu, Tabs, Badge, Avatar, Progress Bar, Skeleton) e customizar para dark mode
- [x] Criar arquivo de configuração da API (lib/api/index.js)
- [x] Implementar interceptor de requisições para adicionar token JWT
- [x] Implementar interceptor de respostas para tratar erros
- [ ] Implementar refresh automático de token quando expirar
- [x] Criar helpers de formatação (datas com date-fns, moeda BRL, tempo horas:minutos:segundos, distância km, pace min/km, validação e máscaras de CPF, telefone, CEP, CNPJ)
- [x] Criar store Zustand para autenticação (store/authStore.js)
- [x] Implementar ações de login no store de auth
- [x] Implementar ações de logout no store de auth

## **19.5. Frontend - Autenticação e Onboarding (Tarefas 201-250)**

- [x] Criar página de login (app/(auth)/login/page.jsx)
- [x] Criar formulário de login com React Hook Form + Zod
- [x] Implementar validação de email e senha no formulário de login
- [x] Criar hook useLogin usando TanStack Query Mutation
- [x] Implementar redirecionamento após login bem-sucedido
- [x] Criar página de cadastro (app/(auth)/register/page.jsx)
- [x] Criar formulário de cadastro com todos os campos obrigatórios
- [ ] Implementar validação de CPF único no cadastro
- [ ] Implementar validação de email único no cadastro
- [x] Implementar máscaras nos campos (CPF, telefone, CEP)
- [x] Criar hook useRegister usando TanStack Query Mutation
- [ ] Implementar aceite de termos e política de privacidade no cadastro
- [x] Criar página de esqueci minha senha (app/(auth)/forgot-password/page.jsx)
- [x] Criar formulário de recuperação de senha
- [x] Criar hook useForgotPassword usando TanStack Query Mutation
- [ ] Criar página de reset de senha (app/(auth)/reset-password/page.jsx)
- [ ] Criar formulário de nova senha
- [x] Criar hook useResetPassword usando TanStack Query Mutation
- [x] Criar página de onboarding - Passo 1: Perguntas sobre corrida (app/(app)/onboarding/step1/page.jsx)
- [x] Criar formulário de perguntas sobre corrida (tempo correndo, KM/mês, relógio, Strava)
- [x] Criar página de onboarding - Passo 2: Objetivos (app/(app)/onboarding/step2/page.jsx)
- [x] Criar formulário de seleção de objetivos (múltipla escolha)
- [x] Criar página de onboarding - Passo 3: Metas pessoais (app/(app)/onboarding/step3/page.jsx)
- [x] Criar formulário de metas pessoais (peso, tempo 5K, pace, frequência, KM/mês)
- [x] Criar hook useOnboarding usando TanStack Query Mutation
- [x] Implementar navegação entre passos do onboarding
- [x] Implementar salvamento de progresso do onboarding
- [x] Criar página de compra do Kickstart Kit (app/(app)/onboarding/kickstart-kit/page.jsx)
- [x] Criar componente de card do Kickstart Kit mostrando conteúdo
- [x] Implementar seleção de tamanho de camiseta
- [x] Implementar seleção de plano (Gratuito ou Pago)
- [x] Calcular valor total dinamicamente
- [x] Criar hook useCreateOrder usando TanStack Query Mutation
- [x] Implementar redirecionamento para checkout Asaas
- [x] Criar componente de loading durante processamento
- [x] Criar componente de erro para exibir mensagens
- [x] Implementar proteção de rotas autenticadas (middleware)
- [ ] Implementar proteção de rotas de admin (middleware)
- [x] Criar componente de redirecionamento se não autenticado
- [ ] Criar componente de redirecionamento se não tem role adequada
- [x] Implementar persistência de autenticação (localStorage/sessionStorage)
- [x] Criar hook useAuth para verificar autenticação
- [x] Criar hook useUser para buscar dados do usuário logado (implementado na página de perfil)
- [x] Implementar query useUserQuery com TanStack Query (implementado na página de perfil)
- [x] Criar componente de header com informações do usuário
- [x] Criar componente de menu de usuário (dropdown)
- [x] Implementar logout no menu de usuário
- [x] Criar página de perfil básica (app/(app)/profile/page.jsx)
- [x] Criar formulário de edição de dados pessoais
- [x] Criar hook useUpdateProfile usando TanStack Query Mutation

## **19.6. Frontend - Home e Dashboard (Tarefas 251-300)**

- [x] Criar página Home (app/(app)/home/page.jsx)
- [x] Criar componente de saudação com nome do membro
- [x] Criar widget de adesão à planilha (barra de progresso)
- [x] Implementar cálculo de adesão semanal
- [x] Implementar cálculo de adesão geral do ciclo
- [x] Criar widget de treinos da semana (realizados vs previstos)
- [x] Criar componente de card de próximo treino do ciclo
- [x] Criar widget de HPoints (saldo atual destacado)
- [x] Criar componente de alerta de pontos para expirar (30 dias)
- [x] Criar link para histórico de HPoints
- [x] Criar widget de progresso das metas (cards com barras de progresso)
- [x] Criar componente de card de meta individual
- [x] Criar widget de próximo Together (data, hora, local)
- [x] Criar botão "Confirmar Presença" no widget de Together
- [x] Criar widget de últimas atividades da comunidade (feed resumido)
- [x] Criar componente de card de atividade da comunidade
- [x] Criar widget de status do Kickstart Kit
- [x] Criar componentes de mini-gráficos Recharts (evolução pace LineChart últimos 30 dias, evolução peso LineChart, KM/mês BarChart)
- [x] Implementar query useHomeDataQuery com TanStack Query
- [x] Implementar query useAdherenceQuery com TanStack Query
- [ ] Implementar query useWeeklyWorkoutsQuery com TanStack Query
- [x] Implementar query useHPointsBalanceQuery com TanStack Query
- [ ] Implementar query useGoalsProgressQuery com TanStack Query
- [ ] Implementar query useNextTogetherQuery com TanStack Query
- [ ] Implementar query useCommunityFeedQuery com TanStack Query (últimos 5)
- [x] Criar componente de skeleton loading para widgets da home
- [x] Criar componente de erro para widgets da home
- [x] Implementar refresh manual de dados da home
- [ ] Criar página de dashboard admin (app/admin/dashboard/page.jsx)
- [ ] Criar componente de card de indicador principal (membros totais)
- [ ] Criar componente de card de indicador principal (adesão média)
- [ ] Criar componente de card de indicador principal (KM total)
- [ ] Criar componente de card de indicador principal (status Kickstart Kits)
- [ ] Criar componente de card de indicador principal (treinos registrados)
- [ ] Criar componente de card de indicador principal (HPoints gerados)
- [ ] Criar componente de lista de provas próximas
- [ ] Criar componente de top 10 membros (por HPoints)
- [ ] Criar componente de top 10 membros (por KM)
- [ ] Criar componente de top 10 membros (por adesão)
- [ ] Criar componente de lista de empresas ativas
- [ ] Criar componentes de gráficos Recharts para dashboard admin (crescimento membros LineChart, distribuição planos PieChart, treinos por tipo BarChart, HPoints por tipo BarChart, adesão média por mês AreaChart)
- [ ] Implementar query useAdminDashboardQuery com TanStack Query
- [ ] Implementar query useAdminStatsQuery com TanStack Query
- [ ] Criar componente de filtros de período no dashboard admin

## **19.7. Frontend - Planilha de Treinos (Tarefas 301-350)**

- [x] Criar página de planilha de treinos (app/(app)/training-plan/page.jsx)
- [x] Criar componente de lista de treinos do ciclo
- [x] Criar componente de card de treino individual
- [x] Implementar marcação visual de treinos concluídos
- [x] Implementar destaque do próximo treino
- [x] Criar componente de detalhes do treino (modal ou página)
- [ ] Criar componente de barra de progresso de adesão na planilha
- [ ] Criar componente de informações do ciclo atual (datas, objetivo, nível)
- [x] Implementar query useTrainingPlanQuery com TanStack Query
- [ ] Implementar query useActiveCycleQuery com TanStack Query
- [x] Criar página de registro de treino (app/(app)/workouts/new/page.jsx)
- [x] Criar formulário de registro de treino com React Hook Form + Zod
- [x] Implementar campo de data (padrão: hoje)
- [ ] Implementar seleção de tipo (Individual/Together/Prova)
- [x] Implementar campo de distância (km)
- [x] Implementar campo de tempo (horas:minutos:segundos)
- [x] Implementar seleção de tipo de treino (base, ritmo, intervalado, etc.)
- [x] Criar componente de upload de foto obrigatória
- [x] Implementar preview da foto após upload
- [ ] Criar componente de checklist de compartilhamento (Strava, IG, WPP)
- [ ] Implementar seleção de evento (se Together ou Prova)
- [x] Criar hook useCreateWorkout usando TanStack Query Mutation
- [x] Implementar upload de foto para S3 antes de criar treino
- [x] Implementar validação de dados antes de enviar
- [x] Criar componente de loading durante criação do treino
- [x] Criar página de histórico de treinos (app/(app)/workouts/page.jsx)
- [x] Criar componente de lista de treinos com paginação (implementado sem paginação explícita, mas funcional)
- [x] Criar componente de card de treino no histórico
- [ ] Implementar filtros por data no histórico
- [x] Implementar filtros por tipo no histórico
- [x] Implementar filtros por status no histórico
- [x] Criar componente de detalhes do treino no histórico
- [x] Implementar exibição de foto do treino
- [x] Implementar exibição de status (aprovado, reprovado, pendente)
- [x] Implementar exibição de pontos HPoints ganhos
- [ ] Implementar exibição de motivo de reprovação (se reprovado)
- [x] Implementar query useWorkoutsQuery com TanStack Query
- [x] Implementar query useWorkoutQuery com TanStack Query
- [x] Criar componente de filtros avançados no histórico
- [x] Criar componente de busca por texto no histórico
- [ ] Implementar ordenação no histórico (data, distância, pace)
- [x] Criar página de detalhes do treino (app/(app)/workouts/[id]/page.jsx)
- [x] Criar componente de visualização completa do treino
- [ ] Implementar edição de treino (se pendente)
- [ ] Criar hook useUpdateWorkout usando TanStack Query Mutation
- [x] Implementar query useWorkoutDetailsQuery com TanStack Query
- [ ] Criar componente de comentários/notas do treino
- [x] Criar componente de compartilhamento do treino
- [ ] Implementar cálculo automático de pace ao inserir distância e tempo
- [ ] Criar componente de validação visual de dados do treino

## **19.8. Frontend - HPoints e Loja (Tarefas 351-400)**

- [x] Criar página principal de HPoints (app/(app)/hpoints/page.jsx)
- [x] Criar componente de saldo atual (destaque grande)
- [x] Criar componente de alerta de pontos para expirar (30 dias)
- [x] Criar botão "Como Ganhar" com link
- [x] Criar botão "Histórico" com link
- [x] Criar botão "Resgatar" com link
- [ ] Criar página "Como Ganhar HPoints" (app/(app)/hpoints/how-to-earn/page.jsx)
- [ ] Criar componente de lista de formas de ganhar pontos
- [ ] Criar card de forma de ganhar pontos individual
- [ ] Implementar query useHPointsRulesQuery com TanStack Query
- [ ] Criar página de histórico de HPoints (app/(app)/hpoints/history/page.jsx)
- [ ] Criar componente de lista de ganhos de pontos
- [ ] Criar componente de card de ganho de pontos
- [ ] Implementar filtros por tipo no histórico
- [ ] Implementar filtros por data no histórico
- [ ] Implementar exibição de status (ativo/expirado/resgatado)
- [ ] Implementar exibição de data de expiração
- [ ] Implementar query useHPointsHistoryQuery com TanStack Query
- [ ] Criar componente de alerta visual para pontos próximos de expirar
- [x] Criar página de loja de recompensas (app/(app)/store/page.jsx)
- [x] Criar componente de catálogo de produtos
- [x] Criar componente de card de produto
- [x] Implementar filtros por categoria na loja
- [x] Implementar filtros por tipo de produto (Hack Running, Mediterraneum, etc.)
- [x] Implementar busca por texto na loja
- [x] Criar página de detalhes do produto (app/(app)/store/[id]/page.jsx)
- [x] Criar componente de visualização completa do produto
- [x] Criar componente de informações do produto (nome, descrição, imagem)
- [x] Criar componente de valor em HPoints
- [x] Criar componente de estoque disponível
- [x] Criar botão "Resgatar" no detalhes do produto
- [x] Criar modal de confirmação de resgate
- [x] Criar hook useRedeemHPoints usando TanStack Query Mutation
- [x] Implementar verificação de saldo suficiente antes de resgatar
- [x] Implementar uso de pontos mais antigos primeiro (FIFO)
- [x] Criar componente de loading durante resgate
- [x] Criar página de meus resgates (app/(app)/store/my-redemptions/page.jsx)
- [x] Criar componente de lista de resgates
- [x] Criar componente de card de resgate
- [x] Implementar exibição de status (pendente, aprovado, entregue, cancelado)
- [x] Implementar exibição de código de resgate
- [x] Criar componente de QR Code para apresentar
- [x] Implementar download do QR Code
- [x] Implementar query useRedemptionsQuery com TanStack Query
- [x] Implementar query useRedemptionQuery com TanStack Query
- [x] Criar componente de filtros de status nos resgates
- [x] Criar hook useGenerateQRCode para gerar QR Code
- [x] Criar componente de histórico de pontos usados no resgate
- [x] Criar componente de informações de entrega do resgate
- [ ] Implementar query useProductsQuery com TanStack Query

## **19.9. Frontend - Eventos e Desafios (Tarefas 401-450)**

- [x] Criar página de lista de provas (app/(app)/races/page.jsx)
- [x] Criar componente de card de prova
- [x] Implementar exibição de informações da prova (nome, data, local, distâncias)
- [x] Criar link para inscrição externa
- [ ] Criar botão "Resgatar com HPoints" (se disponível)
- [x] Criar página de detalhes da prova (app/(app)/races/[id]/page.jsx)
- [ ] Criar componente de informações completas da prova
- [ ] Criar componente de mapa do percurso (se disponível)
- [ ] Criar página de registro pós-prova (app/(app)/races/[id]/register/page.jsx)
- [ ] Criar formulário de registro pós-prova (tempo oficial, foto, pódio)
- [x] Criar página de lista de Togethers (app/(app)/together/page.jsx)
- [x] Criar componente de card de Together
- [ ] Criar componente de mini preview do mapa (Mapbox)
- [ ] Criar componente de instruções de como chegar
- [x] Criar página de detalhes do Together (app/(app)/together/[id]/page.jsx)
- [x] Criar componente de informações completas do Together
- [ ] Criar componente de mapa interativo (Mapbox GL JS) com estilo dark
- [ ] Criar marcador personalizado no mapa
- [ ] Criar popup com informações do evento no mapa
- [x] Criar botão "Confirmar Presença"
- [x] Criar componente de lista de participantes confirmados
- [x] Criar hook useConfirmPresence usando TanStack Query Mutation
- [ ] Criar página de registro pós-Together (app/(app)/together/[id]/register/page.jsx)
- [ ] Criar formulário de registro pós-Together
- [x] Criar página de lista de desafios (app/(app)/challenges/page.jsx)
- [x] Criar componente de card de desafio ativo
- [x] Implementar exibição de duração do desafio
- [x] Implementar exibição de pontos bônus
- [x] Implementar exibição de progresso do membro (se participando)
- [x] Criar página de detalhes do desafio (app/(app)/challenges/[id]/page.jsx)
- [x] Criar componente de regras completas do desafio
- [x] Criar componente de critérios para conclusão
- [x] Criar botão "Participar"
- [x] Criar componente de acompanhamento visual do progresso
- [x] Criar hook useParticipateChallenge usando TanStack Query Mutation
- [ ] Criar página de meus desafios (app/(app)/challenges/my-challenges/page.jsx)
- [ ] Criar componente de lista de desafios em que está participando
- [ ] Criar componente de progresso detalhado (treinos, KM, adesão)
- [ ] Implementar exibição de status (em dia/atrasado)
- [x] Implementar query useChallengesQuery com TanStack Query
- [x] Implementar query useChallengeQuery com TanStack Query
- [ ] Implementar query useMyChallengesQuery com TanStack Query
- [x] Implementar query useEventsQuery com TanStack Query
- [ ] Criar componente de filtros de data nos eventos
- [ ] Criar componente de filtros de tipo nos eventos
- [ ] Criar componente de contagem regressiva para eventos próximos
- [ ] Criar componente de galeria de fotos do evento
- [ ] Criar componente de galeria de vídeos do evento
- [ ] Criar hook useUploadEventMedia para upload de fotos/vídeos de eventos
- [x] Implementar query useEventQuery com TanStack Query

## **19.10. Frontend - Comunidade e Conteúdos (Tarefas 451-500)**

- [x] Criar página de feed da comunidade (app/(app)/community/page.jsx)
- [x] Criar componente de feed automático
- [x] Criar componente de card de atividade da comunidade
- [x] Implementar exibição de treinos aprovados com foto
- [ ] Implementar exibição de provas realizadas
- [ ] Implementar exibição de pódios conquistados
- [ ] Implementar exibição de fotos e vídeos enviados
- [ ] Criar componente de filtros do feed (Geral, Minha cidade, Destaques)
- [x] Implementar query useCommunityFeedQuery com TanStack Query
- [ ] Criar componente de paginação no feed
- [ ] Criar componente de loading skeleton no feed
- [x] Criar página de lista de aulas (app/(app)/classes/page.jsx)
- [x] Criar componente de card de aula
- [ ] Implementar filtros por categoria
- [x] Implementar filtros por plano (restrição visual implementada)
- [x] Implementar restrição por plano (gratuito vê 1/mês) (visual implementado)
- [x] Criar página de player de aula (app/(app)/classes/[id]/page.jsx)
- [x] Criar componente de player de vídeo
- [x] Criar componente de descrição da aula
- [x] Criar componente de materiais complementares
- [x] Implementar query useClassesQuery com TanStack Query
- [x] Implementar query useClassQuery com TanStack Query
- [x] Criar página de lista de artigos (app/(app)/nutrition/articles/page.jsx) (link existe)
- [x] Criar componente de card de artigo
- [ ] Implementar filtros por categoria (Nutrição, Suplementação, Técnica, Mentalidade, Saúde)
- [x] Implementar restrição por plano (visual implementado)
- [x] Criar página de leitura de artigo (app/(app)/nutrition/articles/[id]/page.jsx)
- [x] Criar componente de visualização de artigo
- [x] Implementar query useArticlesQuery com TanStack Query
- [x] Implementar query useArticleQuery com TanStack Query
- [x] Criar página de nutrição e suplementação (app/(app)/nutrition/page.jsx)
- [ ] Criar componente de protocolos por objetivo
- [ ] Criar componente de catálogo de suplementos Mediterraneum
- [ ] Criar link para compra com cashback em HPoints
- [x] Criar página de perfil completo (app/(app)/profile/page.jsx)
- [x] Criar componente de edição de dados pessoais
- [ ] Criar componente de visualização de planilha atual
- [ ] Criar componente de histórico de planilhas anteriores
- [ ] Criar componente de desafios em que está participando
- [ ] Criar componente de histórico de desafios concluídos
- [ ] Criar componente de métricas corporais (peso, medidas)
- [ ] Criar gráfico de peso × dias (LineChart)
- [ ] Criar gráfico de medidas × meses (múltiplas linhas)
- [ ] Criar gráfico de pace × volume (scatter)
- [ ] Criar componente de correlação peso × pace
- [ ] Criar componente de metas pessoais
- [ ] Criar componente de edição de metas
- [ ] Criar componente de progresso de cada meta
- [ ] Criar componente de alertas quando meta próxima de ser atingida
- [ ] Criar componente de configurações de privacidade

## **19.11. Backend - Controllers e Routes (Tarefas 501-600)**

- [x] Criar controller de usuários (server/src/controllers/userController.js)
- [x] Implementar endpoint GET /api/users (lista com filtros e paginação)
- [x] Implementar endpoint GET /api/users/:id (detalhes do usuário)
- [x] Implementar endpoint PUT /api/users/:id (atualizar usuário)
- [x] Implementar endpoint DELETE /api/users/:id (soft delete)
- [x] Implementar endpoint POST /api/users/:id/suspend (suspender usuário)
- [x] Implementar endpoint POST /api/users/:id/activate (reativar usuário)
- [x] Criar controller de onboarding (server/src/controllers/onboardingController.js)
- [x] Implementar endpoint POST /api/onboarding (salvar dados de onboarding)
- [x] Implementar endpoint GET /api/onboarding/:userId (buscar dados de onboarding)
- [x] Implementar endpoint PUT /api/onboarding/:userId (atualizar dados de onboarding)
- [x] Criar controller de planilhas (server/src/controllers/trainingPlanController.js)
- [x] Implementar endpoint GET /api/training-plans (listar planilhas)
- [x] Implementar endpoint GET /api/training-plans/:id (detalhes da planilha)
- [x] Implementar endpoint POST /api/training-plans/generate (gerar planilha automática)
- [x] Implementar algoritmo de geração de planilha (cruzar nível, objetivo, metas, disponibilidade)
- [x] Implementar endpoint PUT /api/training-plans/:id (atualizar planilha)
- [x] Implementar endpoint POST /api/training-plans/:id/review (revisão humana)
- [x] Implementar endpoint POST /api/training-plans/:id/adjust (ajuste inteligente)
- [x] Criar controller de treinos (server/src/controllers/workoutController.js)
- [x] Implementar endpoint GET /api/workouts (listar treinos com filtros)
- [x] Implementar endpoint GET /api/workouts/:id (detalhes do treino)
- [x] Implementar endpoint POST /api/workouts (criar treino)
- [x] Implementar endpoint PUT /api/workouts/:id (atualizar treino)
- [x] Implementar endpoint DELETE /api/workouts/:id (deletar treino)
- [x] Implementar endpoint POST /api/workouts/:id/validate (validar treino)
- [x] Implementar endpoint POST /api/workouts/import-strava (importar do Strava)
- [x] Criar controller de HPoints (server/src/controllers/hpointController.js)
- [x] Implementar endpoint GET /api/hpoints (listar HPoints)
- [x] Implementar endpoint GET /api/hpoints/balance (saldo do usuário)
- [x] Implementar endpoint GET /api/hpoints/history (histórico de pontos)
- [x] Implementar endpoint POST /api/hpoints/adjust (ajuste manual - admin)
- [x] Implementar endpoint GET /api/hpoints/expiring (pontos próximos de expirar)
- [x] Criar controller de resgates (server/src/controllers/redemptionController.js)
- [x] Implementar endpoint GET /api/redemptions (listar resgates)
- [x] Implementar endpoint GET /api/redemptions/:id (detalhes do resgate)
- [x] Implementar endpoint POST /api/redemptions (criar resgate)
- [x] Implementar lógica FIFO (usar pontos mais antigos primeiro)
- [x] Implementar endpoint PUT /api/redemptions/:id/approve (aprovar resgate)
- [x] Implementar endpoint PUT /api/redemptions/:id/deliver (marcar como entregue)
- [x] Criar controller de produtos (server/src/controllers/productController.js)
- [x] Implementar endpoint GET /api/products (listar produtos)
- [x] Implementar endpoint GET /api/products/:id (detalhes do produto)
- [x] Implementar endpoint POST /api/products (criar produto - admin)
- [x] Implementar endpoint PUT /api/products/:id (atualizar produto - admin)
- [x] Implementar endpoint DELETE /api/products/:id (deletar produto - admin)
- [x] Criar controller de eventos (server/src/controllers/eventController.js)
- [x] Implementar endpoint GET /api/events (listar eventos)
- [x] Implementar endpoint GET /api/events/:id (detalhes do evento)
- [x] Implementar endpoint POST /api/events (criar evento - admin)
- [x] Implementar endpoint PUT /api/events/:id (atualizar evento - admin)
- [x] Implementar endpoint DELETE /api/events/:id (deletar evento - admin)
- [x] Implementar endpoint POST /api/events/:id/confirm (confirmar presença)
- [x] Implementar endpoint POST /api/events/:id/validate-batch (validação em lote)
- [x] Criar controller de desafios (server/src/controllers/challengeController.js)
- [x] Implementar endpoint GET /api/challenges (listar desafios)
- [x] Implementar endpoint GET /api/challenges/:id (detalhes do desafio)
- [x] Implementar endpoint POST /api/challenges (criar desafio - admin)
- [x] Implementar endpoint PUT /api/challenges/:id (atualizar desafio - admin)
- [x] Implementar endpoint POST /api/challenges/:id/participate (participar do desafio)
- [x] Implementar endpoint GET /api/challenges/:id/progress (progresso no desafio)
- [x] Criar controller de empresas (server/src/controllers/companyController.js)
- [x] Implementar endpoint GET /api/companies (listar empresas)
- [x] Implementar endpoint GET /api/companies/:id (detalhes da empresa)
- [x] Implementar endpoint POST /api/companies (criar empresa - admin)
- [x] Implementar endpoint PUT /api/companies/:id (atualizar empresa - admin)
- [x] Implementar endpoint GET /api/companies/:id/dashboard (dashboard corporativo)
- [ ] Implementar endpoint GET /api/companies/:id/report (relatório mensal PDF)
- [x] Criar controller de conteúdo (server/src/controllers/contentController.js)
- [x] Implementar endpoint GET /api/content (listar conteúdos)
- [x] Implementar endpoint GET /api/content/:id (detalhes do conteúdo)
- [x] Implementar endpoint POST /api/content (criar conteúdo - admin)
- [x] Implementar endpoint PUT /api/content/:id (atualizar conteúdo - admin)
- [x] Implementar endpoint DELETE /api/content/:id (deletar conteúdo - admin)
- [x] Criar controller de upload (server/src/controllers/uploadController.js)
- [x] Implementar endpoint POST /api/upload/workout (upload foto de treino)
- [x] Implementar endpoint POST /api/upload/event (upload mídia de evento)
- [x] Implementar endpoint POST /api/upload/product (upload imagem de produto)
- [x] Implementar processamento de imagens com Sharp antes do upload
- [x] Criar controller de pedidos (server/src/controllers/orderController.js)
- [x] Implementar endpoint GET /api/orders (listar pedidos)
- [x] Implementar endpoint GET /api/orders/:id (detalhes do pedido)
- [x] Implementar endpoint POST /api/orders (criar pedido)
- [x] Implementar endpoint PUT /api/orders/:id (atualizar pedido)
- [x] Implementar endpoint GET /api/orders/:id/invoice (buscar nota fiscal do Asaas)
- [x] Criar controller de notificações (server/src/controllers/notificationController.js)
- [x] Implementar endpoint GET /api/notifications (listar notificações do usuário)
- [x] Implementar endpoint GET /api/notifications/unread (notificações não lidas)
- [x] Implementar endpoint PUT /api/notifications/:id/read (marcar como lida)
- [x] Implementar endpoint PUT /api/notifications/read-all (marcar todas como lidas)
- [x] Implementar endpoint POST /api/notifications (criar notificação - admin)
- [x] Implementar endpoint POST /api/notifications/schedule (agendar notificação - admin)
- [x] Criar controller de configurações (server/src/controllers/settingController.js)
- [x] Implementar endpoint GET /api/settings (listar configurações)
- [x] Implementar endpoint GET /api/settings/:key (buscar configuração específica)
- [x] Implementar endpoint PUT /api/settings/:key (atualizar configuração - admin)
- [x] Criar controller de ciclos (server/src/controllers/cycleController.js)
- [x] Implementar endpoint GET /api/cycles (listar ciclos)
- [x] Implementar endpoint GET /api/cycles/:id (detalhes do ciclo)
- [x] Implementar endpoint POST /api/cycles (criar ciclo - admin)
- [x] Implementar endpoint PUT /api/cycles/:id (atualizar ciclo - admin)
- [x] Implementar endpoint DELETE /api/cycles/:id (deletar ciclo - admin)
- [x] Criar controller de integrações (server/src/controllers/integrationController.js)
- [x] Implementar endpoint GET /api/integrations/strava/connect (iniciar OAuth Strava)
- [x] Implementar endpoint GET /api/integrations/strava/callback (callback OAuth Strava)
- [x] Implementar endpoint POST /api/integrations/strava/sync (sincronização manual)
- [x] Criar controller de admin (server/src/controllers/adminController.js)
- [x] Implementar endpoint GET /api/admin/dashboard (dados do dashboard admin)
- [x] Implementar endpoint GET /api/admin/stats (estatísticas gerais)
- [x] Implementar endpoint GET /api/admin/validation/queue (fila de validação)
- [x] Implementar endpoint POST /api/admin/validation/:id/approve (aprovar validação)
- [x] Implementar endpoint POST /api/admin/validation/:id/reject (rejeitar validação)
- [x] Criar todas as rotas no Express (server/src/routes/)
- [x] Configurar middleware de autenticação em todas as rotas protegidas
- [x] Configurar middleware de roles em rotas de admin
- [x] Implementar validação de dados em todos os endpoints (Joi/express-validator)
- [x] Implementar tratamento de erros padronizado em todos os controllers
- [x] Documentar todos os endpoints com JSDoc

## **19.12. Backend - Serviços e Integrações (Tarefas 601-650)**

- [x] Criar serviço de integração Asaas (server/src/services/asaasService.js)
- [x] Implementar função para criar cliente no Asaas
- [x] Implementar função para criar cobrança (one-time e recorrente)
- [x] Implementar função para gerar link de pagamento
- [x] Implementar função para buscar status de pagamento
- [x] Implementar função para buscar dados da nota fiscal (quando necessário)
- [x] Criar serviço de integração Strava (server/src/services/stravaService.js)
- [x] Implementar função para iniciar fluxo OAuth
- [x] Implementar função para trocar código por tokens
- [x] Implementar função para buscar atividades do Strava
- [x] Implementar função para filtrar atividades do clube Hack Running
- [x] Implementar função para renovar refresh token automaticamente
- [x] Implementar criptografia de tokens antes de salvar no banco
- [x] Implementar descriptografia de tokens ao usar
- [x] Criar serviço AWS S3 (server/src/services/s3Service.js)
- [x] Implementar função para upload de arquivo
- [x] Implementar função para gerar URL assinada (presigned URL)
- [x] Implementar função para deletar arquivo
- [x] Implementar função para listar arquivos de uma pasta
- [x] Configurar políticas de acesso (CORS, privacidade)
- [x] Criar serviço de processamento de imagens (server/src/services/imageService.js)
- [x] Implementar processamento com Sharp (redimensionar, comprimir, converter WebP)
- [x] Implementar geração de thumbnails (400px)
- [x] Implementar geração de versão medium (800px)
- [x] Implementar geração de versão original (max 1920px)
- [x] Implementar extração de metadados EXIF
- [x] Criar serviço de email (server/src/services/emailService.js)
- [x] Implementar função para enviar email com Resend
- [ ] Implementar função para renderizar templates React Email
- [x] Implementar função para enviar email de confirmação de cadastro
- [x] Implementar função para enviar email de recuperação de senha
- [x] Implementar função para enviar email de treino aprovado/reprovado
- [x] Implementar função para enviar email de HPoints creditados
- [x] Implementar função para enviar email de resgate aprovado
- [x] Implementar função para enviar email de novo desafio
- [x] Implementar função para enviar email de Together/Prova próximos
- [x] Implementar função para enviar email de alerta de expiração de pontos
- [x] Criar serviço Mapbox (server/src/services/mapboxService.js)
- [x] Implementar função para geocoding (endereço para coordenadas)
- [x] Implementar função para reverse geocoding (coordenadas para endereço)
- [ ] Implementar função para buscar direções (opcional)
- [x] Criar serviço de geração de QR Code (server/src/services/qrcodeService.js)
- [x] Implementar função para gerar QR Code como Data URL
- [x] Implementar função para gerar QR Code como PNG
- [ ] Implementar função para salvar QR Code no S3 (opcional)
- [x] Criar serviço de cálculo de HPoints (server/src/services/hpointService.js)
- [x] Implementar função para calcular pontos por tipo de atividade
- [x] Implementar função para creditar pontos
- [x] Implementar função para debitar pontos (resgate)
- [x] Implementar função para verificar expiração
- [x] Implementar função para buscar pontos expirando em 30 dias
- [x] Criar serviço de geração de planilha (server/src/services/trainingPlanService.js)
- [x] Implementar algoritmo de geração automática (preparado para fórmula futura)
- [x] Implementar função para cruzar dados (nível, objetivo, metas, disponibilidade)
- [x] Implementar função para sugerir ciclo ideal (30/45/60/90 dias)
- [x] Implementar função para calcular adesão
- [x] Implementar função para ajuste inteligente (quando faltar 2+ treinos)
- [x] Criar serviço de notificações (server/src/services/notificationService.js)
- [x] Implementar função para criar notificação
- [x] Implementar função para enviar notificação para múltiplos usuários
- [x] Implementar função para filtrar destinatários (por plano, empresa, etc.)
- [x] Implementar função para agendar notificação

## **19.13. Backend - Jobs e Webhooks (Tarefas 651-700)**

- [x] Configurar node-cron no Express app
- [x] Criar job diário para expirar HPoints (executar uma vez por dia)
- [x] Implementar lógica de expiração (6 meses após ganho)
- [x] Criar job diário para alertar sobre pontos próximos de expirar (30 dias)
- [x] Implementar envio de email para pontos próximos de expirar
- [x] Criar job para enviar notificações agendadas (verificar a cada hora)
- [x] Criar job para sincronização automática do Strava (futuro - opcional Fase 1)
- [x] Criar webhook handler para Asaas (server/src/routes/webhooks.js)
- [x] Implementar validação de assinatura do webhook Asaas
- [x] Implementar handler para evento payment.created
- [x] Implementar handler para evento payment.confirmed
- [x] Implementar handler para evento payment.received
- [x] Implementar handler para evento payment.overdue
- [x] Implementar handler para evento payment.refunded
- [x] Implementar atualização de status do pedido após webhook
- [x] Implementar geração de planilha após pagamento confirmado do Kickstart Kit
- [x] Implementar liberação de plano após pagamento confirmado
- [ ] Criar webhook handler para Strava (futuro - opcional Fase 1)
- [ ] Implementar validação de webhook Strava
- [ ] Implementar importação automática de atividades (futuro)
- [ ] Criar sistema de fila para processamento assíncrono (opcional - usar Bull ou similar)
- [x] Implementar retry logic para webhooks que falharem
- [x] Implementar logging de todos os webhooks recebidos
- [x] Criar endpoint de health check (/api/health)
- [x] Implementar monitoramento de jobs (logs, erros)

## **19.14. Frontend - Painel Admin (Tarefas 701-850)**

- [ ] Criar layout do painel admin (app/admin/layout.jsx)
- [ ] Criar componente de sidebar de navegação admin
- [ ] Criar componente de header admin com informações do usuário
- [ ] Criar página de dashboard admin (app/admin/dashboard/page.jsx)
- [ ] Criar componente de card de indicador (membros totais, adesão média, KM total, etc.)
- [ ] Criar componente de gráfico de crescimento de membros
- [ ] Criar componente de gráfico de distribuição de planos
- [ ] Criar componente de gráfico de treinos por tipo
- [ ] Criar componente de gráfico de HPoints por tipo
- [ ] Criar componente de gráfico de adesão média por mês
- [ ] Criar componente de lista de provas próximas
- [ ] Criar componente de top 10 membros (por HPoints, KM, adesão)
- [ ] Criar componente de lista de empresas ativas
- [ ] Criar página de gestão de membros (app/admin/members/page.jsx)
- [ ] Criar componente de tabela de membros com paginação
- [ ] Criar componente de filtros (por plano, status, empresa)
- [ ] Criar componente de busca (nome, email, CPF)
- [ ] Criar página de detalhes do membro (app/admin/members/[id]/page.jsx)
- [ ] Criar componente de visualização completa de dados do membro
- [ ] Criar componente de histórico de pagamentos
- [ ] Criar componente de planilha atual do membro
- [ ] Criar componente de treinos realizados
- [ ] Criar componente de HPoints (saldo e histórico)
- [ ] Criar componente de métricas corporais
- [ ] Criar componente de metas pessoais
- [ ] Criar componente de adesão à planilha
- [ ] Criar componente de participação em desafios
- [ ] Criar página de criar membro (app/admin/members/new/page.jsx)
- [ ] Criar formulário completo de cadastro manual
- [ ] Criar página de gestão de empresas (app/admin/companies/page.jsx)
- [ ] Criar componente de tabela de empresas
- [ ] Criar página de detalhes da empresa (app/admin/companies/[id]/page.jsx)
- [ ] Criar componente de dashboard corporativo
- [ ] Criar componente de ranking interno
- [ ] Criar componente de KM acumulado
- [ ] Criar componente de aderência média
- [ ] Criar componente de distribuição de treinos
- [ ] Criar componente de HPoints acumulados
- [ ] Criar componente de evolução coletiva
- [ ] Criar funcionalidade de download de relatório PDF
- [ ] Criar página de gestão de planilhas (app/admin/training-plans/page.jsx)
- [ ] Criar componente de lista de ciclos disponíveis
- [ ] Criar página de criar/editar ciclo (app/admin/training-plans/cycles/new/page.jsx)
- [ ] Criar formulário de configuração de ciclo
- [ ] Criar página de configuração do algoritmo (app/admin/training-plans/algorithm/page.jsx)
- [ ] Criar formulário de parâmetros de geração automática
- [ ] Criar página de revisão humana (app/admin/training-plans/review/page.jsx)
- [ ] Criar componente de fila de planilhas pendentes
- [ ] Criar componente de revisão de planilha
- [ ] Criar página de gestão de desafios (app/admin/challenges/page.jsx)
- [ ] Criar componente de lista de desafios (ativos e inativos)
- [ ] Criar página de criar/editar desafio (app/admin/challenges/[id]/page.jsx)
- [ ] Criar formulário completo de desafio
- [ ] Criar página de gestão de eventos (app/admin/events/page.jsx)
- [ ] Criar componente de lista de eventos
- [ ] Criar página de criar/editar evento (app/admin/events/[id]/page.jsx)
- [ ] Criar formulário completo de evento
- [ ] Criar componente de mapa integrado no formulário de evento
- [ ] Criar página de validação em lote (app/admin/events/[id]/validate-batch/page.jsx)
- [ ] Criar componente de lista de participantes
- [ ] Criar funcionalidade de validação em massa
- [ ] Criar página de gestão de HPoints (app/admin/hpoints/page.jsx)
- [ ] Criar componente de configuração de regras de pontuação
- [ ] Criar formulário de ajuste manual de pontos
- [ ] Criar componente de histórico de ajustes
- [ ] Criar página de auditoria de HPoints (app/admin/hpoints/audit/page.jsx)
- [ ] Criar componente de tabela de transações
- [ ] Criar funcionalidade de exportar relatório
- [ ] Criar página de validação de atividades (app/admin/validation/page.jsx)
- [ ] Criar componente de fila de validação
- [ ] Criar componente de card de treino pendente
- [ ] Criar página de validação individual (app/admin/validation/[id]/page.jsx)
- [ ] Criar componente de visualização completa do treino
- [ ] Criar componente de visualização de foto completa
- [ ] Criar componente de verificação de compartilhamentos
- [ ] Criar formulário de aprovação/reprovação
- [ ] Criar página de gestão da loja (app/admin/store/page.jsx)
- [ ] Criar componente de lista de produtos
- [ ] Criar página de criar/editar produto (app/admin/store/products/[id]/page.jsx)
- [ ] Criar formulário completo de produto
- [ ] Criar componente de upload de imagem de produto
- [ ] Criar página de gestão de resgates (app/admin/store/redemptions/page.jsx)
- [ ] Criar componente de lista de resgates com filtros
- [ ] Criar componente de aprovação de resgate
- [ ] Criar componente de marcação como entregue
- [ ] Criar componente de visualização de QR Code
- [ ] Criar página de gestão de conteúdos (app/admin/content/page.jsx)
- [ ] Criar componente de lista de aulas e artigos
- [ ] Criar página de criar/editar aula (app/admin/content/classes/[id]/page.jsx)
- [ ] Criar formulário completo de aula
- [ ] Criar componente de upload de vídeo
- [ ] Criar componente de upload de thumbnail
- [ ] Criar página de criar/editar artigo (app/admin/content/articles/[id]/page.jsx)
- [ ] Criar editor de texto rico para artigos
- [ ] Criar componente de upload de imagens no editor
- [ ] Criar página de notificações admin (app/admin/notifications/page.jsx)
- [ ] Criar formulário de criar notificação
- [ ] Criar componente de seleção de destinatários
- [ ] Criar componente de agendamento
- [ ] Criar componente de histórico de notificações
- [ ] Criar página de gestão de planos (app/admin/plans/page.jsx)
- [ ] Criar componente de lista de planos
- [ ] Criar página de criar/editar plano (app/admin/plans/[id]/page.jsx)
- [ ] Criar formulário completo de plano
- [ ] Criar página de gestão de permissões (app/admin/permissions/page.jsx)
- [ ] Criar componente de lista de roles
- [ ] Criar componente de criação de role customizada
- [ ] Criar componente de atribuição de permissões por módulo
- [ ] Criar página de logs e auditoria (app/admin/logs/page.jsx)
- [ ] Criar componente de tabela de logs com filtros
- [ ] Criar componente de visualização de detalhes do log
- [ ] Criar funcionalidade de exportar relatório de logs
- [ ] Implementar queries TanStack Query para todas as páginas admin
- [ ] Implementar mutations TanStack Query para todas as ações admin

## **19.15. Frontend - Notificações e Integrações (Tarefas 851-900)**

- [ ] Criar página de notificações do membro (app/(app)/notifications/page.jsx)
- [ ] Criar componente de lista de notificações
- [ ] Criar componente de card de notificação individual
- [ ] Implementar exibição de notificações não lidas
- [ ] Implementar funcionalidade de marcar como lida
- [ ] Implementar funcionalidade de marcar todas como lidas
- [ ] Criar componente de link para ação relacionada em cada notificação
- [ ] Criar componente de filtros de tipo de notificação
- [ ] Implementar query useNotificationsQuery com TanStack Query
- [ ] Implementar query useUnreadNotificationsQuery com TanStack Query
- [ ] Criar mutation useMarkNotificationRead usando TanStack Query
- [ ] Criar mutation useMarkAllNotificationsRead usando TanStack Query
- [ ] Criar página de integração Strava (app/(app)/profile/integrations/page.jsx)
- [ ] Criar componente de status da conexão Strava
- [ ] Criar botão "Conectar Strava" (inicia OAuth)
- [ ] Criar botão "Sincronizar Treinos" (sincronização manual)
- [ ] Criar componente de histórico de sincronizações
- [ ] Criar componente de última sincronização
- [ ] Criar componente de lista de treinos importados
- [ ] Implementar query useStravaConnectionQuery com TanStack Query
- [ ] Criar mutation useConnectStrava usando TanStack Query
- [ ] Criar mutation useSyncStrava usando TanStack Query
- [ ] Criar componente de loading durante sincronização
- [ ] Criar componente de erro para falhas de sincronização
- [ ] Criar hook useStravaOAuth para gerenciar fluxo OAuth
- [ ] Implementar callback handler para OAuth Strava

## **19.16. Testes (Tarefas 901-1000)**

- [ ] Configurar ambiente de testes no backend (server/tests/setup.js)
- [ ] Configurar ambiente de testes no frontend (client/tests/setup.js)
- [ ] Criar mocks para MongoDB (usar mongodb-memory-server ou similar)
- [ ] Criar mocks para AWS S3
- [ ] Criar mocks para Asaas API
- [ ] Criar mocks para Strava API
- [ ] Criar mocks para Resend API
- [ ] Criar testes unitários para models (User, Workout, TrainingPlan, HPoint, etc.)
- [ ] Criar testes unitários para serviços (asaasService, stravaService, s3Service, etc.)
- [ ] Criar testes unitários para utilitários (validação CPF, CNPJ, formatação, etc.)
- [ ] Criar testes unitários para controllers (authController, userController, etc.)
- [ ] Criar testes unitários para middleware (auth, roles, errorHandler)
- [ ] Criar testes unitários para componentes React (Button, Input, Card, etc.)
- [ ] Criar testes unitários para hooks customizados (useAuth, useUser, etc.)
- [ ] Criar testes unitários para stores Zustand (authStore, etc.)
- [ ] Criar testes unitários para queries TanStack Query
- [ ] Criar testes unitários para mutations TanStack Query
- [ ] Criar testes de integração para endpoints de autenticação
- [ ] Criar testes de integração para endpoints de usuários
- [ ] Criar testes de integração para endpoints de treinos
- [ ] Criar testes de integração para endpoints de HPoints
- [ ] Criar testes de integração para endpoints de resgates
- [ ] Criar testes de integração para endpoints de eventos
- [ ] Criar testes de integração para endpoints de desafios
- [ ] Criar testes de integração para endpoints de admin
- [ ] Criar testes de integração para webhooks (Asaas, Strava)
- [ ] Criar testes de integração para jobs (expiração HPoints, notificações)
- [ ] Criar testes E2E para fluxo de cadastro e onboarding
- [ ] Criar testes E2E para fluxo de compra do Kickstart Kit
- [ ] Criar testes E2E para fluxo de registro e validação de treino
- [ ] Criar testes E2E para fluxo de resgate de HPoints
- [ ] Criar testes E2E para fluxo de conexão Strava
- [ ] Criar testes de performance para APIs (tempo de resposta < 500ms)
- [ ] Criar testes de performance para páginas (tempo de carregamento < 3s)
- [ ] Configurar cobertura de código mínima (70% backend, 60% frontend)
- [ ] Configurar CI/CD para rodar testes automaticamente (futuro)
- [ ] Documentar como rodar testes localmente

## **19.17. LGPD e Compliance (Tarefas 1001-1050)**

- [ ] Criar documento de Política de Privacidade completo
- [ ] Criar documento de Termos de Uso completo
- [ ] Criar página de Política de Privacidade (app/privacy/page.jsx)
- [ ] Criar página de Termos de Uso (app/terms/page.jsx)
- [ ] Criar componente de consentimento no cadastro
- [ ] Implementar armazenamento de data/hora do consentimento no banco
- [ ] Criar campo de consentimento no model User
- [ ] Implementar funcionalidade de revogação de consentimento
- [ ] Criar página de configurações de privacidade (app/(app)/profile/privacy/page.jsx)
- [ ] Criar componente de gerenciamento de consentimentos
- [ ] Implementar criptografia de CPF no banco (usar biblioteca de criptografia)
- [ ] Criar função helper para criptografar CPF antes de salvar
- [ ] Criar função helper para descriptografar CPF ao exibir
- [ ] Implementar criptografia de tokens Strava (já mencionado, garantir implementação)
- [ ] Criar funcionalidade de acesso aos dados pessoais (app/(app)/profile/data-access/page.jsx)
- [ ] Criar endpoint GET /api/users/:id/data-export (exportar dados em JSON)
- [ ] Criar funcionalidade de correção de dados (já existe edição, garantir LGPD compliance)
- [ ] Criar funcionalidade de exclusão de dados (app/(app)/profile/delete-account/page.jsx)
- [ ] Criar endpoint DELETE /api/users/:id/delete-account (exclusão completa)
- [ ] Implementar soft delete com período de retenção (30 dias antes de exclusão definitiva)
- [ ] Criar funcionalidade de portabilidade de dados (exportar em formato estruturado)
- [ ] Criar endpoint GET /api/users/:id/data-portability
- [ ] Criar sistema de auditoria para acesso a dados pessoais
- [ ] Registrar no AuditLog todos os acessos a dados sensíveis
- [ ] Criar relatório de atividades de dados pessoais (app/(app)/profile/data-activity/page.jsx)
- [ ] Implementar notificação por email quando dados pessoais forem acessados
- [ ] Garantir que senhas sejam sempre hasheadas (nunca armazenadas em texto plano)
- [ ] Garantir que dados de pagamento não sejam armazenados (usar apenas IDs do Asaas)
- [ ] Criar documentação de práticas de segurança e privacidade
- [ ] Revisar todos os endpoints para garantir que não exponham dados sensíveis
- [ ] Implementar rate limiting em endpoints sensíveis (já existe, revisar)
- [ ] Criar política de retenção de dados
- [ ] Implementar limpeza automática de dados antigos (conforme política)
- [ ] Criar página de informações sobre LGPD (app/lgpd/page.jsx)
- [ ] Criar formulário de contato do DPO (Data Protection Officer)
- [ ] Garantir que todos os emails transacionais incluam link para política de privacidade
- [ ] Criar banner de cookies (se necessário no futuro)
- [ ] Documentar todos os dados coletados e finalidades no documento de privacidade

---

**FIM DO DOCUMENTO**

Este documento serve como especificação completa para o desenvolvimento da Fase 1 do aplicativo Hack Running!. Qualquer dúvida ou necessidade de ajuste deve ser documentada e atualizada neste arquivo.

