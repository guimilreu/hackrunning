import { Subscription, User } from '../models/index.js';
import { PLANS } from '../models/Subscription.js';

/**
 * Middleware para verificar se usuário tem plano específico
 * @param {string[]} allowedPlans - Planos permitidos ('free', 'plus', 'pro')
 */
export const requirePlan = (allowedPlans) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const user = await User.findById(userId);
      const userPlan = user?.plan?.type || 'free';

      if (!allowedPlans.includes(userPlan)) {
        return res.status(403).json({
          success: false,
          message: 'Seu plano não permite acesso a este recurso',
          requiredPlans: allowedPlans,
          currentPlan: userPlan,
          upgradeUrl: '/subscriptions/plans'
        });
      }

      // Adicionar info do plano ao request
      req.userPlan = {
        type: userPlan,
        config: PLANS[userPlan] || PLANS.free
      };

      next();
    } catch (error) {
      console.error('Erro ao verificar plano:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar plano'
      });
    }
  };
};

/**
 * Middleware para verificar se usuário tem feature específica
 * @param {string} featureName - Nome da feature a verificar
 */
export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const subscription = await Subscription.findOne({ user: userId });
      const planConfig = subscription ? subscription.getPlanConfig() : PLANS.free;

      const hasFeature = planConfig.limitations[featureName] === true ||
        (typeof planConfig.limitations[featureName] === 'number' && 
         planConfig.limitations[featureName] > 0);

      if (!hasFeature) {
        return res.status(403).json({
          success: false,
          message: `Seu plano não inclui ${featureName}`,
          currentPlan: subscription?.plan || 'free',
          upgradeUrl: '/subscriptions/plans'
        });
      }

      req.userPlan = {
        type: subscription?.plan || 'free',
        config: planConfig
      };

      next();
    } catch (error) {
      console.error('Erro ao verificar feature:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissões'
      });
    }
  };
};

/**
 * Middleware para planos pagos (plus ou pro)
 */
export const requirePaidPlan = requirePlan(['plus', 'pro']);

/**
 * Middleware para plano Pro apenas
 */
export const requireProPlan = requirePlan(['pro']);

/**
 * Middleware para adicionar info do plano ao request (não bloqueia)
 */
export const loadPlanInfo = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    
    if (userId) {
      const subscription = await Subscription.findOne({ user: userId });
      const planConfig = subscription ? subscription.getPlanConfig() : PLANS.free;
      
      req.userPlan = {
        type: subscription?.plan || 'free',
        status: subscription?.status || 'active',
        config: planConfig,
        subscription
      };
    }
    
    next();
  } catch (error) {
    // Não bloqueia, apenas loga
    console.error('Erro ao carregar info do plano:', error);
    next();
  }
};

export default {
  requirePlan,
  requireFeature,
  requirePaidPlan,
  requireProPlan,
  loadPlanInfo
};
