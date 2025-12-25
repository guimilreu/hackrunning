import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'hack-running-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Configuração do Passport
 */

// Estratégia Local (login com email/senha)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password'
  },
  async (email, password, done) => {
    try {
      // Incluir password no select pois ele tem select: false por padrão
      const emailLower = email.toLowerCase();
      
      const user = await User.findOne({ email: emailLower }).select('+password');
      
      if (!user) {
        return done(null, false, { message: 'Email ou senha inválidos' });
      }

      if (!user.active) {
        return done(null, false, { message: 'Conta desativada' });
      }

      if (!user.password) {
        return done(null, false, { message: 'Email ou senha inválidos' });
      }

      const isValid = await user.comparePassword(password);
      
      if (!isValid) {
        return done(null, false, { message: 'Email ou senha inválidos' });
      }

      // Atualizar último acesso
      user.lastAccess = new Date();
      await user.save();

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Estratégia JWT
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.sub);
    
    if (!user) {
      return done(null, false);
    }

    if (!user.active) {
      return done(null, false, { message: 'Conta desativada' });
    }

    // Token válido se usuário existe e está ativo

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
}));

// Serialização (para sessions, se necessário)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

/**
 * Gera token JWT
 */
export const generateToken = (user) => {
  const payload = {
    sub: user._id,
    email: user.email,
    role: user.role,
    plan: user.plan?.type || 'free'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Gera refresh token
 */
export const generateRefreshToken = (user) => {
  const payload = {
    sub: user._id,
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Verifica e decodifica token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Gera token de reset de senha
 */
export const generatePasswordResetToken = (user) => {
  const payload = {
    sub: user._id,
    type: 'password_reset'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

/**
 * Middleware de autenticação JWT
 */
export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro de autenticação' 
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: info?.message || 'Não autorizado. Token inválido ou expirado' 
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware de autenticação opcional (não falha se não tiver token)
 */
export const authenticateOptional = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
};

/**
 * Middleware de autorização por role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Permissão insuficiente',
        userRole: req.user.role,
        requiredRoles: roles
      });
    }

    next();
  };
};

/**
 * Middleware para verificar se é admin
 */
export const requireAdmin = (req, res, next) => {
  return authorize('operational_admin', 'content_admin', 'company_admin', 'media_moderator', 'super_admin')(req, res, next);
};

/**
 * Middleware para verificar se é super admin
 */
export const requireSuperAdmin = authorize('super_admin');

/**
 * Middleware para verificar se é dono do recurso ou admin
 */
export const requireOwnerOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    const isOwner = req.user._id.toString() === resourceUserId;
    const isAdmin = ['operational_admin', 'content_admin', 'company_admin', 'media_moderator', 'super_admin'].includes(req.user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado' 
      });
    }

    next();
  };
};

/**
 * Middleware para verificar plano do usuário
 */
export const requirePlan = (...plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }

    // Admins têm acesso total
    if (['operational_admin', 'content_admin', 'company_admin', 'media_moderator', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    if (!plans.includes(req.user.plan.type)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Recurso disponível apenas para planos: ' + plans.join(', ') 
      });
    }

    // Verificar se o plano está ativo
    if (req.user.plan.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Seu plano não está ativo' 
      });
    }

    next();
  };
};

/**
 * Middleware para verificar onboarding completo
 */
export const requireOnboarding = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Não autorizado' 
    });
  }

  // Verificar se onboarding existe e está completo
  if (!req.user.onboarding || !req.user.onboarding.completed) {
    return res.status(403).json({ 
      success: false, 
      message: 'Complete o onboarding primeiro',
      redirectTo: '/onboarding/step1'
    });
  }

  next();
};

/**
 * Login com estratégia local
 */
export const loginLocal = (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Erro na autenticação local:', err);
      console.error('Stack:', err.stack);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro no servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: info?.message || 'Email ou senha inválidos' 
      });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Refresh token
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Refresh token não fornecido' 
      });
    }

    const decoded = verifyToken(refreshToken);
    
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ 
        success: false, 
        message: 'Refresh token inválido' 
      });
    }

    const user = await User.findById(decoded.sub);
    
    if (!user || !user.active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário não encontrado ou inativo' 
      });
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao renovar token' 
    });
  }
};

// Exportar passport configurado
export { passport };

export default {
  passport,
  authenticate,
  authenticateOptional,
  authorize,
  requireAdmin,
  requireSuperAdmin,
  requireOwnerOrAdmin,
  requirePlan,
  requireOnboarding,
  loginLocal,
  refreshToken,
  generateToken,
  generateRefreshToken,
  generatePasswordResetToken,
  verifyToken
};
