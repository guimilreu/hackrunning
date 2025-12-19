'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, QrCode, Calendar, CheckCircle, Clock, XCircle, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { safeFormatDate } from '@/lib/utils/date';
import { motion } from 'framer-motion';
import Image from 'next/image';

const useRedemptions = (status) => {
  return useQuery({
    queryKey: ['redemptions', status],
    queryFn: async () => {
      const params = status && status !== 'all' ? `?status=${status}` : '';
      const response = await api.get(`/redemptions${params}`);
      return response.data?.data?.redemptions || response.data?.redemptions || response.data || [];
    },
  });
};

const useRedemptionQRCode = (redemptionId) => {
  return useQuery({
    queryKey: ['redemptionQRCode', redemptionId],
    queryFn: async () => {
      const response = await api.get(`/redemptions/${redemptionId}/qrcode`);
      return response.data?.data?.qrcode || response.data?.qrcode;
    },
    enabled: !!redemptionId,
  });
};

export default function MyRedemptionsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: redemptions, isLoading } = useRedemptions(statusFilter);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-orange-500/20 text-orange-400 border-orange-500/20', icon: Clock },
      approved: { label: 'Aprovado', className: 'bg-blue-500/20 text-blue-400 border-blue-500/20', icon: CheckCircle },
      delivered: { label: 'Entregue', className: 'bg-green-500/20 text-green-400 border-green-500/20', icon: CheckCircle },
      cancelled: { label: 'Cancelado', className: 'bg-red-500/20 text-red-400 border-red-500/20', icon: XCircle },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-white">Meus Resgates</h1>
          <p className="text-zinc-400 mt-2">Acompanhe seus resgates e apresente seus códigos.</p>
        </div>
        <Link href="/app/store">
          <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Loja
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-12 bg-zinc-900/50 border-white/10 rounded-full text-zinc-300">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="approved">Aprovado</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-3xl bg-white/5" />
          ))
        ) : !redemptions || redemptions.length === 0 ? (
          <motion.div
            variants={item}
            className="glass-card rounded-3xl p-12 text-center flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white">Nenhum resgate encontrado</h3>
            <p className="text-zinc-400 mt-2">
              {statusFilter !== 'all' 
                ? 'Não há resgates com este status.' 
                : 'Você ainda não realizou nenhum resgate.'}
            </p>
            {statusFilter === 'all' && (
              <Link href="/app/store" className="mt-6">
                <Button className="bg-primary text-black font-bold hover:bg-primary/90 rounded-full">
                  Explorar Loja
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          redemptions.map((redemption) => {
            const statusConfig = getStatusBadge(redemption.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div variants={item} key={redemption._id}>
                <div className="glass-card rounded-3xl p-6 hover:border-primary/30 transition-all duration-300">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Product Image */}
                    {redemption.product?.image && (
                      <div className="relative w-full md:w-32 h-32 rounded-2xl overflow-hidden bg-zinc-900 shrink-0">
                        <Image
                          src={redemption.product.image}
                          alt={redemption.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white mb-2">
                            {redemption.product?.name || 'Produto'}
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Resgatado em {redemption.createdAt ? safeFormatDate(redemption.createdAt, "dd 'de' MMMM 'de' yyyy 'às' HH:mm") : 'Data não disponível'}
                          </p>
                        </div>
                        <Badge className={`${statusConfig.className} border shrink-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>

                      {/* Redemption Code */}
                      {redemption.code && (
                        <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Código de Resgate</p>
                              <p className="text-lg font-bold text-primary font-mono tracking-wider">
                                {redemption.code}
                              </p>
                            </div>
                            {redemption.status === 'approved' && (
                              <QRCodeButton redemptionId={redemption._id} code={redemption.code} />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Points Used */}
                      {redemption.pointsUsed && redemption.pointsUsed.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-zinc-500 mb-2">Pontos Utilizados</p>
                          <div className="flex flex-wrap gap-2">
                            {redemption.pointsUsed.map((point, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-white/10">
                                {point.points} pts ({point.date ? safeFormatDate(point.date, 'dd/MM/yyyy') : 'N/A'})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delivery Info */}
                      {redemption.status === 'delivered' && redemption.deliveredAt && (
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>Entregue em {redemption.deliveredAt ? safeFormatDate(redemption.deliveredAt, "dd 'de' MMMM 'de' yyyy") : 'Data não disponível'}</span>
                        </div>
                      )}

                      {/* Cancel Button */}
                      {redemption.status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
                            onClick={async () => {
                              if (confirm('Tem certeza que deseja cancelar este resgate?')) {
                                try {
                                  await api.post(`/redemptions/${redemption._id}/cancel`);
                                  window.location.reload();
                                } catch (error) {
                                  alert('Erro ao cancelar resgate');
                                }
                              }
                            }}
                          >
                            Cancelar Resgate
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}

function QRCodeButton({ redemptionId, code }) {
  const { data: qrcode, isLoading } = useRedemptionQRCode(redemptionId);
  const [showQR, setShowQR] = useState(false);

  const downloadQRCode = () => {
    if (!qrcode) return;
    const link = document.createElement('a');
    link.href = qrcode;
    link.download = `resgate-${code}.png`;
    link.click();
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="border-primary/20 hover:bg-primary/10 text-primary shrink-0"
        onClick={() => setShowQR(true)}
      >
        <QrCode className="h-4 w-4 mr-2" />
        Ver QR Code
      </Button>

      {showQR && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="glass-card rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4 text-center">Código de Resgate</h3>
            {isLoading ? (
              <Skeleton className="h-64 w-64 mx-auto bg-white/5 rounded-2xl" />
            ) : qrcode ? (
              <div className="space-y-4">
                <div className="relative w-64 h-64 mx-auto bg-white rounded-2xl p-4">
                  <Image src={qrcode} alt="QR Code" fill className="object-contain" />
                </div>
                <p className="text-center text-sm text-zinc-400 font-mono">{code}</p>
                <Button
                  className="w-full bg-primary text-black font-bold hover:bg-primary/90 rounded-xl"
                  onClick={downloadQRCode}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar QR Code
                </Button>
              </div>
            ) : (
              <p className="text-center text-zinc-400">QR Code não disponível</p>
            )}
            <Button
              variant="outline"
              className="w-full mt-4 border-white/20 hover:bg-white hover:text-black"
              onClick={() => setShowQR(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
