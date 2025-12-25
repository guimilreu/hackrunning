'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEvent, useConfirmPresence, useCancelConfirmation } from '@/hooks/useEvents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, MapPin, ExternalLink, Trophy, Users, Clock, Route, Share2, Check, Loader2 } from 'lucide-react';
import { EventMap } from '@/components/ui/event-map';
import { safeFormatDate } from '@/lib/utils/date';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export default function RaceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: race, isLoading } = useEvent(id);
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

  if (!race) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-white">Prova não encontrada</h2>
        <Button onClick={() => router.back()} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const isConfirmed = race.participants?.some(p => {
    // Check if participant is the user (handling both populated object and string ID)
    const participantId = typeof p === 'object' ? p._id?.toString() : p?.toString();
    return participantId === user?._id?.toString();
  }) || race.confirmed?.some(p => {
     const confirmedId = typeof p === 'object' ? p._id?.toString() : p?.toString();
     return confirmedId === user?._id?.toString();
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
    if (p.user?.name) return p.user.name;
    if (p.name) return p.name;
    if (p.firstName) return `${p.firstName} ${p.lastName || ''}`;
    return 'Runner';
  };

  const getParticipantPhoto = (p) => {
    return p.user?.photo || p.photo || p.profilePhoto;
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
            Voltar para Eventos
        </Button>
        <Button variant="outline" size="icon" className="rounded-full border-white/10 text-zinc-400">
            <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* Cover / Title Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-white/5 aspect-video sm:aspect-[21/9] flex items-end group">
                {race.image ? (
                    <>
                        <Image
                            src={race.image}
                            alt={race.name}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    </>
                ) : (
                    <>
                         <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-5" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                    </>
                )}
                
                <div className="relative z-10 p-6 md:p-8 w-full">
                    <div className="flex items-center gap-3 mb-4">
                        <Badge className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold px-3">
                            <Trophy className="w-3 h-3 mr-1" />
                            PROVA
                        </Badge>
                         {race.date && (
                            <Badge variant="outline" className="border-white/20 text-white font-bold backdrop-blur-md">
                                {safeFormatDate(race.date, "MMM yyyy").toUpperCase()}
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                        {race.name}
                    </h1>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="glass-card p-4 rounded-2xl border-white/5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-yellow-500 shrink-0">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Data</p>
                        <p className="font-bold text-white">
                            {race.date ? safeFormatDate(race.date, "EEEE, dd 'de' MMMM") : 'A definir'}
                        </p>
                        <p className="text-sm text-zinc-400">
                             {race.time ? (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {race.time}
                                </span>
                             ) : '--:--'}
                        </p>
                    </div>
                 </div>
                 
                 <div className="glass-card p-4 rounded-2xl border-white/5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-yellow-500 shrink-0">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Local</p>
                        <p className="font-bold text-white break-words">
                            {race.location?.address || (typeof race.location === 'string' ? race.location : 'A definir')}
                        </p>
                        {race.location?.city && (
                            <p className="text-sm text-zinc-400">
                                {race.location.city}{race.location.state ? `, ${race.location.state}` : ''}
                            </p>
                        )}
                    </div>
                 </div>
            </div>

             {/* Distances */}
             {race.distances && race.distances.length > 0 && (
                <div className="glass-card p-6 rounded-2xl border-white/5">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Route className="h-4 w-4" />
                        Distâncias
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {race.distances.map((distance, index) => (
                        <Badge
                            key={index}
                            className="bg-zinc-800 text-white hover:bg-zinc-700 border-0 px-4 py-2 text-base font-bold rounded-lg transition-colors"
                        >
                            {distance}
                        </Badge>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Sobre a Prova</h3>
                <div className="text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-900/30 p-6 rounded-2xl border border-white/5">
                    {race.description || "Sem descrição disponível."}
                </div>
            </div>

            {/* Participants Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Quem da equipe vai
                        <span className="text-sm font-normal text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">
                            {race.participants?.length || 0}
                        </span>
                    </h3>
                </div>

                {race.participants && race.participants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {race.participants.map((participant, index) => {
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
                                            {name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-white text-sm hover:text-primary transition-colors">{name}</p>
                                        <p className="text-xs text-zinc-500">Vai participar</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-zinc-900/20 rounded-2xl border border-white/5 border-dashed">
                        <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-500">Nenhum membro confirmou presença ainda.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column - Sticky Action Card */}
        <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
                <div className="glass-card p-6 rounded-3xl border-yellow-500/20 bg-zinc-900/80 backdrop-blur-xl shadow-xl shadow-black/50 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <h3 className="font-bold text-lg text-white mb-2 relative z-10">Inscrição</h3>
                    <p className="text-zinc-400 text-sm mb-6 relative z-10">
                        {race.externalLink 
                            ? "Acesse o site oficial para realizar sua inscrição na prova." 
                            : "Marque sua presença para organizarmos a tenda da equipe."}
                    </p>

                    <div className="space-y-3 relative z-10">
                         {race.externalLink && (
                            <Button
                                className="w-full bg-white text-black font-bold hover:bg-zinc-200 h-12 rounded-xl"
                                onClick={() => window.open(race.externalLink, '_blank')}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Site da Inscrição
                            </Button>
                         )}

                         {isConfirmed ? (
                            <Button
                                className="w-full bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 h-12 rounded-xl font-bold cursor-pointer"
                                onClick={() => setCancelDialogOpen(true)}
                            >
                                <Check className="mr-2 h-5 w-5" />
                                Vou participar
                            </Button>
                         ) : (
                            <Button
                                variant={race.externalLink ? "outline" : "default"}
                                className={`w-full h-12 rounded-xl font-bold ${!race.externalLink ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'border-white/10 hover:bg-white/5 text-zinc-300'}`}
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
                                        {race.externalLink ? 'Já me inscrevi, vou ir!' : 'Confirmar Presença'}
                                    </>
                                )}
                            </Button>
                         )}
                    </div>
                    
                    {isConfirmed && (
                         <p className="text-xs text-center text-zinc-500 mt-4 relative z-10">
                            Não esqueça de retirar seu kit com a organização.
                        </p>
                    )}
                </div>

                {/* Additional Info / Maps */}
                <div className="bg-zinc-900/30 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 text-zinc-400 mb-2">
                         <MapPin className="w-4 h-4" />
                         <span className="text-sm font-bold">Localização da Largada</span>
                    </div>
                    {race.location?.coordinates?.lat && race.location?.coordinates?.lng ? (
                        <div className="w-full h-64 rounded-xl overflow-hidden">
                            <EventMap
                                lat={race.location.coordinates.lat}
                                lng={race.location.coordinates.lng}
                                name={race.name}
                                address={race.location.address ? `${race.location.address}, ${race.location.city}, ${race.location.state}` : ''}
                                zoom={14}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-32 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 text-xs">
                            Mapa Indisponível
                        </div>
                    )}
                    {race.location?.address && (
                        <Button 
                            variant="link" 
                            className="w-full text-zinc-400 hover:text-white mt-2 h-auto py-0 text-xs"
                            onClick={() => {
                                const address = `${race.location.address}, ${race.location.city}, ${race.location.state}`;
                                window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                            }}
                        >
                            Abrir no Google Maps
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
              Tem certeza que deseja cancelar sua presença nesta prova? Você pode confirmar novamente depois.
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
              variant="outline"
              className="border-red-500/20 text-red-500 hover:bg-red-500/10"
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
