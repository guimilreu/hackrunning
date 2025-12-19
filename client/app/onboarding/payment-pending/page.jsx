'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Loader2, CheckCircle2, Clock, QrCode, FileText,
  AlertCircle, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function PaymentPendingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [timeWaiting, setTimeWaiting] = useState(0);

  // Buscar status do pedido pendente
  const { data: orderData, isLoading, refetch } = useQuery({
    queryKey: ['pending-order'],
    queryFn: async () => {
      const response = await api.get('/orders/my-pending-order');
      return response.data.data.order;
    },
    refetchInterval: 5000, // Verificar a cada 5 segundos
    retry: 3
  });

  const order = orderData;

  // Contador de tempo esperando
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeWaiting(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Redirecionar se pagamento foi confirmado
  useEffect(() => {
    if (order?.payment?.status === 'paid') {
      router.push('/onboarding/success');
    }
  }, [order?.payment?.status, router]);

  // Se não há pedido pendente, redirecionar para home
  useEffect(() => {
    if (!isLoading && !order) {
      router.push('/home');
    }
  }, [isLoading, order, router]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPaymentMethodInfo = () => {
    if (!order?.payment?.method) return null;

    const methods = {
      PIX: {
        icon: QrCode,
        name: 'PIX',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        description: 'Aguardando confirmação do pagamento via PIX'
      },
      BOLETO: {
        icon: FileText,
        name: 'Boleto Bancário',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        description: 'Aguardando confirmação do pagamento do boleto'
      }
    };

    return methods[order.payment.method] || null;
  };

  const paymentInfo = getPaymentMethodInfo();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-zinc-400">Carregando informações...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return null; // Vai redirecionar via useEffect
  }

  const PaymentIcon = paymentInfo?.icon || Clock;

  return (
    <div className="min-h-screen bg-background text-white flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Logo */}
          <div className="text-center">
            <img src="/logo.png" alt="Hack Running" className="h-8 mx-auto object-contain mb-8" />
          </div>

          {/* Card Principal */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="text-center space-y-6">
              {/* Ícone animado */}
              <div className={`w-24 h-24 mx-auto rounded-full ${paymentInfo?.bgColor} border ${paymentInfo?.borderColor} flex items-center justify-center`}>
                <PaymentIcon className={`w-12 h-12 ${paymentInfo?.color} animate-pulse`} />
              </div>

              {/* Título */}
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-black">
                  Aguardando Pagamento
                </h1>
                <p className="text-zinc-400 text-lg">
                  {paymentInfo?.description}
                </p>
              </div>

              {/* Timer */}
              <div className="py-6">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-800/50 rounded-xl border border-white/10">
                  <Clock className="w-5 h-5 text-zinc-400" />
                  <div className="text-left">
                    <p className="text-xs text-zinc-500">Tempo aguardando</p>
                    <p className="text-2xl font-bold font-mono text-white">
                      {formatTime(timeWaiting)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading spinner */}
              <div className="flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>

              {/* Informações */}
              <div className={`${paymentInfo?.bgColor} border ${paymentInfo?.borderColor} rounded-2xl p-6 text-left`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 ${paymentInfo?.color} mt-0.5 shrink-0`} />
                  <div className="space-y-3 text-sm">
                    <p className={`${paymentInfo?.color} font-bold`}>
                      O que está acontecendo?
                    </p>
                    <div className="text-zinc-300 space-y-2">
                      {order.payment.method === 'PIX' && (
                        <>
                          <p>• Estamos aguardando a confirmação do seu pagamento via PIX</p>
                          <p>• A confirmação geralmente é instantânea, mas pode levar alguns minutos</p>
                          <p>• Você não precisa fazer nada, esta página atualizará automaticamente</p>
                          <p>• Se já pagou, aguarde a confirmação do banco</p>
                        </>
                      )}
                      {order.payment.method === 'BOLETO' && (
                        <>
                          <p>• Estamos aguardando a confirmação do pagamento do boleto</p>
                          <p>• Boletos podem levar de 1 a 3 dias úteis para serem confirmados</p>
                          <p>• Você não precisa fazer nada, esta página atualizará automaticamente</p>
                          <p>• Após pagar, aguarde o processamento bancário</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="w-full border-white/10 hover:bg-white/5"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Verificar Status Agora
                </Button>

                <Button
                  onClick={() => router.push(`/checkout/${order._id}`)}
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-white"
                >
                  Ver Detalhes do Pagamento
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Informação adicional */}
              <p className="text-xs text-zinc-500 pt-4 border-t border-white/10">
                Esta página verifica automaticamente o status do pagamento a cada 5 segundos.
                <br />
                Você pode fechar e voltar depois - o app irá redirecionar você para cá até o pagamento ser confirmado.
              </p>
            </div>
          </div>

          {/* Card de ajuda */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#eeff00]" />
              Precisa de Ajuda?
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              Se você está com dificuldades ou tem dúvidas sobre o pagamento, entre em contato conosco:
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-zinc-300">
                📧 Email: <a href="mailto:suporte@hackrunning.com.br" className="text-[#eeff00] hover:underline">suporte@hackrunning.com.br</a>
              </p>
              <p className="text-zinc-300">
                💬 WhatsApp: <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="text-[#eeff00] hover:underline">(11) 99999-9999</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
