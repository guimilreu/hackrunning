import Joi from 'joi';

/**
 * Middleware genérico de validação usando Joi
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Dados inválidos',
        details: errors
      });
    }

    req[property] = value;
    next();
  };
};

// ==================== SCHEMAS DE VALIDAÇÃO ====================

// Auth
export const authSchemas = {
  register: Joi.object({
    name: Joi.string().required().min(3).max(100).messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter no mínimo 3 caracteres'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email inválido',
      'string.empty': 'Email é obrigatório'
    }),
    phone: Joi.string().required().pattern(/^\(\d{2}\)\s?\d{4,5}-\d{4}$|^\d{10,11}$/).messages({
      'string.empty': 'Telefone é obrigatório',
      'string.pattern.base': 'Telefone inválido'
    }),
    cpf: Joi.string().required().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/).messages({
      'string.empty': 'CPF é obrigatório',
      'string.pattern.base': 'CPF inválido'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Senha deve ter no mínimo 6 caracteres',
      'string.empty': 'Senha é obrigatória'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email inválido',
      'string.empty': 'Email é obrigatório'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Senha é obrigatória'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email inválido',
      'string.empty': 'Email é obrigatório'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Senha deve ter no mínimo 8 caracteres'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Senhas não conferem'
    })
  })
};

// Onboarding
export const onboardingSchemas = {
  create: Joi.object({
    runningTime: Joi.string().allow(''),
    monthlyKm: Joi.number().min(0).default(0),
    hasWatch: Joi.boolean().default(false),
    usesStrava: Joi.boolean().default(false),
    stravaLink: Joi.string().allow('').uri(),
    objectives: Joi.array().items(
      Joi.string().valid('health', 'weight_loss', 'performance', 'race_preparation', 'discipline')
    ),
    goals: Joi.object({
      currentWeight: Joi.number().min(0),
      targetWeight: Joi.number().min(0),
      current5KTime: Joi.number().min(0),
      target5KTime: Joi.number().min(0),
      currentPace: Joi.number().min(0),
      targetPace: Joi.number().min(0),
      weeklyFrequency: Joi.number().min(1).max(7),
      desiredMonthlyKm: Joi.number().min(0)
    })
  }),
  personal: Joi.object({
    name: Joi.string().min(3).max(100),
    phone: Joi.string().pattern(/^\(\d{2}\)\s?\d{4,5}-\d{4}$|^\d{10,11}$/),
    cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/),
    birthDate: Joi.date().max('now'),
    gender: Joi.string().valid('M', 'F', 'Other')
  }),
  address: Joi.object({
    street: Joi.string().allow(''),
    number: Joi.string().allow(''),
    complement: Joi.string().allow(''),
    neighborhood: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    zipCode: Joi.string().allow('')
  }),
  runningGoal: Joi.object({
    runningTime: Joi.string().allow(''),
    monthlyKm: Joi.number().min(0),
    objectives: Joi.array().items(
      Joi.string().valid('health', 'weight_loss', 'performance', 'race_preparation', 'discipline')
    ),
    goals: Joi.object({
      currentWeight: Joi.number().min(0),
      targetWeight: Joi.number().min(0),
      current5KTime: Joi.number().min(0),
      target5KTime: Joi.number().min(0),
      currentPace: Joi.number().min(0),
      targetPace: Joi.number().min(0),
      weeklyFrequency: Joi.number().min(1).max(7),
      desiredMonthlyKm: Joi.number().min(0)
    })
  }),
  shirtSize: Joi.object({
    shirtSize: Joi.string().valid('PP', 'P', 'M', 'G', 'GG', 'XG').required()
  })
};

// Workouts
export const workoutSchemas = {
  create: Joi.object({
    type: Joi.string().valid('individual', 'together', 'race').required(),
    date: Joi.date().required(),
    distance: Joi.number().min(0.1).required().messages({
      'number.min': 'Distância deve ser maior que 0'
    }),
    time: Joi.number().min(1).required().messages({
      'number.min': 'Tempo deve ser maior que 0'
    }),
    workoutType: Joi.string().valid('base', 'pace', 'interval', 'long_run', 'recovery', 'strength'),
    photo: Joi.object({
      url: Joi.string().uri(),
      s3Key: Joi.string()
    }),
    shares: Joi.object({
      strava: Joi.boolean(),
      instagram: Joi.boolean(),
      whatsapp: Joi.boolean()
    }),
    eventId: Joi.string().hex().length(24),
    notes: Joi.string().allow('').max(500)
  }),

  update: Joi.object({
    date: Joi.date(),
    distance: Joi.number().min(0.1),
    time: Joi.number().min(1),
    workoutType: Joi.string().valid('base', 'pace', 'interval', 'long_run', 'recovery', 'strength'),
    photo: Joi.object({
      url: Joi.string().uri(),
      s3Key: Joi.string()
    }),
    notes: Joi.string().allow('').max(500)
  }),

  approve: Joi.object({
    points: Joi.number().min(0)
  }),

  reject: Joi.object({
    rejectionReason: Joi.string().required().min(10).messages({
      'string.min': 'Motivo deve ter no mínimo 10 caracteres'
    })
  }),

  validate: Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    rejectionReason: Joi.string().when('status', {
      is: 'rejected',
      then: Joi.required()
    }),
    points: Joi.number().min(0)
  })
};

// HPoints
export const hpointSchemas = {
  credit: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    points: Joi.number().required().min(1).messages({
      'number.base': 'Pontos deve ser um número',
      'number.min': 'Pontos deve ser maior que 0'
    }),
    reason: Joi.string().required().min(10).messages({
      'string.min': 'Motivo deve ter no mínimo 10 caracteres'
    })
  }),

  debit: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    points: Joi.number().required().min(1).messages({
      'number.base': 'Pontos deve ser um número',
      'number.min': 'Pontos deve ser maior que 0'
    }),
    reason: Joi.string().required().min(10).messages({
      'string.min': 'Motivo deve ter no mínimo 10 caracteres'
    })
  }),

  adjust: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    points: Joi.number().required().messages({
      'number.base': 'Pontos deve ser um número'
    }),
    reason: Joi.string().required().min(10).messages({
      'string.min': 'Motivo deve ter no mínimo 10 caracteres'
    }),
    type: Joi.string().valid('add', 'subtract').default('add')
  })
};

// Products
export const productSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(3).max(100),
    description: Joi.string().allow(''),
    type: Joi.string().valid('hack_product', 'mediterraneum_product', 'paid_plan', 'race_registration', 'service').required(),
    category: Joi.string().allow(''),
    points: Joi.number().min(1).required(),
    monetaryValue: Joi.number().min(0),
    image: Joi.string().allow(''),
    stock: Joi.object({
      available: Joi.boolean(),
      quantity: Joi.number().min(0)
    }),
    restrictions: Joi.object({
      plans: Joi.array().items(Joi.string().valid('free', 'paid', 'premium', 'corporate')),
      limitPerUser: Joi.number().min(1)
    }),
    requiresApproval: Joi.boolean(),
    sizes: Joi.array().items(Joi.string()),
    colors: Joi.array().items(Joi.string())
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().allow(''),
    type: Joi.string().valid('hack_product', 'mediterraneum_product', 'paid_plan', 'race_registration', 'service'),
    category: Joi.string().allow(''),
    points: Joi.number().min(1),
    monetaryValue: Joi.number().min(0),
    image: Joi.string().allow(''),
    stock: Joi.object({
      available: Joi.boolean(),
      quantity: Joi.number().min(0)
    }),
    active: Joi.boolean(),
    restrictions: Joi.object({
      plans: Joi.array().items(Joi.string().valid('free', 'paid', 'premium', 'corporate')),
      limitPerUser: Joi.number().min(1)
    }),
    requiresApproval: Joi.boolean()
  })
};

// Redemptions
export const redemptionSchemas = {
  create: Joi.object({
    productId: Joi.string().hex().length(24).required()
  })
};

// Events
export const eventSchemas = {
  create: Joi.object({
    type: Joi.string().valid('together', 'race').required(),
    name: Joi.string().required().min(3).max(100),
    description: Joi.string().allow(''),
    date: Joi.date().required().greater('now'),
    time: Joi.string().required().pattern(/^\d{2}:\d{2}$/),
    location: Joi.object({
      address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      coordinates: Joi.object({
        lat: Joi.number(),
        lng: Joi.number()
      })
    }).required(),
    distances: Joi.array().items(Joi.string()),
    registrationUrl: Joi.string().uri().allow(''),
    hpointsRedemptionAvailable: Joi.boolean(),
    hpointsRequired: Joi.number().min(0),
    routeDescription: Joi.string().allow(''),
    expectedDistance: Joi.number().min(0),
    expectedPace: Joi.string().allow('')
  }),

  update: Joi.object({
    type: Joi.string().valid('together', 'race'),
    name: Joi.string().min(3).max(100),
    description: Joi.string().allow(''),
    date: Joi.date().greater('now'),
    time: Joi.string().pattern(/^\d{2}:\d{2}$/),
    location: Joi.object({
      address: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      coordinates: Joi.object({
        lat: Joi.number(),
        lng: Joi.number()
      })
    }),
    distances: Joi.array().items(Joi.string()),
    registrationUrl: Joi.string().uri().allow(''),
    hpointsRedemptionAvailable: Joi.boolean(),
    hpointsRequired: Joi.number().min(0),
    routeDescription: Joi.string().allow(''),
    expectedDistance: Joi.number().min(0),
    expectedPace: Joi.string().allow(''),
    active: Joi.boolean()
  })
};

// Challenges
export const challengeSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(3).max(100),
    description: Joi.string().allow(''),
    duration: Joi.number().valid(30, 45, 60, 90).required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required().greater(Joi.ref('startDate')),
    rules: Joi.array().items(Joi.string()),
    bonusPoints: Joi.number().min(1).required(),
    criteria: Joi.object({
      minWorkouts: Joi.number().min(0),
      minKm: Joi.number().min(0),
      minAdherence: Joi.number().min(0).max(100)
    }),
    targetPlans: Joi.array().items(Joi.string().valid('free', 'paid', 'premium', 'corporate')),
    targetCompanies: Joi.array().items(Joi.string().hex().length(24)),
    isPublic: Joi.boolean()
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    description: Joi.string().allow(''),
    duration: Joi.number().valid(30, 45, 60, 90),
    startDate: Joi.date(),
    endDate: Joi.date().greater(Joi.ref('startDate')),
    rules: Joi.array().items(Joi.string()),
    bonusPoints: Joi.number().min(1),
    criteria: Joi.object({
      minWorkouts: Joi.number().min(0),
      minKm: Joi.number().min(0),
      minAdherence: Joi.number().min(0).max(100)
    }),
    targetPlans: Joi.array().items(Joi.string().valid('free', 'paid', 'premium', 'corporate')),
    targetCompanies: Joi.array().items(Joi.string().hex().length(24)),
    isPublic: Joi.boolean(),
    active: Joi.boolean()
  })
};

// Companies
export const companySchemas = {
  create: Joi.object({
    corporateName: Joi.string().required().min(3).max(200),
    tradeName: Joi.string().required().min(3).max(100),
    cnpj: Joi.string().required().pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/),
    address: Joi.object({
      street: Joi.string().allow(''),
      number: Joi.string().allow(''),
      complement: Joi.string().allow(''),
      neighborhood: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      zipCode: Joi.string().allow('')
    }),
    responsible: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      phone: Joi.string().required()
    }).required(),
    plan: Joi.object({
      type: Joi.string().valid('basic', 'intermediate', 'premium'),
      monthlyValue: Joi.number().min(0),
      maxEmployees: Joi.number().min(1)
    })
  }),

  update: Joi.object({
    corporateName: Joi.string().min(3).max(200),
    tradeName: Joi.string().min(3).max(100),
    address: Joi.object({
      street: Joi.string().allow(''),
      number: Joi.string().allow(''),
      complement: Joi.string().allow(''),
      neighborhood: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      zipCode: Joi.string().allow('')
    }),
    responsible: Joi.object({
      name: Joi.string(),
      email: Joi.string().email(),
      phone: Joi.string()
    }),
    plan: Joi.object({
      type: Joi.string().valid('basic', 'intermediate', 'premium'),
      monthlyValue: Joi.number().min(0),
      maxEmployees: Joi.number().min(1)
    }),
    active: Joi.boolean()
  })
};

// Content
export const contentSchemas = {
  create: Joi.object({
    type: Joi.string().valid('class', 'article', 'video').required(),
    title: Joi.string().required().min(3).max(200),
    description: Joi.string().allow(''),
    content: Joi.string().allow(''),
    videoUrl: Joi.string().uri().allow(''),
    thumbnail: Joi.string().allow(''),
    category: Joi.string().allow(''),
    tags: Joi.array().items(Joi.string()),
    planRestriction: Joi.array().items(Joi.string().valid('free', 'paid', 'premium', 'corporate')),
    duration: Joi.number().min(0)
  }),

  update: Joi.object({
    type: Joi.string().valid('class', 'article', 'video'),
    title: Joi.string().min(3).max(200),
    description: Joi.string().allow(''),
    content: Joi.string().allow(''),
    videoUrl: Joi.string().uri().allow(''),
    thumbnail: Joi.string().allow(''),
    category: Joi.string().allow(''),
    tags: Joi.array().items(Joi.string()),
    planRestriction: Joi.array().items(Joi.string().valid('free', 'paid', 'premium', 'corporate')),
    duration: Joi.number().min(0),
    active: Joi.boolean()
  })
};

// Orders
export const orderSchemas = {
  create: Joi.object({
    type: Joi.string().valid('kickstart', 'kickstart_kit', 'starter_pack', 'product', 'plan').required(),
    items: Joi.array().items(Joi.object({
      productId: Joi.string().hex().length(24),
      name: Joi.string(),
      quantity: Joi.number().min(1),
      price: Joi.number().min(0)
    })).default([]),
    shirtSize: Joi.string().valid('PP', 'P', 'M', 'G', 'GG', 'XG'),
    plan: Joi.string().valid('free', 'plus', 'pro'),
    planType: Joi.string().valid('free', 'paid', 'plus', 'pro', 'premium', 'corporate'),
    billingCycle: Joi.string().valid('MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'),
    totalValue: Joi.number().min(0),
    paymentMethod: Joi.string().valid('PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED'),
    deliveryAddress: Joi.object({
      street: Joi.string().allow(''),
      number: Joi.string().allow(''),
      complement: Joi.string().allow(''),
      neighborhood: Joi.string().allow(''),
      city: Joi.string().allow(''),
      state: Joi.string().allow(''),
      zipCode: Joi.string().allow('')
    })
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').required(),
    trackingCode: Joi.string().allow(''),
    notes: Joi.string().allow('')
  })
};

// Notifications
export const notificationSchemas = {
  create: Joi.object({
    type: Joi.string().valid('system', 'new_challenge', 'together_upcoming', 'race_upcoming').required(),
    title: Joi.string().required().max(100),
    message: Joi.string().required().max(500),
    link: Joi.string().uri().allow(''),
    targetType: Joi.string().valid('all', 'plan', 'company', 'user').required(),
    targetValue: Joi.alternatives().conditional('targetType', {
      switch: [
        { is: 'plan', then: Joi.string().valid('free', 'paid', 'premium', 'corporate').required() },
        { is: 'company', then: Joi.string().hex().length(24).required() },
        { is: 'user', then: Joi.string().hex().length(24).required() }
      ]
    }),
    scheduledFor: Joi.date().greater('now')
  })
};

// Cycles
export const cycleSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(3).max(100),
    objective: Joi.string().valid('health', 'weight_loss', 'performance', 'race_preparation', 'discipline').required(),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
    duration: Joi.number().valid(30, 45, 60, 90).required(),
    description: Joi.string().allow(''),
    workouts: Joi.array().items(Joi.object({
      day: Joi.number().required().min(1),
      type: Joi.string().valid('base', 'pace', 'interval', 'long_run', 'recovery', 'strength').required(),
      distance: Joi.number().min(0),
      time: Joi.number().min(0),
      description: Joi.string().allow('')
    }))
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100),
    objective: Joi.string().valid('health', 'weight_loss', 'performance', 'race_preparation', 'discipline'),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    duration: Joi.number().valid(30, 45, 60, 90),
    description: Joi.string().allow(''),
    workouts: Joi.array().items(Joi.object({
      day: Joi.number().min(1),
      type: Joi.string().valid('base', 'pace', 'interval', 'long_run', 'recovery', 'strength'),
      distance: Joi.number().min(0),
      time: Joi.number().min(0),
      description: Joi.string().allow('')
    })),
    active: Joi.boolean()
  })
};

// Settings
export const settingSchemas = {
  update: Joi.object({
    value: Joi.any().required(),
    description: Joi.string().allow('')
  }),

  upsert: Joi.object({
    key: Joi.string().required(),
    value: Joi.any().required(),
    description: Joi.string().allow('')
  })
};

// Paginação
export const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sort: Joi.string().allow(''),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

// ObjectId
export const objectIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required()
});

// Objeto que agrupa todos os schemas
export const schemas = {
  auth: authSchemas,
  onboarding: onboardingSchemas,
  workouts: workoutSchemas,
  hpoints: hpointSchemas,
  products: productSchemas,
  redemptions: redemptionSchemas,
  events: eventSchemas,
  challenges: challengeSchemas,
  companies: companySchemas,
  content: contentSchemas,
  orders: orderSchemas,
  notifications: notificationSchemas,
  cycles: cycleSchemas,
  settings: settingSchemas,
  pagination: paginationSchema,
  objectId: objectIdSchema
};

const validation = {
  validate,
  schemas,
  authSchemas,
  onboardingSchemas,
  workoutSchemas,
  hpointSchemas,
  productSchemas,
  redemptionSchemas,
  eventSchemas,
  challengeSchemas,
  companySchemas,
  contentSchemas,
  orderSchemas,
  notificationSchemas,
  cycleSchemas,
  settingSchemas,
  paginationSchema,
  objectIdSchema
};

export default validation;
