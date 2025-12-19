import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  }
}, { _id: false });

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  s3Key: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: true });

const eventSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['together', 'race'],
    required: [true, 'Tipo é obrigatório']
  },
  name: { 
    type: String, 
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  description: { type: String, default: '' },
  date: { 
    type: Date, 
    required: [true, 'Data é obrigatória'],
    index: true
  },
  time: { type: String, required: [true, 'Hora é obrigatória'] },
  location: { 
    type: locationSchema, 
    required: [true, 'Local é obrigatório']
  },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  confirmed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  photos: [mediaSchema],
  videos: [mediaSchema],
  active: { type: Boolean, default: true },
  // Campos específicos para provas
  distances: [{ type: String }],
  registrationUrl: { type: String },
  hpointsRedemptionAvailable: { type: Boolean, default: false },
  hpointsRequired: { type: Number },
  // Campos específicos para Together
  routeDescription: { type: String },
  expectedDistance: { type: Number },
  expectedPace: { type: String }
}, {
  timestamps: true
});

// Índices
eventSchema.index({ type: 1, date: 1 });
eventSchema.index({ active: 1, date: 1 });

// Método para confirmar presença
eventSchema.methods.confirmPresence = async function(userId) {
  if (!this.confirmed.includes(userId)) {
    this.confirmed.push(userId);
    if (!this.participants.includes(userId)) {
      this.participants.push(userId);
    }
    return this.save();
  }
  return this;
};

// Método para remover confirmação
eventSchema.methods.removeConfirmation = async function(userId) {
  this.confirmed = this.confirmed.filter(id => !id.equals(userId));
  return this.save();
};

// Método para adicionar foto
eventSchema.methods.addPhoto = async function(photoData) {
  this.photos.push(photoData);
  return this.save();
};

// Método para adicionar vídeo
eventSchema.methods.addVideo = async function(videoData) {
  this.videos.push(videoData);
  return this.save();
};

// Método estático para buscar próximos eventos
eventSchema.statics.findUpcoming = function(type = null, limit = 10) {
  const query = {
    active: true,
    date: { $gte: new Date() }
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ date: 1 })
    .limit(limit);
};

// Método estático para buscar eventos passados
eventSchema.statics.findPast = function(type = null, limit = 10) {
  const query = {
    active: true,
    date: { $lt: new Date() }
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .sort({ date: -1 })
    .limit(limit);
};

// Método estático para buscar próximo Together
eventSchema.statics.findNextTogether = function() {
  return this.findOne({
    type: 'together',
    active: true,
    date: { $gte: new Date() }
  }).sort({ date: 1 });
};

const Event = mongoose.model('Event', eventSchema);

export default Event;
