import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Rate limiter geral
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true
});

// Rate limiter para registro
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: { error: 'Muitas tentativas de registro. Tente novamente em 1 hora.' }
});

// Rate limiter para upload
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: { error: 'Muitos uploads. Tente novamente em 1 minuto.' }
});

// Slow down (delay progressivo)
export const speedLimiter = slowDown({
  windowMs: 60 * 1000, // 1 minuto
  delayAfter: 50, // Após 50 requisições
  delayMs: (hits) => hits * 100 // Delay: 100ms, 200ms, 300ms...
});

