// Definição de roles e permissões
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONAL_ADMIN: 'operational_admin',
  CONTENT_ADMIN: 'content_admin',
  COMPANY_ADMIN: 'company_admin',
  MEDIA_MODERATOR: 'media_moderator',
  COACH: 'coach',
  MEMBER: 'member'
};

// Permissões por módulo
const PERMISSIONS = {
  // Dashboard
  'dashboard.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'dashboard.company.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.COMPANY_ADMIN],
  
  // Membros
  'members.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'members.create': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'members.edit': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'members.delete': [ROLES.SUPER_ADMIN],
  'members.suspend': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  
  // Empresas
  'companies.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.COMPANY_ADMIN],
  'companies.create': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'companies.edit': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'companies.delete': [ROLES.SUPER_ADMIN],
  'companies.dashboard': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.COMPANY_ADMIN],
  
  // Validação de treinos
  'validation.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.MEDIA_MODERATOR],
  'validation.approve': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.MEDIA_MODERATOR],
  'validation.reject': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.MEDIA_MODERATOR],
  
  // HPoints
  'hpoints.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.MEDIA_MODERATOR],
  'hpoints.adjust': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.MEDIA_MODERATOR],
  'hpoints.config': [ROLES.SUPER_ADMIN],
  
  // Eventos
  'events.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'events.create': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'events.edit': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'events.delete': [ROLES.SUPER_ADMIN],
  
  // Conteúdos
  'content.view': [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  'content.create': [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  'content.edit': [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  'content.delete': [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  
  // Desafios
  'challenges.view': [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  'challenges.create': [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  'challenges.edit': [ROLES.SUPER_ADMIN, ROLES.CONTENT_ADMIN],
  'challenges.delete': [ROLES.SUPER_ADMIN],
  
  // Planilhas
  'training-plans.view': [ROLES.SUPER_ADMIN, ROLES.COACH],
  'training-plans.review': [ROLES.SUPER_ADMIN, ROLES.COACH],
  'training-plans.config': [ROLES.SUPER_ADMIN],
  
  // Notificações
  'notifications.send': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN, ROLES.CONTENT_ADMIN],
  
  // Logs/Auditoria
  'logs.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  
  // Configurações
  'settings.view': [ROLES.SUPER_ADMIN],
  'settings.edit': [ROLES.SUPER_ADMIN],
  
  // Permissões
  'permissions.view': [ROLES.SUPER_ADMIN],
  'permissions.edit': [ROLES.SUPER_ADMIN],
  
  // Produtos/Loja
  'products.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'products.create': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'products.edit': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'products.delete': [ROLES.SUPER_ADMIN],
  
  // Resgates
  'redemptions.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'redemptions.approve': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'redemptions.deliver': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  
  // Ciclos
  'cycles.view': [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN],
  'cycles.create': [ROLES.SUPER_ADMIN],
  'cycles.edit': [ROLES.SUPER_ADMIN],
  'cycles.delete': [ROLES.SUPER_ADMIN]
};

/**
 * Middleware para verificar se usuário tem role específica
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }
    
    next();
  };
};

/**
 * Middleware para verificar se usuário tem permissão específica
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const allowedRoles = PERMISSIONS[permission];
    
    if (!allowedRoles || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão negada' });
    }
    
    next();
  };
};

/**
 * Middleware para verificar se é admin (qualquer tipo)
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  
  const adminRoles = [
    ROLES.SUPER_ADMIN,
    ROLES.OPERATIONAL_ADMIN,
    ROLES.CONTENT_ADMIN,
    ROLES.COMPANY_ADMIN,
    ROLES.MEDIA_MODERATOR,
    ROLES.COACH
  ];
  
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  
  next();
};

/**
 * Middleware para verificar se é super admin
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    return res.status(403).json({ error: 'Acesso restrito a super administradores' });
  }
  
  next();
};

/**
 * Helper para verificar se usuário tem permissão (para uso em controllers)
 */
export const hasPermission = (userRole, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
};

/**
 * Helper para verificar se é dono do recurso ou admin
 */
export const isOwnerOrAdmin = (req, resourceUserId) => {
  if (!req.user) return false;
  
  const adminRoles = [ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN];
  
  if (adminRoles.includes(req.user.role)) return true;
  
  return req.user._id.toString() === resourceUserId.toString();
};

/**
 * Middleware para verificar se é dono do recurso ou admin
 */
export const requireOwnerOrAdmin = (getUserIdFromReq) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    const resourceUserId = getUserIdFromReq(req);
    
    if (!isOwnerOrAdmin(req, resourceUserId)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    next();
  };
};

/**
 * Middleware para verificar se company_admin pode acessar empresa
 */
export const requireCompanyAccess = (getCompanyIdFromReq) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    // Super admin e operational admin podem acessar qualquer empresa
    if ([ROLES.SUPER_ADMIN, ROLES.OPERATIONAL_ADMIN].includes(req.user.role)) {
      return next();
    }
    
    // Company admin só pode acessar própria empresa
    if (req.user.role === ROLES.COMPANY_ADMIN) {
      const requestedCompanyId = getCompanyIdFromReq(req);
      
      if (req.user.companyId?.toString() !== requestedCompanyId?.toString()) {
        return res.status(403).json({ error: 'Acesso negado a esta empresa' });
      }
    }
    
    next();
  };
};

export { ROLES, PERMISSIONS };
