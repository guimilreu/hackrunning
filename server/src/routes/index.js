import { Router } from 'express';

// Importar todas as rotas
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import onboardingRoutes from './onboarding.routes.js';
import workoutRoutes from './workout.routes.js';
import trainingPlanRoutes from './trainingPlan.routes.js';
import cycleRoutes from './cycle.routes.js';
import hpointRoutes from './hpoint.routes.js';
import productRoutes from './product.routes.js';
import redemptionRoutes from './redemption.routes.js';
import eventRoutes from './event.routes.js';
import challengeRoutes from './challenge.routes.js';
import companyRoutes from './company.routes.js';
import orderRoutes from './order.routes.js';
import contentRoutes from './content.routes.js';
import notificationRoutes from './notification.routes.js';
import settingRoutes from './setting.routes.js';
import uploadRoutes from './upload.routes.js';
import integrationRoutes from './integration.routes.js';
import webhookRoutes from './webhook.routes.js';
import adminRoutes from './admin.routes.js';
import subscriptionRoutes from './subscription.routes.js';

const router = Router();

// Montar rotas
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/workouts', workoutRoutes);
router.use('/training-plans', trainingPlanRoutes);
router.use('/cycles', cycleRoutes);
router.use('/hpoints', hpointRoutes);
router.use('/products', productRoutes);
router.use('/redemptions', redemptionRoutes);
router.use('/events', eventRoutes);
router.use('/challenges', challengeRoutes);
router.use('/companies', companyRoutes);
router.use('/orders', orderRoutes);
router.use('/content', contentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingRoutes);
router.use('/upload', uploadRoutes);
router.use('/integrations', integrationRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/admin', adminRoutes);
router.use('/subscriptions', subscriptionRoutes);

export default router;
