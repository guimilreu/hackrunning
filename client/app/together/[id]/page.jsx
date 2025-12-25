'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvent, useConfirmPresence, useCancelConfirmation } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, MapPin, Users, Check, Loader2, Clock, Share2 } from 'lucide-react';
import { EventMap } from '@/components/ui/event-map';
import { safeFormatDate } from '@/lib/utils/date';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TogetherDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: event, isLoading } = useEvent(id);
  const { mutate: confirm, isPending } = useConfirmPresence();
  const { mutate: cancel, isPending: isCancelling } = useCancelConfirmation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-8 pb-10">
        <Skeleton className="h-12 w-48 bg-white/5 rounded-2xl" />
        <Skeleton className="h-96 w-full bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-white">Evento não encontrado</h2>
        <Button onClick={() => router.back()} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const isConfirmed = event.confirmed?.some(p => {
    const confirmedId = typeof p === 'object' ? p._id?.toString() : p?.toString();
    return confirmedId === user?._id?.toString();
  }) || event.participants?.some(p => {
    const participantId = typeof p === 'object' ? p._id?.toString() : p?.toString();
    return participantId === user?._id?.toString();
  });

  const handleConfirm = () => {
    confirm({ eventId: id });
  };

  const handleCancel = () => {
    cancel({ eventId: id }, {
      onSuccess: () => {
        setCancelDialogOpen(false);
      }
    });
  };

  const getParticipantName = (p) => {
    if (!p) return 'Runner';
    if (p.name) return p.name;
    if (p.user?.name) return p.user.name;
    if (p.firstName) {
      const fullName = `${p.firstName}${p.lastName ? ` ${p.lastName}` : ''}`.trim();
      return fullName || 'Runner';
    }
    return 'Runner';
  };

  const getParticipantPhoto = (p) => {
    if (!p) return null;
    return p.photo || p.user?.photo || p.profilePhoto || p.user?.profilePhoto || null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto pb-20 space-y-6"
    >
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="pl-0 hover:pl-2 text-zinc-400 hover:text-white transition-all"
        >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
        </Button>
        <Button variant="outline" size="icon" className="rounded-full border-white/10 text-zinc-400">
            <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Cover / Title Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-white/5 aspect-video sm:aspect-[21/9] flex items-end">
                <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-5" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                
                <div className="relative z-10 p-6 md:p-8 w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-primary text-black hover:bg-primary font-bold px-3">
                            TOGETHER
                        </Badge>
                        {isConfirmed && (
                            <Badge className="bg-green-500/20 text-green-500 border-0 font-bold px-3">
                                <Check className="w-3 h-3 mr-1" /> Confirmado
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight">
                        {event.name}
                    </h1>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="glass-card p-4 rounded-2xl border-white/5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Data</p>
                        <p className="font-bold text-white">
                            {event.date ? safeFormatDate(event.date, "EEEE, dd 'de' MMMM") : 'A definir'}
                        </p>
                        <p className="text-sm text-zinc-400">
                            {event.date ? safeFormatDate(event.date, "HH:mm") + 'h' : '--:--'}
                        </p>
                    </div>
                 </div>
                 
                 <div className="glass-card p-4 rounded-2xl border-white/5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Local</p>
                        <p className="font-bold text-white break-words">
                            {event.location?.address || (typeof event.location === 'string' ? event.location : 'A definir')}
                        </p>
                        {event.location?.city && (
                            <p className="text-sm text-zinc-400">
                                {event.location.city}
                            </p>
                        )}
                    </div>
                 </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Sobre o evento</h3>
                <div className="text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-900/30 p-6 rounded-2xl border border-white/5">
                    {event.description || "Sem descrição disponível."}
                </div>
            </div>

            {/* Participants Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Quem vai
                        <span className="text-sm font-normal text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">
                            {event.confirmed?.length || 0}
                        </span>
                    </h3>
                </div>

                {event.confirmed && event.confirmed.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {event.confirmed.map((participant, index) => {
                            const name = getParticipantName(participant);
                            const photo = getParticipantPhoto(participant);
                            const participantId = participant.userId?._id || participant.userId || participant._id;
                            const isOwnProfile = participantId === user?._id;
                            
                            return (
                                <Link
                                    key={participant._id || index}
                                    href={isOwnProfile ? '/profile' : `/runner/${participantId}`}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/40 transition-colors cursor-pointer"
                                >
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={photo} />
                                        <AvatarFallback className="bg-zinc-800 text-xs font-bold text-zinc-400">
                                            {name?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-white text-sm hover:text-primary transition-colors">{name}</p>
                                        <p className="text-xs text-zinc-500">Confirmado</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-zinc-900/20 rounded-2xl border border-white/5 border-dashed">
                        <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-500">Seja o primeiro a confirmar presença!</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column - Sticky Action Card */}
        <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
                <div className="glass-card p-6 rounded-3xl border-primary/20 bg-zinc-900/80 backdrop-blur-xl shadow-xl shadow-black/50">
                    <h3 className="font-bold text-lg text-white mb-2">Vai participar?</h3>
                    <p className="text-zinc-400 text-sm mb-6">
                        Confirme sua presença para ganhar HPoints e incentivar a equipe!
                    </p>

                    {isConfirmed ? (
                        <div className="space-y-4">
                            <Button
                                className="w-full bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 h-12 rounded-xl font-bold cursor-pointer"
                                onClick={() => setCancelDialogOpen(true)}
                            >
                                <Check className="mr-2 h-5 w-5" />
                                Você vai!
                            </Button>
                            <p className="text-xs text-center text-zinc-500">
                                Estamos te esperando lá! 🚀
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Button
                                className="w-full bg-primary text-black font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 h-12 rounded-xl"
                                onClick={handleConfirm}
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Confirmando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-2 h-5 w-5" />
                                        Confirmar Presença
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-center text-zinc-500">
                                +50 HPoints ao confirmar
                            </p>
                        </div>
                    )}
                </div>

                {/* Additional Info / Maps */}
                <div className="bg-zinc-900/30 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                         <MapPin className="w-4 h-4" />
                         <span className="text-sm font-bold">Localização</span>
                    </div>
                    {event.location?.coordinates?.lat && event.location?.coordinates?.lng ? (
                        <div className="w-full h-64 rounded-xl overflow-hidden">
                            <EventMap
                                lat={event.location.coordinates.lat}
                                lng={event.location.coordinates.lng}
                                name={event.name}
                                address={event.location.address ? `${event.location.address}, ${event.location.city}, ${event.location.state}` : ''}
                                zoom={14}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-32 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-xs">
                            Mapa Indisponível
                        </div>
                    )}
                    {event.location?.address && (
                        <Button 
                            variant="link" 
                            className="w-full text-zinc-400 hover:text-white mt-2 h-auto py-0 text-xs"
                            onClick={() => {
                                const address = `${event.location.address}, ${event.location.city}, ${event.location.state}`;
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                            }}
                        >
                            Abrir no Maps
                        </Button>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Presença?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua presença no Together? Você pode confirmar novamente depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCancelling}
            >
              Não, manter presença
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sim, cancelar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
