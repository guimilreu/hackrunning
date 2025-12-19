'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Loader2, CheckCircle2, Copy, Clock, Package, 
  CreditCard, QrCode, FileText, ShieldCheck, ArrowRight, Lock, User, Info, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/store/authStore';
import { maskCPF, maskPhone, maskCEP } from '@/lib/utils/masks';

const PAYMENT_METHODS = [
  {
    id: 'PIX',
    name: 'PIX',
    description: 'Pagamento instantâneo',
    icon: QrCode,
    color: 'from-green-500/20 to-green-600/10',
    borderColor: 'border-green-500/30',
    iconColor: 'text-green-400',
    renewalInfo: 'Nova cobrança gerada automaticamente. Você receberá notificações para pagar.'
  },
  {
    id: 'BOLETO',
    name: 'Boleto Bancário',
    description: 'Vencimento em 3 dias úteis',
    icon: FileText,
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    renewalInfo: 'Novo boleto gerado automaticamente. Você receberá notificações para pagar.'
  },
  {
    id: 'CREDIT_CARD',
    name: 'Cartão de Crédito',
    description: 'Pagamento à vista',
    icon: CreditCard,
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    renewalInfo: 'Renovação totalmente automática no seu cartão.'
  }
];

// Utilitários para formatação
const formatCardNumber = (value) => {
  return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
};

const formatExpiry = (value) => {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').slice(0, 5);
};

const formatCVV = (value) => {
  return value.replace(/\D/g, '').slice(0, 4);
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orderId = params.orderId;
  
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const [showMethodSelection, setShowMethodSelection] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingCEP, setLoadingCEP] = useState(false);

  // Estados do formulário de cartão
  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: ''
  });

  // Estados dos dados do titular do cartão (para Asaas)
  const [holderInfo, setHolderInfo] = useState({
    name: '',
    email: '',
    cpfCnpj: '',
    phone: ''
  });

  // Estados do endereço de entrega (usado para todos os métodos de pagamento)
  const [deliveryAddress, setDeliveryAddress] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Estados para dados pessoais (CPF e telefone - usado para PIX e Boleto)
  const [personalInfo, setPersonalInfo] = useState({
    cpf: '',
    phone: ''
  });

  // Preencher dados do titular com dados do usuário logado
  useEffect(() => {
    if (user) {
      setHolderInfo({
        name: user.name || '',
        email: user.email || '',
        cpfCnpj: user.cpf ? maskCPF(user.cpf) : '',
        phone: user.phone ? maskPhone(user.phone) : ''
      });
      
      // Preencher endereço de entrega
      setDeliveryAddress({
        zipCode: user.address?.zipCode ? maskCEP(user.address.zipCode) : '',
        street: user.address?.street || '',
        number: user.address?.number || '',
        complement: user.address?.complement || '',
        neighborhood: user.address?.neighborhood || '',
        city: user.address?.city || '',
        state: user.address?.state || ''
      });
      
      // Preencher dados pessoais
      setPersonalInfo({
        cpf: user.cpf ? maskCPF(user.cpf) : '',
        phone: user.phone ? maskPhone(user.phone) : ''
      });
    }
  }, [user]);

  // Buscar endereço via ViaCEP quando CEP é preenchido
  const handleCEPChange = async (value) => {
    const maskedValue = maskCEP(value);
    setDeliveryAddress({ ...deliveryAddress, zipCode: maskedValue });
    
    const cleanCEP = value.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setLoadingCEP(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setDeliveryAddress({
            ...deliveryAddress,
            zipCode: maskedValue,
            street: data.logradouro || '',
            complement: data.complemento || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || ''
          });
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast.error('Erro ao buscar endereço. Preencha manualmente.');
      } finally {
        setLoadingCEP(false);
      }
    }
  };

  // Buscar dados do pedido
  const { data: orderData, isLoading, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.data.order;
    },
    enabled: !!orderId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.payment?.asaasId && data?.payment?.status === 'pending') {
        return 5000;
      }
      return false;
    }
  });

  const order = orderData;

  // Preencher endereço do pedido se já existir
  useEffect(() => {
    if (orderData?.deliveryAddress) {
      const addr = orderData.deliveryAddress;
      setDeliveryAddress({
        zipCode: addr.zipCode ? maskCEP(addr.zipCode) : '',
        street: addr.street || '',
        number: addr.number || '',
        complement: addr.complement || '',
        neighborhood: addr.neighborhood || '',
        city: addr.city || '',
        state: addr.state || ''
      });
    }
  }, [orderData]);

  // Mutation para iniciar pagamento (PIX e Boleto)
  const { mutate: initiatePayment, isPending: isInitiating } = useMutation({
    mutationFn: async (paymentMethod) => {
      // Validar dados obrigatórios
      const cleanCpf = personalInfo.cpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
        throw new Error('CPF/CNPJ inválido');
      }
      
      const cleanPhone = personalInfo.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Telefone inválido');
      }
      
      const cleanZipCode = deliveryAddress.zipCode.replace(/\D/g, '');
      if (cleanZipCode.length !== 8) {
        throw new Error('CEP inválido');
      }
      
      if (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.city || !deliveryAddress.state) {
        throw new Error('Preencha todos os campos do endereço');
      }
      
      const response = await api.post(`/orders/${orderId}/pay`, {
        paymentMethod,
        cpf: cleanCpf,
        phone: cleanPhone,
        deliveryAddress: {
          zipCode: cleanZipCode,
          street: deliveryAddress.street,
          number: deliveryAddress.number,
          complement: deliveryAddress.complement,
          neighborhood: deliveryAddress.neighborhood,
          city: deliveryAddress.city,
          state: deliveryAddress.state
        }
      });
      return response.data.data.order;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['order', orderId], updatedOrder);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Erro ao processar pagamento');
    }
  });

  // Mutation para pagamento com cartão (checkout transparente)
  const { mutate: payWithCreditCard, isPending: isPayingWithCard } = useMutation({
    mutationFn: async (cardInfo) => {
      const response = await api.post(`/orders/${orderId}/pay-credit-card`, cardInfo);
      return response.data.data.order;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['order', orderId], updatedOrder);
      toast.success('Pagamento processado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao processar pagamento com cartão');
    }
  });

  // Mutation para cancelar apenas o pagamento e voltar para seleção
  const { mutate: cancelPayment, isPending: isCancelling } = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/orders/${orderId}/cancel-payment`);
      return response.data.data.order;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['order', orderId], updatedOrder);
      setSelectedMethod(null);
      setShowCreditCardForm(false);
      setShowMethodSelection(true);
      toast.success('Escolha outro método de pagamento');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao cancelar pagamento');
    }
  });

  // Handler para voltar à seleção de método
  const handleBackToMethods = () => {
    if (order?.payment?.asaasId && order.payment.status === 'pending') {
      // Cancelar pagamento no backend e voltar para seleção
      cancelPayment();
      setShowMethodSelection(true);
    } else {
      // Apenas resetar estado local
      setSelectedMethod(null);
      setShowCreditCardForm(false);
      setShowMethodSelection(true);
      refetch();
    }
  };

  // Copiar código PIX
  const handleCopyPix = () => {
    if (order?.payment?.pixCopyPaste) {
      navigator.clipboard.writeText(order.payment.pixCopyPaste);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Redirecionar se pagamento confirmado (cartão de crédito - automático)
  useEffect(() => {
    if (order?.payment?.status === 'paid' && order?.payment?.method === 'CREDIT_CARD') {
      // Não mostrar toast, apenas redirecionar com loading
      setTimeout(() => {
        router.push('/app/onboarding/success');
      }, 1500);
    }
  }, [order?.payment?.status, order?.payment?.method, router]);

  // Mostrar seleção de método quando não há pagamento
  useEffect(() => {
    if (order) {
      if (!order.payment?.asaasId) {
        // Sem pagamento criado, mostrar seleção
        setShowMethodSelection(true);
        setSelectedMethod(null);
        setShowCreditCardForm(false);
      } else {
        // Já tem pagamento, não mostrar seleção por padrão
        setShowMethodSelection(false);
      }
    }
  }, [order]);

  // Handler para seleção de método
  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    setShowMethodSelection(false);
    
    if (methodId === 'CREDIT_CARD') {
      setShowCreditCardForm(true);
    } else {
      setShowCreditCardForm(false);
      // PIX e Boleto: usuário precisa preencher dados e clicar em continuar
    }
  };

  // Handler para submissão do formulário de cartão
  const handleCreditCardSubmit = (e) => {
    e.preventDefault();
    
    // Validações do cartão
    if (!cardData.holderName || cardData.holderName.length < 3) {
      toast.error('Nome impresso no cartão inválido');
      return;
    }
    
    const cleanNumber = cardData.number.replace(/\s/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 16) {
      toast.error('Número do cartão inválido');
      return;
    }
    
    if (!cardData.expiryMonth || !cardData.expiryYear) {
      toast.error('Data de validade inválida');
      return;
    }
    
    if (cardData.ccv.length < 3) {
      toast.error('CVV inválido');
      return;
    }

    // Validações dos dados do titular (obrigatórios para Asaas)
    if (!holderInfo.name || holderInfo.name.length < 3) {
      toast.error('Informe o nome completo do titular');
      return;
    }

    if (!holderInfo.email || !holderInfo.email.includes('@')) {
      toast.error('Informe o email do titular');
      return;
    }

    const cleanCpf = holderInfo.cpfCnpj.replace(/\D/g, '');
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      toast.error('CPF/CNPJ do titular inválido');
      return;
    }

    const cleanPhone = holderInfo.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Telefone do titular inválido');
      return;
    }

    // Validar endereço de entrega (usaremos o endereço de entrega também para o titular)
    const cleanDeliveryZipCode = deliveryAddress.zipCode.replace(/\D/g, '');
    if (cleanDeliveryZipCode.length !== 8) {
      toast.error('Informe o CEP do endereço de entrega');
      return;
    }

    if (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.city || !deliveryAddress.state) {
      toast.error('Preencha todos os campos do endereço de entrega');
      return;
    }

    // Enviar dados (sempre à vista, sem parcelamento)
    payWithCreditCard({
      holderName: cardData.holderName,
      number: cleanNumber,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      ccv: cardData.ccv,
      // Dados do titular do cartão (usamos o endereço de entrega também para o titular)
      creditCardHolderInfo: {
        name: holderInfo.name,
        email: holderInfo.email,
        cpfCnpj: cleanCpf,
        phone: cleanPhone,
        postalCode: cleanDeliveryZipCode,
        addressNumber: deliveryAddress.number
      },
      // Endereço de entrega completo
      deliveryAddress: {
        zipCode: cleanDeliveryZipCode,
        street: deliveryAddress.street,
        number: deliveryAddress.number,
        complement: deliveryAddress.complement,
        neighborhood: deliveryAddress.neighborhood,
        city: deliveryAddress.city,
        state: deliveryAddress.state
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-zinc-400">Carregando informações do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 text-zinc-600 mx-auto" />
          <h2 className="text-2xl font-bold">Pedido não encontrado</h2>
          <Button onClick={() => router.push('/app/home')}>
            Voltar para o início
          </Button>
        </div>
      </div>
    );
  }

  // Estados do pagamento
  const isPaid = order.payment?.status === 'paid';
  const hasPayment = !!order.payment?.asaasId;
  const isPending = order.payment?.status === 'pending';
  // Mostrar seleção se não tem pagamento criado OU se usuário quer voltar
  const needsPaymentMethod = !hasPayment;

  return (
    <div className="min-h-screen bg-background text-white py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <img src="/logo.png" alt="Hack Running" className="h-8 mx-auto object-contain" />
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black">
              {isPaid ? '✅ Pagamento Confirmado!' : '💳 Finalize seu Pagamento'}
            </h1>
            <p className="text-zinc-400">
              {isPaid 
                ? 'Seu pedido foi confirmado e será processado em breve.' 
                : needsPaymentMethod 
                  ? 'Escolha como deseja pagar'
                  : 'Complete o pagamento para garantir seu Starter Pack'}
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          
          {/* Coluna Principal - Pagamento */}
          <div className="space-y-6">
            
            {/* Formulário de Dados Pessoais e Endereço */}
            {(needsPaymentMethod || showMethodSelection || showCreditCardForm) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
              >
                <h3 className="text-xl font-bold mb-6">Dados para Entrega</h3>
                
                <div className="space-y-6">
                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                      <User className="w-4 h-4" />
                      <span>Dados Pessoais</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-zinc-300 mb-2 block">CPF/CNPJ *</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={personalInfo.cpf}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, cpf: maskCPF(e.target.value) })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label className="text-zinc-300 mb-2 block">Telefone *</Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={personalInfo.phone}
                          onChange={(e) => setPersonalInfo({ ...personalInfo, phone: maskPhone(e.target.value) })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço de Entrega */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                      <Package className="w-4 h-4" />
                      <span>Endereço de Entrega</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-zinc-300 mb-2 block">CEP *</Label>
                        <div className="relative">
                          <Input
                            placeholder="00000-000"
                            value={deliveryAddress.zipCode}
                            onChange={(e) => handleCEPChange(e.target.value)}
                            className="bg-black border-white/10 text-white"
                            required
                          />
                          {loadingCEP && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <Label className="text-zinc-300 mb-2 block">Logradouro *</Label>
                        <Input
                          placeholder="Rua, Avenida, etc"
                          value={deliveryAddress.street}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-300 mb-2 block">Número *</Label>
                        <Input
                          placeholder="123"
                          value={deliveryAddress.number}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, number: e.target.value })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-300 mb-2 block">Complemento</Label>
                        <Input
                          placeholder="Apto, Bloco, etc"
                          value={deliveryAddress.complement}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, complement: e.target.value })}
                          className="bg-black border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-300 mb-2 block">Bairro *</Label>
                        <Input
                          placeholder="Bairro"
                          value={deliveryAddress.neighborhood}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, neighborhood: e.target.value })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-300 mb-2 block">Cidade *</Label>
                        <Input
                          placeholder="Cidade"
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-300 mb-2 block">Estado *</Label>
                        <Input
                          placeholder="UF"
                          value={deliveryAddress.state}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, state: e.target.value.toUpperCase() })}
                          maxLength={2}
                          className="bg-black border-white/10 text-white uppercase"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Escolha do Método de Pagamento */}
            {(needsPaymentMethod || showMethodSelection) && !showCreditCardForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
              >
                <h3 className="text-xl font-bold mb-6">Escolha a forma de pagamento</h3>
                
                <div className="space-y-4">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => handleMethodSelect(method.id)}
                        disabled={isInitiating}
                        className={cn(
                          "w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left group",
                          "bg-gradient-to-r",
                          isSelected 
                            ? `${method.color} ${method.borderColor}` 
                            : "from-zinc-900 to-zinc-900 border-white/10 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center transition-colors",
                            isSelected ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10"
                          )}>
                            <Icon className={cn("w-7 h-7", isSelected ? method.iconColor : "text-zinc-400")} />
                          </div>
                          <div className="flex-1">
                            <p className={cn("font-bold text-lg", isSelected ? "text-white" : "text-zinc-300")}>
                              {method.name}
                            </p>
                            <p className="text-sm text-zinc-500">{method.description}</p>
                          </div>
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                            isSelected ? `${method.borderColor} bg-white/10` : "border-zinc-600"
                          )}>
                            {isSelected && <div className="w-3 h-3 rounded-full bg-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Botão para continuar com PIX ou Boleto */}
                {selectedMethod && selectedMethod !== 'CREDIT_CARD' && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <Button
                      onClick={() => {
                        // Validar dados antes de prosseguir
                        const cleanCpf = personalInfo.cpf.replace(/\D/g, '');
                        if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
                          toast.error('Informe um CPF/CNPJ válido');
                          return;
                        }
                        
                        const cleanPhone = personalInfo.phone.replace(/\D/g, '');
                        if (cleanPhone.length < 10) {
                          toast.error('Informe um telefone válido');
                          return;
                        }
                        
                        const cleanZipCode = deliveryAddress.zipCode.replace(/\D/g, '');
                        if (cleanZipCode.length !== 8) {
                          toast.error('Informe um CEP válido');
                          return;
                        }
                        
                        if (!deliveryAddress.street || !deliveryAddress.number || !deliveryAddress.city || !deliveryAddress.state) {
                          toast.error('Preencha todos os campos do endereço');
                          return;
                        }
                        
                        initiatePayment(selectedMethod);
                      }}
                      disabled={isInitiating}
                      className="w-full h-14 bg-[#eeff00] hover:bg-[#eeff00]/90 text-black font-bold text-lg rounded-xl"
                    >
                      {isInitiating ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin w-5 h-5" />
                          Gerando pagamento...
                        </div>
                      ) : (
                        `Gerar ${selectedMethod === 'PIX' ? 'QR Code PIX' : 'Boleto'}`
                      )}
                    </Button>
                  </div>
                )}

                {/* Aviso sobre Renovação de Planos */}
                {order.planType && (order.planType === 'plus' || order.planType === 'pro') && (
                  <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-sm space-y-2">
                        <p className="text-blue-400 font-bold">ℹ️ Sobre a renovação do seu plano</p>
                        <div className="text-zinc-300 space-y-1.5">
                          <p><strong className="text-white">💳 Se pagar com Cartão:</strong> A renovação será automática. Cobraremos no seu cartão sem que você precise fazer nada.</p>
                          <p><strong className="text-white">🔔 Se pagar com PIX/Boleto:</strong> Geraremos uma nova cobrança e enviaremos notificações. Você precisará pagar manualmente.</p>
                        </div>
                        <p className="text-zinc-500 text-xs mt-2">
                          Você pode cancelar sua assinatura a qualquer momento no painel da sua conta.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Formulário de Cartão de Crédito */}
            {needsPaymentMethod && showCreditCardForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Cartão de Crédito</h3>
                      <p className="text-sm text-zinc-400">Preencha os dados do cartão</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreditCardForm(false);
                      setSelectedMethod(null);
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    Voltar
                  </Button>
                </div>

                <form onSubmit={handleCreditCardSubmit} className="space-y-6">
                  {/* Seção: Dados do Cartão */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                      <CreditCard className="w-4 h-4" />
                      <span>Dados do Cartão</span>
                    </div>

                    {/* Nome impresso no cartão */}
                    <div>
                      <Label className="text-zinc-300 mb-2 block">Nome impresso no cartão</Label>
                      <Input
                        placeholder="NOME COMPLETO"
                        value={cardData.holderName}
                        onChange={(e) => setCardData({ ...cardData, holderName: e.target.value.toUpperCase() })}
                        className="bg-black border-white/10 text-white uppercase"
                        required
                      />
                    </div>

                    {/* Número do cartão */}
                    <div>
                      <Label className="text-zinc-300 mb-2 block">Número do cartão</Label>
                      <Input
                        placeholder="0000 0000 0000 0000"
                        value={formatCardNumber(cardData.number)}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\s/g, '') })}
                        maxLength={19}
                        className="bg-black border-white/10 text-white font-mono text-lg"
                        required
                      />
                    </div>

                    {/* Validade e CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-zinc-300 mb-2 block">Validade</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select 
                            value={cardData.expiryMonth} 
                            onValueChange={(value) => setCardData({ ...cardData, expiryMonth: value })}
                          >
                            <SelectTrigger className="bg-black border-white/10 text-white">
                              <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                              {Array.from({ length: 12 }, (_, i) => {
                                const month = String(i + 1).padStart(2, '0');
                                return (
                                  <SelectItem key={month} value={month} className="text-white focus:bg-zinc-800">
                                    {month}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <Select 
                            value={cardData.expiryYear} 
                            onValueChange={(value) => setCardData({ ...cardData, expiryYear: value })}
                          >
                            <SelectTrigger className="bg-black border-white/10 text-white">
                              <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800">
                              {Array.from({ length: 15 }, (_, i) => {
                                const year = String(new Date().getFullYear() + i);
                                return (
                                  <SelectItem key={year} value={year} className="text-white focus:bg-zinc-800">
                                    {year}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-zinc-300 mb-2 block">CVV</Label>
                        <Input
                          placeholder="000"
                          value={cardData.ccv}
                          onChange={(e) => setCardData({ ...cardData, ccv: formatCVV(e.target.value) })}
                          maxLength={4}
                          className="bg-black border-white/10 text-white font-mono text-center text-lg"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seção: Dados do Titular */}
                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 font-medium">
                      <User className="w-4 h-4" />
                      <span>Dados do Titular do Cartão</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label className="text-zinc-300 mb-2 block">Nome completo</Label>
                        <Input
                          placeholder="Nome do titular"
                          value={holderInfo.name}
                          onChange={(e) => setHolderInfo({ ...holderInfo, name: e.target.value })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-300 mb-2 block">CPF/CNPJ</Label>
                        <Input
                          placeholder="000.000.000-00"
                          value={holderInfo.cpfCnpj}
                          onChange={(e) => setHolderInfo({ ...holderInfo, cpfCnpj: maskCPF(e.target.value) })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-300 mb-2 block">Telefone</Label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={holderInfo.phone}
                          onChange={(e) => setHolderInfo({ ...holderInfo, phone: maskPhone(e.target.value) })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <Label className="text-zinc-300 mb-2 block">Email</Label>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          value={holderInfo.email}
                          onChange={(e) => setHolderInfo({ ...holderInfo, email: e.target.value })}
                          className="bg-black border-white/10 text-white"
                          required
                        />
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500">
                      Os dados do titular são necessários para validação do pagamento junto à operadora do cartão.
                    </p>
                  </div>

                  {/* Botão de pagamento */}
                  <Button
                    type="submit"
                    disabled={isPayingWithCard}
                    className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl mt-2"
                  >
                    {isPayingWithCard ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" />
                        Processando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Finalizar Pagamento
                      </div>
                    )}
                  </Button>

                  {/* Segurança */}
                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mt-4">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Seus dados estão protegidos com criptografia SSL</span>
                  </div>

                  {/* Aviso sobre Renovação Automática */}
                  {order.planType && (order.planType === 'plus' || order.planType === 'pro') && (
                    <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 mt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p className="text-purple-400 font-bold mb-1">Renovação Automática</p>
                          <p className="text-zinc-300">
                            Ao pagar com cartão, a renovação do seu plano será automática. Cobraremos automaticamente no vencimento.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </motion.div>
            )}

            {/* Card de Pagamento PIX */}
            {isPending && order.payment?.method === 'PIX' && order.payment?.pixQrCode && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <QrCode className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Pagar com PIX</h3>
                      <p className="text-sm text-zinc-400">Pagamento instantâneo</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleBackToMethods}
                    disabled={isCancelling}
                    className="text-zinc-400 hover:text-white"
                  >
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Voltar'
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl flex items-center justify-center">
                    <img 
                      src={`data:image/png;base64,${order.payment.pixQrCode}`}
                      alt="QR Code PIX"
                      className="w-64 h-64"
                    />
                  </div>

                  {order.payment.pixCopyPaste && (
                    <div className="space-y-3">
                      <p className="text-sm text-zinc-400 text-center">
                        Ou copie o código PIX abaixo:
                      </p>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-xs break-all">
                          {order.payment.pixCopyPaste.substring(0, 60)}...
                        </div>
                        <Button
                          onClick={handleCopyPix}
                          className="bg-[#eeff00] hover:bg-[#eeff00]/90 text-black shrink-0"
                        >
                          {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                      <div className="text-sm space-y-1">
                        <p className="text-green-400 font-bold">Como pagar:</p>
                        <ol className="text-zinc-300 space-y-1 list-decimal list-inside">
                          <li>Abra o app do seu banco</li>
                          <li>Escolha pagar com PIX QR Code ou Copia e Cola</li>
                          <li>Escaneie o QR Code ou cole o código</li>
                          <li>Confirme o pagamento</li>
                        </ol>
                        <p className="text-zinc-500 mt-2">⚡ Confirmação automática em poucos segundos</p>
                      </div>
                    </div>
                  </div>

                  {/* Botão Confirmar Pagamento */}
                  <Button
                    onClick={() => router.push('/app/onboarding/payment-pending')}
                    className="w-full h-14 bg-[#eeff00] hover:bg-[#eeff00]/90 text-black font-bold text-lg rounded-xl"
                  >
                    Já Paguei - Confirmar Pagamento
                  </Button>

                  {/* Aviso sobre Renovações com PIX */}
                  {order.planType && (order.planType === 'plus' || order.planType === 'pro') && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p className="text-blue-400 font-bold mb-1">🔔 Sobre as próximas cobranças</p>
                          <p className="text-zinc-300">
                            Nas renovações, geraremos automaticamente um novo PIX e enviaremos notificações por email e no app. 
                            Você precisará pagar manualmente a cada período.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Card de Pagamento BOLETO */}
            {isPending && order.payment?.method === 'BOLETO' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Boleto Bancário</h3>
                      <p className="text-sm text-zinc-400">Vencimento: {new Date(order.payment.dueDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleBackToMethods}
                    disabled={isCancelling}
                    className="text-zinc-400 hover:text-white"
                  >
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Voltar'
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  {order.payment.bankSlipUrl && (
                    <Button
                      onClick={() => window.open(order.payment.bankSlipUrl, '_blank')}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Visualizar e Imprimir Boleto
                    </Button>
                  )}

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="text-blue-400 font-bold">Importante:</p>
                        <p className="text-zinc-300">O boleto pode levar até 3 dias úteis para ser compensado após o pagamento.</p>
                      </div>
                    </div>
                  </div>

                  {/* Botão Confirmar Pagamento */}
                  <Button
                    onClick={() => router.push('/app/onboarding/payment-pending')}
                    className="w-full h-14 bg-[#eeff00] hover:bg-[#eeff00]/90 text-black font-bold text-lg rounded-xl"
                  >
                    Já Paguei - Confirmar Pagamento
                  </Button>

                  {/* Aviso sobre Renovações com Boleto */}
                  {order.planType && (order.planType === 'plus' || order.planType === 'pro') && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-sm">
                          <p className="text-blue-400 font-bold mb-1">🔔 Sobre as próximas cobranças</p>
                          <p className="text-zinc-300">
                            Nas renovações, geraremos automaticamente um novo boleto e enviaremos notificações por email e no app. 
                            Você precisará pagar manualmente a cada período.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Card de Pagamento em Análise (Cartão) */}
            {isPending && order.payment?.method === 'CREDIT_CARD' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Pagamento em Análise</h3>
                      <p className="text-sm text-zinc-400">Aguardando confirmação do banco</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleBackToMethods}
                    disabled={isCancelling}
                    className="text-zinc-400 hover:text-white"
                  >
                    {isCancelling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Tentar outro cartão'
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 flex flex-col items-center text-center">
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                    <h4 className="text-lg font-bold text-white mb-2">Processando seu pagamento</h4>
                    <p className="text-zinc-300 text-sm max-w-md">
                      Estamos confirmando os dados com a operadora do seu cartão. Isso geralmente leva alguns segundos, mas pode demorar alguns minutos.
                    </p>
                    <p className="text-zinc-500 text-xs mt-4">
                      Você não precisa fazer nada. Esta página atualizará automaticamente assim que o pagamento for confirmado.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Card de Sucesso - Pagamento com Cartão Aprovado */}
            {isPaid && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-500/10 to-[#eeff00]/10 border border-green-500/20 rounded-3xl p-8 text-center"
              >
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="relative">
                      <CheckCircle2 className="w-20 h-20 text-green-400" />
                      <div className="absolute inset-0 animate-ping">
                        <CheckCircle2 className="w-20 h-20 text-green-400 opacity-30" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Pagamento Confirmado! 🎉</h3>
                    <p className="text-zinc-300">
                      Te levando ao app...
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#eeff00]" />
                  </div>

                  <p className="text-sm text-zinc-500">
                    Seu Starter Pack será enviado em breve. Você receberá um email com o código de rastreamento.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Informações do Pedido */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#eeff00]" />
                Detalhes do Pedido
              </h4>
              <div className="space-y-3 text-sm">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-zinc-400">{item.name}</span>
                    <span className="font-bold">
                      {item.price === 0 ? 'GRÁTIS' : `R$ ${item.price.toFixed(2)}`}
                    </span>
                  </div>
                ))}
                {order.shirtSize && (
                  <div className="flex justify-between pt-3 border-t border-white/10">
                    <span className="text-zinc-400">Tamanho da Camiseta</span>
                    <span className="font-bold text-[#eeff00]">{order.shirtSize}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-white/10 text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-black text-[#eeff00]">
                    R$ {order.totalValue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
