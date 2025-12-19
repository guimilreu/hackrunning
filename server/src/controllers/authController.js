import { User, AuditLog, Subscription } from '../models/index.js';
import { 
  generateToken, 
  generateRefreshToken, 
  generatePasswordResetToken,
  verifyToken 
} from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import { validateCPF } from '../utils/validators.js';
import crypto from 'crypto';

/**
 * Registro de novo usuário
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, phone, cpf } = req.body;

    // Verificar se email já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este email já está cadastrado'
      });
    }

    // Verificar e validar CPF
    if (cpf) {
      // Validar formato do CPF
      if (!validateCPF(cpf)) {
        return res.status(400).json({
          success: false,
          message: 'CPF inválido. Verifique os dígitos digitados.'
        });
      }

      // Verificar se CPF já existe
      const existingCpf = await User.findOne({ cpf: cpf.replace(/\D/g, '') });
      if (existingCpf) {
        return res.status(400).json({
          success: false,
          message: 'Este CPF já está cadastrado'
        });
      }
    }

    // Criar usuário
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      phone,
      cpf: cpf ? cpf.replace(/\D/g, '') : undefined,
      role: 'member',
      plan: { type: 'free', status: 'active' },
      onboarding: {
        completed: false,
        currentStep: 1,
        completedSteps: []
      }
    });

    await user.save();

    // Gerar tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Enviar email de boas-vindas
    await emailService.sendWelcomeEmail(user);

    // Log de auditoria
    await AuditLog.logAuth('register', user._id, { email: user.email }, req);

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso',
      data: {
        user: user.toSafeObject(),
        token,
        refreshToken,
        onboardingComplete: user.onboarding?.completed || false
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar conta'
    });
  }
};

/**
 * Login
 */
export const login = async (req, res) => {
  try {
    const user = req.user; // Preenchido pelo middleware loginLocal

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log de auditoria (não bloquear se falhar)
    try {
      await AuditLog.logAuth('login', user._id, { email: user.email }, req);
    } catch (auditError) {
      console.error('Erro ao registrar log de auditoria:', auditError);
      // Não bloquear o login por erro de auditoria
    }

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: user.toSafeObject(),
        token,
        refreshToken,
        onboardingComplete: user.onboarding?.completed || false
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout (invalidar token no cliente)
 */
export const logout = async (req, res) => {
  try {
    // Log de auditoria
    await AuditLog.logAuth('logout', req.user._id, {}, req);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer logout'
    });
  }
};

/**
 * Obter usuário atual
 */
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('currentTrainingPlan', 'objective level startDate endDate adherence');

    // Buscar assinatura para obter o plano real (fonte de verdade)
    const subscription = await Subscription.findOne({ user: req.user._id });
    
    // Se existe assinatura, garantir que o User.plan está sincronizado
    if (subscription) {
      const subscriptionPlan = subscription.plan || 'free';
      const subscriptionStatus = subscription.status || 'active';
      
      // Sincronizar User.plan com Subscription se necessário
      if (!user.plan || user.plan.type !== subscriptionPlan) {
        user.plan = {
          type: subscriptionPlan,
          status: subscriptionStatus === 'active' ? 'active' : 'inactive',
          startDate: user.plan?.startDate || subscription.startDate || new Date(),
          endDate: user.plan?.endDate || subscription.endDate,
          nextBillingDate: user.plan?.nextBillingDate || subscription.nextBillingDate,
          asaasSubscriptionId: user.plan?.asaasSubscriptionId || subscription.asaasSubscriptionId,
          autoRenew: user.plan?.autoRenew !== undefined ? user.plan.autoRenew : true,
          cancelledAt: user.plan?.cancelledAt || subscription.cancelledAt,
          cancelReason: user.plan?.cancelReason || subscription.cancelReason
        };
        await user.save();
      }
    } else {
      // Se não existe assinatura, garantir que o plano é 'free'
      if (!user.plan || !user.plan.type) {
        user.plan = {
          type: 'free',
          status: 'active'
        };
        await user.save();
      }
    }

    const userObject = user.toSafeObject();

    res.json({
      success: true,
      data: {
        user: userObject,
        onboardingComplete: user.onboarding?.completed || false,
        hpointsBalance: user.hpoints?.balance || 0
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter dados do usuário'
    });
  }
};

/**
 * Solicitar reset de senha
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Não revelar se o email existe ou não
    if (!user) {
      return res.json({
        success: true,
        message: 'Se este email estiver cadastrado, você receberá instruções para redefinir sua senha'
      });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Salvar token no usuário
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await user.save();

    // Gerar URL de reset
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Enviar email
    await emailService.sendPasswordResetEmail(user, resetToken);

    // Log de auditoria
    await AuditLog.logAuth('password_reset_request', user._id, { email: user.email }, req);

    res.json({
      success: true,
      message: 'Se este email estiver cadastrado, você receberá instruções para redefinir sua senha'
    });
  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar solicitação'
    });
  }
};

/**
 * Redefinir senha
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash do token recebido
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuário com token válido
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Atualizar senha
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log de auditoria
    await AuditLog.logAuth('password_reset', user._id, {}, req);

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso. Faça login com sua nova senha'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao redefinir senha'
    });
  }
};

/**
 * Alterar senha (usuário logado)
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Verificar senha atual
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    // Gerar novo token
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Log de auditoria
    await AuditLog.logAuth('password_change', user._id, {}, req);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
      data: { token, refreshToken }
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar senha'
    });
  }
};

/**
 * Refresh token
 */
export const refresh = async (req, res) => {
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
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao renovar token'
    });
  }
};

export default {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
  refresh
};
