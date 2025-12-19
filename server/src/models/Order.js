import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
  planType: { type: String }
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  asaasId: { type: String },
  customerId: { type: String },
  subscriptionId: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'overdue', 'refunded', 'failed', 'cancelled'],
    default: 'pending'
  },
  method: { 
    type: String,
    enum: ['PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED']
  },
  value: { type: Number },
  netValue: { type: Number },
  paidAt: { type: Date },
  dueDate: { type: Date },
  invoiceUrl: { type: String },
  bankSlipUrl: { type: String },
  pixQrCode: { type: String },
  pixCopyPaste: { type: String },
  nossoNumero: { type: String },
  externalReference: { type: String }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  number: { type: String },
  series: { type: String },
  key: { type: String },
  url: { type: String },
  issued: { type: Boolean, default: false },
  issuedAt: { type: Date }
}, { _id: false });

const deliveryAddressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  number: { type: String, default: '' },
  complement: { type: String, default: '' },
  neighborhood: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zipCode: { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'User é obrigatório'],
    index: true
  },
  type: { 
    type: String, 
    enum: ['kickstart', 'starter_pack', 'product', 'plan'],
    required: [true, 'Tipo é obrigatório']
  },
  items: [orderItemSchema],
  totalValue: { 
    type: Number, 
    required: [true, 'Valor total é obrigatório'],
    min: [0, 'Valor não pode ser negativo']
  },
  payment: { type: paymentSchema, default: () => ({}) },
  invoice: { type: invoiceSchema, default: () => ({}) },
  deliveryAddress: { type: deliveryAddressSchema, default: () => ({}) },
  status: { 
    type: String, 
    enum: ['awaiting_payment', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'awaiting_payment'
  },
  trackingCode: { type: String, default: '' },
  shirtSize: { type: String, enum: ['PP', 'P', 'M', 'G', 'GG', 'XG'] },
  planType: { type: String, enum: ['free', 'paid', 'plus', 'pro', 'premium', 'corporate'] },
  billingCycle: { type: String, enum: ['MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY'] },
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

// Índices
orderSchema.index({ 'payment.asaasId': 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.customerId': 1 });

// Método para atualizar status de pagamento
orderSchema.methods.updatePaymentStatus = async function(status, paymentData = {}) {
  this.payment.status = status;
  
  if (paymentData.method) {
    this.payment.method = paymentData.method;
  }
  
  if (status === 'paid') {
    this.payment.paidAt = paymentData.paidAt || new Date();
    
    // Atualizar status do pedido automaticamente
    if (this.status === 'pending' || this.status === 'awaiting_payment') {
      this.status = 'processing';
    }
  }
  
  if (paymentData.netValue) {
    this.payment.netValue = paymentData.netValue;
  }
  
  return this.save();
};

// Método para atualizar status do pedido
orderSchema.methods.updateStatus = async function(status, trackingCode = null) {
  this.status = status;
  if (trackingCode) {
    this.trackingCode = trackingCode;
  }
  return this.save();
};

// Método para adicionar nota fiscal
orderSchema.methods.addInvoice = async function(invoiceData) {
  this.invoice = {
    ...invoiceData,
    issued: true,
    issuedAt: new Date()
  };
  return this.save();
};

// Método estático para buscar pedidos pendentes de pagamento
orderSchema.statics.findPendingPayment = function() {
  return this.find({ 'payment.status': 'pending' })
    .populate('user', 'firstName lastName email')
    .sort({ createdAt: 1 });
};

// Método estático para buscar pedidos pagos pendentes de envio
orderSchema.statics.findPendingShipment = function() {
  return this.find({ 
    'payment.status': 'paid',
    status: { $in: ['pending', 'processing'] },
    type: { $in: ['kickstart', 'starter_pack', 'product'] }
  })
    .populate('user', 'firstName lastName email phone address')
    .sort({ 'payment.paidAt': 1 });
};

// Método estático para buscar por ID do pagamento Asaas
orderSchema.statics.findByPaymentId = function(paymentId) {
  return this.findOne({ 'payment.asaasId': paymentId });
};

// Método estático para buscar por customerId do Asaas
orderSchema.statics.findByCustomerId = function(customerId) {
  return this.find({ 'payment.customerId': customerId });
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
