# Hack Running! - Backend API

API REST desenvolvida com Node.js, Express.js e MongoDB.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB + Mongoose** - Banco de dados
- **JWT + Passport.js** - Autenticação
- **Winston** - Logging
- **Helmet.js** - Segurança HTTP
- **express-rate-limit** - Rate limiting
- **Sharp** - Processamento de imagens
- **Resend** - Envio de emails
- **AWS SDK** - Integração S3

## 📦 Instalação

```bash
npm install
```

## 🏃 Executar em Desenvolvimento

```bash
npm run dev
```

A API estará disponível em [http://localhost:4000](http://localhost:4000)

## 🧪 Testes

```bash
# Testes unitários/integração
npm test

# Cobertura
npm run test:coverage
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor com nodemon (hot reload)
- `npm start` - Inicia servidor de produção
- `npm test` - Executa testes com Vitest
- `npm run test:coverage` - Gera relatório de cobertura

## 🔧 Configuração

Copie `.env.example` para `.env` e configure as variáveis de ambiente:

```bash
cp .env.example .env
```

### Variáveis Necessárias

- `MONGODB_URI` - URI de conexão do MongoDB
- `JWT_SECRET` - Secret para assinatura de tokens JWT
- `AWS_ACCESS_KEY_ID` - Chave de acesso AWS
- `AWS_SECRET_ACCESS_KEY` - Secret AWS
- `ASAAS_API_KEY` - Chave da API Asaas
- `RESEND_API_KEY` - Chave da API Resend
- E outras conforme necessário

## 📁 Estrutura de Pastas

```
server/
├── src/
│   ├── config/      # Configurações (DB, APIs externas)
│   ├── models/      # Modelos Mongoose
│   ├── controllers/ # Lógica de negócio
│   ├── routes/      # Rotas da API
│   ├── middleware/  # Middlewares (auth, validation, etc)
│   ├── services/    # Serviços (S3, email, etc)
│   ├── utils/       # Utilitários
│   ├── jobs/        # Tarefas agendadas (cron)
│   └── emails/      # Templates React Email
├── tests/           # Testes
└── logs/            # Logs do Winston
```

## 🔒 Segurança

- Helmet.js configurado com CSP
- Rate limiting em endpoints sensíveis
- Validação de dados com Joi
- Autenticação JWT
- CORS configurado

## 📊 Logging

Logs são salvos em:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros

