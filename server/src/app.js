import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

// Importar configurações
import './config/database.js';
import { generalLimiter, speedLimiter } from './config/rateLimiter.js';

// Importar middlewares
import { passport } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Importar rotas
import routes from './routes/index.js';

// Importar jobs
import { initializeJobs } from './jobs/index.js';

// Importar logger
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ========== MIDDLEWARES DE SEGURANÇA ==========

// Helmet - Headers HTTP de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "*.amazonaws.com", "*.mapbox.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      connectSrc: ["'self'", "*.asaas.com", "*.strava.com", "*.mapbox.com", "*.amazonaws.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5173',
      'https://app.hackrunning.com.br',
      'https://www.app.hackrunning.com.br',
      'https://www.hackrunning.com.br'
    ];
    
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Rate Limiting (exceto para webhooks)
app.use('/api', (req, res, next) => {
  // Não aplicar rate limit em webhooks
  if (req.path.startsWith('/webhooks')) {
    return next();
  }
  generalLimiter(req, res, next);
});

// Slow Down para requests repetidos
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/webhooks')) {
    return next();
  }
  speedLimiter(req, res, next);
});

// Compressão de resposta
app.use(compression());

// ========== BODY PARSERS ==========

// JSON parser
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// URL encoded parser
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// ========== PASSPORT ==========

app.use(passport.initialize());

// ========== LOGGING ==========

// Log de requisições (apenas em desenvolvimento)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
}

// ========== HEALTH CHECK ==========

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Readiness check (para kubernetes/docker)
app.get('/ready', async (req, res) => {
  try {
    // Verificar conexão com banco
    const mongoose = (await import('mongoose')).default;
    const dbState = mongoose.connection.readyState;
    
    if (dbState === 1) {
      res.json({ 
        status: 'ready', 
        database: 'connected',
        timestamp: new Date().toISOString() 
      });
    } else {
      res.status(503).json({ 
        status: 'not_ready', 
        database: 'disconnected' 
      });
    }
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

// ========== ROTAS DA API ==========

app.use('/api', routes);

// ========== ERROR HANDLERS ==========

// Handler de erros centralizado
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// ========== INICIALIZAÇÃO ==========

const startServer = async () => {
  try {
    // Aguardar conexão com banco de dados
    const mongoose = (await import('mongoose')).default;
    
    // Verificar se já está conectado
    if (mongoose.connection.readyState !== 1) {
      logger.info('Aguardando conexão com MongoDB...');
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
        // Timeout de 30 segundos
        setTimeout(() => resolve(), 30000);
      });
    }

    // Inicializar jobs agendados (apenas em produção ou se explicitamente habilitado)
    if (NODE_ENV === 'production' || process.env.ENABLE_JOBS === 'true') {
      initializeJobs();
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando na porta ${PORT}`);
      logger.info(`📦 Ambiente: ${NODE_ENV}`);
      logger.info(`🔗 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido. Fechando servidor...');
  const mongoose = (await import('mongoose')).default;
  await mongoose.connection.close();
  process.exit(0);
});

// Iniciar servidor
startServer();

export default app;
