'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Check, CreditCard, Star, Package, ShoppingBag, BookOpen, Sticker, Zap, ArrowRight, ShieldCheck, Trophy, Shirt, ArrowLeft, Info, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateOrder, useOnboardingBack } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import api from '@/lib/api';

const PLANS = {
  free: { 
    id: 'free',
    name: 'Gratuito', 
    price: 0,
    features: ['Planilha Básica', '1 Aula/mês', 'Comunidade']
  },
  plus: { 
    id: 'plus',
    name: 'Plus', 
    price: 150.00,
    features: ['Planilha Personalizada', 'Aulas Ilimitadas', 'Suporte Prioritário']
  },
  pro: { 
    id: 'pro',
    name: 'Pro', 
    price: 220.00,
    features: ['Coach Dedicado', 'Análise de Vídeo', 'Nutrição Básica', 'Mentoria Mensal']
  }
};

const KIT_ITEMS = [
  { icon: Check, text: "Camiseta Oficial Hack", subtext: "Tecido tecnológico Dry-Fit" },
  { icon: ShoppingBag, text: "Sacochila Impermeável", subtext: "Para seus treinos" },
  { icon: Zap, text: "Coqueteleira", subtext: "700ml" },
  { icon: Sticker, text: "Pack de Adesivos", subtext: "Personalize seus itens" },
  { icon: BookOpen, text: "Guia do Corredor", subtext: "Manual de sobrevivência do Runner" },
];

export default function StarterPackPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutate: createOrder, isPending } = useCreateOrder();
  const { mutate: goBack, isPending: isGoingBack } = useOnboardingBack();
  
  const [size, setSize] = useState('');
  const [plan, setPlan] = useState('free'); // Default to Pro for better conversion
  const [billingCycle, setBillingCycle] = useState('MONTHLY'); // Default to Quarterly
  const [showSizeError, setShowSizeError] = useState(false);
  const [checkingOrder, setCheckingOrder] = useState(true);

  const handleBack = () => {
    goBack(3, {
      onSuccess: () => {
        router.push('/onboarding/step3');
      }
    });
  };

  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check for existing pending orders
  useEffect(() => {
    const checkPendingOrders = async () => {
      try {
        // Only check if user is loaded
        if (!user?._id) return;

        const response = await api.get('/orders', {
          params: { 
            // We want to find any recent order that is pending payment for starter pack
            type: 'starter_pack',
            limit: 5 // Get a few to filter properly client side if needed, though type filter helps
          }
        });
        
        const orders = response.data?.data?.orders || [];
        // Find first valid pending order
        const pendingOrder = orders.find(o => 
            ['awaiting_payment', 'pending'].includes(o.status)
        );

        if (pendingOrder) {
             toast.info('Você já possui um pedido em andamento. Redirecionando...');
             router.push(`/checkout/${pendingOrder._id}`);
             return;
        }
      } catch (error) {
        console.error('Erro ao verificar pedidos:', error);
      } finally {
        setCheckingOrder(false);
      }
    };

    if (user?._id) {
        checkPendingOrders();
    } else {
        // If user not loaded yet, wait. If not logged in, auth guard handles it.
        // But if hydration finished and user is missing, we stop checking.
        // However, useAuthStore usually handles this. Let's rely on checkingOrder state.
        if (typeof window !== 'undefined') {
             // small delay to allow auth to settle if just hydrated
             setTimeout(() => setCheckingOrder(false), 1000);
        }
    }
  }, [user, router]);

  // Calcular Preços
  let kitPrice = 120.00;
  let planPrice = 0;
  let savings = 0;

  if (plan === 'plus' || plan === 'pro') {
    if (billingCycle === 'QUARTERLY') {
      kitPrice = 0; // Grátis
      planPrice = PLANS[plan].price * 3;
      savings = 120.00; // Economia do Kit
    } else {
      kitPrice = 60.00; // 50% OFF
      planPrice = PLANS[plan].price;
      savings = 60.00;
    }
  } else {
    // Free
    kitPrice = 120.00;
    planPrice = 0;
    savings = 0;
  }

  const total = kitPrice + planPrice;

  if (checkingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-[#eeff00]" />
      </div>
    );
  }

  const handleBuy = () => {
    if (!size) {
        setShowSizeError(true);
        toast.error('Por favor, selecione o tamanho da camiseta', {
            style: { background: '#333', color: '#fff' }
        });
        // Scroll suave até o seletor de tamanho
        document.getElementById('size-selector')?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        return;
    }

    createOrder({
      type: 'starter_pack',
      items: [],
      plan: plan,
      billingCycle: billingCycle,
      shirtSize: size,
      totalValue: total
    }, {
      onSuccess: (response) => {
        const order = response.data?.order;
        if (order?._id) {
            // Redirecionar para checkout interno
            router.push(`/checkout/${order._id}`);
        } else {
            toast.success('Pedido criado com sucesso!');
            router.push('/home');
        }
      }
    });
  };

  return (
    <div className="text-white font-sans selection:bg-[#eeff00] selection:text-black pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        
        {/* Left Column: Product Info */}
        <div className="lg:col-span-7 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Button 
              variant="ghost" 
              onClick={handleBack}
              disabled={isPending || isGoingBack}
              className="mb-4 text-zinc-400 hover:text-white pl-0"
            >
               {isGoingBack ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowLeft className="mr-2 h-4 w-4" />}
               Voltar para métricas
            </Button>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eeff00]/10 border border-[#eeff00]/20 text-[#eeff00] text-sm font-bold mb-6">
              <Star className="w-4 h-4 fill-current" />
              Oferta de Boas-vindas
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[0.9]">
              STARTER <br />
              <span className="text-[#eeff00]">
                PACK
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-lg leading-relaxed">
              Tudo o que você precisa para começar sua jornada na corrida com o pé direito. Equipamento oficial e acesso à plataforma.
            </p>
          </motion.div>

          {/* Kit Visual Representation (Placeholder for Image) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="aspect-video bg-zinc-900 rounded-3xl border border-white/10 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#eeff00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />

            <div className="absolute inset-0 flex items-center justify-center p-2">
               <img 
                  src="/kit.png" 
                  alt="Starter Pack - Kit Hack Running" 
                  className="w-full h-full object-contain"
               />
            </div>
          </motion.div>

          {/* Detailed List */}
          <div className="space-y-6">
             <div className="flex items-center gap-2 text-sm text-zinc-500 font-bold uppercase tracking-wider">
                <Package className="w-4 h-4" />
                <span>Conteúdo do Kit</span>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Destaque para a Camiseta */}
                <div className="sm:col-span-2 p-5 rounded-3xl bg-gradient-to-r from-[#eeff00]/10 to-transparent border border-[#eeff00]/20 flex flex-col sm:flex-row items-start sm:items-center gap-5 group hover:border-[#eeff00]/40 transition-all">
                   <div className="w-16 h-16 rounded-2xl bg-[#eeff00] flex items-center justify-center text-black shadow-[0_0_20px_rgba(238,255,0,0.2)] shrink-0">
                      <Shirt className="w-8 h-8" strokeWidth={2.5} fill="currentColor" />
                   </div>
                   <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-xl text-white">Camiseta Oficial Hack</h4>
                      </div>
                      <p className="text-zinc-300 text-sm">Tecido tecnológico Dry-Fit, corte atlético e proteção UV. A armadura oficial do corredor Hack.</p>
                   </div>
                </div>

                {/* Outros itens em Grid */}
                {KIT_ITEMS.slice(1).map((item, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center gap-4 hover:bg-zinc-900/60 hover:border-white/10 transition-all group">
                     <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center text-zinc-400 group-hover:text-[#eeff00] group-hover:bg-[#eeff00]/10 transition-colors shrink-0">
                       <item.icon className="w-6 h-6" />
                     </div>
                     <div>
                       <h4 className="font-bold text-white leading-tight mb-1">{item.text}</h4>
                       <p className="text-xs text-zinc-500">{item.subtext}</p>
                     </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Checkout Form */}
        <div className="lg:col-span-5 relative">
           <div className="sticky top-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
              >
                {/* Glow effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#eeff00] rounded-full blur-[120px] opacity-5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  Configure seu plano
                </h3>

                {/* Billing Cycle Switch */}
                <div className="flex bg-black p-1.5 rounded-xl mb-8 relative border border-white/5">
                   <div 
                      className="absolute inset-y-1.5 rounded-lg bg-zinc-800 transition-all duration-300 ease-out"
                      style={{ 
                        left: billingCycle === 'MONTHLY' ? '6px' : '50%', 
                        width: 'calc(50% - 6px)' 
                      }}
                   />
                   <button 
                      onClick={() => setBillingCycle('MONTHLY')}
                      className={cn(
                        "flex-1 py-3 text-sm font-bold text-center relative z-10 transition-colors duration-300",
                        billingCycle === 'MONTHLY' ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                      )}
                   >
                      Mensal
                   </button>
                   <button 
                      onClick={() => setBillingCycle('QUARTERLY')}
                      className={cn(
                        "flex-1 py-3 text-sm font-bold text-center relative z-10 transition-colors duration-300 flex items-center justify-center gap-2",
                        billingCycle === 'QUARTERLY' ? "text-[#eeff00]" : "text-zinc-500 hover:text-zinc-300"
                      )}
                   >
                      Trimestral
                      <span className="text-[10px] bg-[#eeff00] text-black px-1.5 py-0.5 rounded font-black tracking-tight">
                        KIT GRÁTIS
                      </span>
                   </button>
                </div>

                {/* Plan Selection */}
                <RadioGroup value={plan} onValueChange={setPlan} className="space-y-4 mb-8">
                  {Object.values(PLANS).map((p) => {
                     // Lógica de preço dinâmica para display no card
                     let currentKitPrice = 120;
                     let displayPrice = p.price;
                     let isPromo = false;

                     if (p.id !== 'free') {
                        if (billingCycle === 'QUARTERLY') {
                            currentKitPrice = 0;
                            isPromo = true;
                        } else {
                            currentKitPrice = 60;
                            isPromo = true;
                        }
                     }

                     const isSelected = plan === p.id;

                     return (
                        <div 
                           key={p.id}
                           onClick={() => setPlan(p.id)}
                           className={cn(
                              "relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 group",
                              isSelected 
                                ? "border-[#eeff00] bg-[#eeff00]/5" 
                                : "border-zinc-800 bg-black/40 hover:border-zinc-700"
                           )}
                        >
                           {p.id === 'pro' && (
                              <div className="absolute -top-3 right-4 bg-[#eeff00] text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wide">
                                 Mais Escolhido
                              </div>
                           )}

                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-3">
                                 <RadioGroupItem value={p.id} id={p.id} className="border-white/20 text-[#eeff00]" />
                                 <div>
                                    <span className={cn("block font-bold text-lg", isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200")}>
                                       {p.name}
                                    </span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className={cn("block font-bold text-lg", isSelected ? "text-[#eeff00]" : "text-white")}>
                                    {p.price === 0 ? 'Grátis' : `R$ ${p.price.toFixed(0)}`}
                                    <span className="text-sm text-zinc-500 font-normal">/mês</span>
                                 </span>
                              </div>
                           </div>
                           
                           <div className="pl-8">
                               <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-2">
                                  {p.id === 'free' ? (
                                    <span>Kit por <span className="text-white">R$ 120,00</span></span>
                                  ) : (
                                    <>
                                       <span>Kit:</span>
                                       {isPromo ? (
                                          <span className="text-[#eeff00] bg-[#eeff00]/10 px-1.5 rounded">
                                             {currentKitPrice === 0 ? 'GRÁTIS' : `R$ ${currentKitPrice},00`}
                                          </span>
                                       ) : (
                                          <span>R$ 120,00</span>
                                       )}
                                       {isPromo && <span className="line-through opacity-50">R$ 120,00</span>}
                                    </>
                                  )}
                               </div>
                               
                               {/* Mini features */}
                               <div className="flex flex-wrap gap-2 mt-3">
                                  {p.features.slice(0, 2).map((feat, i) => (
                                     <span key={i} className="text-[10px] bg-white/5 text-zinc-300 px-2 py-1 rounded border border-white/5">
                                        {feat}
                                     </span>
                                  ))}
                                  {p.features.length > 2 && (
                                     <span className="text-[10px] text-zinc-500 py-1">+{p.features.length - 2}</span>
                                  )}
                               </div>
                           </div>
                        </div>
                     );
                  })}
                </RadioGroup>

                {/* Informação sobre Renovação */}
                {plan !== 'free' && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                      <div className="text-sm space-y-2">
                        <p className="text-blue-400 font-bold">Como funciona a renovação?</p>
                        <div className="text-zinc-300 space-y-1">
                          <p><strong className="text-white">💳 Cartão de Crédito:</strong> Renovação automática. Cobraremos automaticamente no vencimento.</p>
                          <p><strong className="text-white">🔔 PIX/Boleto:</strong> Você receberá uma notificação e precisará realizar o pagamento manualmente a cada período.</p>
                        </div>
                        <p className="text-zinc-500 text-xs mt-2">
                          Você pode cancelar sua assinatura a qualquer momento antes da próxima cobrança.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                <div 
                   id="size-selector"
                   className={cn(
                      "mb-8 p-4 rounded-2xl bg-black/40 border transition-all duration-300",
                      showSizeError && !size 
                         ? "border-red-500/50 bg-red-500/5" 
                         : "border-white/5"
                   )}
                >
                   <Label className="text-zinc-400 text-[10px] mb-2 uppercase tracking-wider font-bold block flex items-center gap-2">
                      Tamanho da Camiseta Oficial
                      <span className="text-red-500">*</span>
                   </Label>
                   <Select 
                      value={size}
                      onValueChange={(value) => {
                         setSize(value);
                         setShowSizeError(false);
                      }}
                   >
                       <SelectTrigger 
                          className={cn(
                             "h-12 bg-black rounded-xl text-white focus:ring-[#eeff00]/50 transition-colors",
                             showSizeError && !size
                                ? "border-red-500 hover:border-red-500"
                                : "border-white/10 hover:border-white/20"
                          )}
                       >
                           <SelectValue placeholder="Selecione seu tamanho" />
                       </SelectTrigger>
                       <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                           {['PP', 'P', 'M', 'G', 'GG', 'XG'].map((s) => (
                             <SelectItem key={s} value={s} className="focus:bg-zinc-800 focus:text-white cursor-pointer">{s}</SelectItem>
                           ))}
                       </SelectContent>
                   </Select>
                   {showSizeError && !size && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                         <span>⚠️</span>
                         Por favor, selecione o tamanho da camiseta
                      </p>
                   )}
                </div>

                {/* Summary & Action */}
                <div className="space-y-4 pt-6 border-t border-white/10">
                   {savings > 0 && (
                      <div className="flex items-center justify-between text-sm text-[#eeff00] bg-[#eeff00]/5 p-3 rounded-lg border border-[#eeff00]/20">
                         <span className="flex items-center gap-2 font-bold"><Trophy className="w-4 h-4" /> Você economiza</span>
                         <span className="font-bold">- R$ {savings.toFixed(2).replace('.', ',')}</span>
                      </div>
                   )}

                   <div className="space-y-2">
                      <div className="flex justify-between text-zinc-400 text-sm">
                         <span>Starter Pack</span>
                         <span className={kitPrice === 0 ? 'text-[#eeff00] font-bold' : ''}>
                            {kitPrice === 0 ? 'GRÁTIS' : `R$ ${kitPrice.toFixed(2).replace('.', ',')}`}
                         </span>
                      </div>
                      {plan !== 'free' && (
                         <div className="flex justify-between text-zinc-400 text-sm">
                            <span>Assinatura {PLANS[plan].name} ({billingCycle === 'QUARTERLY' ? '3 meses' : '1 mês'})</span>
                            <span>R$ {planPrice.toFixed(2).replace('.', ',')}</span>
                         </div>
                      )}
                      
                      <div className="flex justify-between items-end pt-2">
                        <span className="text-white font-bold">Total a pagar</span>
                        <div className="text-right">
                           <span className="block text-3xl font-black text-white leading-none">
                              R$ {total.toFixed(2).replace('.', ',')}
                           </span>
                           {billingCycle === 'QUARTERLY' && plan !== 'free' && (
                              <span className="text-xs text-zinc-500">Cobranças trimestrais</span>
                           )}
                           {billingCycle === 'MONTHLY' && plan !== 'free' && (
                              <span className="text-xs text-zinc-500">Cobranças mensais</span>
                           )}
                        </div>
                      </div>
                   </div>

                   <Button 
                      className="w-full h-16 bg-[#eeff00] hover:bg-[#eeff00]/90 text-black font-black text-lg rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(238,255,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-4"
                      onClick={handleBuy}
                      disabled={isPending}
                   >
                      {isPending ? (
                         <div className="flex items-center gap-2">
                            <Loader2 className="animate-spin w-5 h-5" />
                            Processando...
                         </div>
                      ) : (
                         <div className="flex items-center gap-2">
                            GARANTIR MEU KIT
                            <ArrowRight className="w-5 h-5" />
                         </div>
                      )}
                   </Button>
                   
                   <p className="text-center text-xs text-zinc-600 flex items-center justify-center gap-1.5 mt-4">
                      <ShieldCheck className="w-3 h-3" />
                      Pagamento 100% seguro via Asaas
                   </p>
                </div>
              </motion.div>
           </div>
        </div>
      </div>
    </div>
  );
}
