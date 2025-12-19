# Hack Running! - Frontend

Aplicativo web mobile-first (PWA) desenvolvido com Next.js 16 e React 19.2.

## 🚀 Tecnologias

- **Next.js 16** - Framework React
- **React 19.2** - Biblioteca UI
- **Tailwind CSS v4** - Estilização
- **TanStack Query** - Gerenciamento de estado de servidor
- **Zustand** - Gerenciamento de estado local
- **React Hook Form + Zod** - Formulários e validação
- **Recharts** - Gráficos
- **Mapbox GL** - Mapas interativos

## 📦 Instalação

```bash
npm install
```

## 🏃 Executar em Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🧪 Testes

```bash
# Testes unitários/integração
npm test

# Testes com UI
npm run test:ui

# Cobertura
npm run test:coverage
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa ESLint
- `npm test` - Executa testes com Vitest
- `npm run test:coverage` - Gera relatório de cobertura

## 🔧 Configuração

Copie `.env.example` para `.env` e configure as variáveis de ambiente:

```bash
cp .env.example .env
```

## 📁 Estrutura de Pastas

```
client/
├── app/              # Next.js App Router
├── components/       # Componentes React
├── hooks/           # Custom hooks
├── queries/         # TanStack Query queries
├── mutations/       # TanStack Query mutations
├── lib/             # Utilitários e helpers
├── store/           # Zustand stores
└── public/          # Arquivos estáticos
```

