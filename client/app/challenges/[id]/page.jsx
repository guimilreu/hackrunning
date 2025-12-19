'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParticipateChallenge } from '@/hooks/useEvents';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Trophy, Calendar, Target, Flame, Timer, Users, Award, Share2, Check, Loader2, Play, ExternalLink } from 'lucide-react';
import { safeFormatDate } from '@/lib/utils/date';
import { differenceInDays } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import Image from 'next/image';

const useChallenge = (id) => {
  return useQuery({
    queryKey: ['challenge', id],
    queryFn: async () => {
      const response = await api.get(`/challenges/${id}`);
      // Backend retorna { success: true, data: { challenge, userStatus } }
      const data = response.data?.data || response.data;
      const challenge = data?.challenge || data;
      
      if (!challenge || (response.data?.success === false)) {
        return null;
      }
      
      // Retorna o challenge com userStatus embutido se disponível
      return {
        ...challenge,
        userStatus: data?.userStatus
      };
    },
    enabled: !!id,
  });
};

export default function ChallengeDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: challenge, isLoading } = useChallenge(id);
  const { mutate: participate, isPending: isParticipatingPending } = useParticipateChallenge();

  // Debug temporário
  if (challenge) {
    console.log('Challenge Data:', challenge);
    console.log('User:', user);
  }

  if (isLoading) {
    return (
      <div className="space-y-8 pb-10">
        <Skeleton className="h-12 w-48 bg-white/5 rounded-2xl" />
        <Skeleton className="h-96 w-full bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold text-white">Desafio não encontrado</h2>
        <Button onClick={() => router.back()} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const participation = challenge.participants?.find(p => p.userId === user?._id);
  const isParticipating = !!participation;
  const daysLeft = challenge.endDate ? differenceInDays(new Date(challenge.endDate), new Date()) : 0;
  const isEnded = daysLeft < 0;

  let progress = 0;
  let progressText = '';
  if (isParticipating) {
    if (challenge.criteria?.minKm) {
      progress = Math.min((participation.progress?.km || 0) / challenge.criteria.minKm * 100, 100);
      progressText = `${(participation.progress?.km || 0).toFixed(1)}/${challenge.criteria.minKm} km`;
    } else if (challenge.criteria?.minWorkouts) {
      progress = Math.min((participation.progress?.workouts || 0) / challenge.criteria.minWorkouts * 100, 100);
      progressText = `${participation.progress?.workouts || 0}/${challenge.criteria.minWorkouts} treinos`;
    }
  }

  const handleParticipate = () => {
    participate({ challengeId: id }, {
      onSuccess: () => {
        // Força recarregar os dados do desafio
        queryClient.invalidateQueries({ queryKey: ['challenge', id] });
      }
    });
  };

  const getParticipantName = (p) => {
    // Se userId foi populado pelo backend
    if (p.userId?.name) return p.userId.name;
    if (p.userId?.firstName) return `${p.userId.firstName} ${p.userId.lastName || ''}`.trim();
    // Fallback
    if (p.name) return p.name;
    return 'Atleta';
  };

  const getParticipantPhoto = (p) => {
    return p.userId?.profilePhoto || p.userId?.photo || p.photo;
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
            Voltar para Desafios
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
                {challenge.image ? (
                    <>
                        <Image
                            src={challenge.image}
                            alt={challenge.name}
                            fill
                            className="object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    </>
                ) : (
                    <>
                         <div className="absolute inset-0 bg-[url('/patterns/topography.svg')] opacity-5" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                         {/* Fallback visual element */}
                         <div className="absolute top-0 right-0 p-24 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    </>
                )}
                
                <div className="relative z-10 p-6 md:p-8 w-full">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <Badge className="bg-primary text-black hover:bg-primary/90 font-bold px-3">
                            <Trophy className="w-3 h-3 mr-1" />
                            DESAFIO
                        </Badge>
                        <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 font-bold backdrop-blur-md">
                           +{challenge.bonusPoints} PONTOS
                        </Badge>
                        <div className={`flex items-center text-xs font-bold px-3 py-1 rounded-full border border-white/5 backdrop-blur-md ${isEnded ? 'bg-red-500/20 text-red-500' : 'bg-black/40 text-zinc-300'}`}>
                            <Timer className="w-3 h-3 mr-1.5" />
                            {isEnded ? 'ENCERRADO' : `${daysLeft} DIAS RESTANTES`}
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 leading-tight drop-shadow-lg">
                        {challenge.name}
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
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Período</p>
                        <p className="font-bold text-white">
                            {challenge.startDate && challenge.endDate 
                                ? `${safeFormatDate(challenge.startDate, "dd MMM")} - ${safeFormatDate(challenge.endDate, "dd MMM, yyyy")}`
                                : 'A definir'}
                        </p>
                    </div>
                 </div>
                 
                 <div className="glass-card p-4 rounded-2xl border-white/5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0">
                        <Target className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-1">Objetivo</p>
                        <p className="font-bold text-white">
                            {challenge.criteria?.minKm ? `${challenge.criteria.minKm} km de corrida` : 
                             challenge.criteria?.minWorkouts ? `${challenge.criteria.minWorkouts} treinos concluídos` : 'Completar o desafio'}
                        </p>
                    </div>
                 </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Sobre o Desafio</h3>
                <div className="text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-900/30 p-6 rounded-2xl border border-white/5">
                    {challenge.description || "Sem descrição disponível."}
                </div>
            </div>

            {/* Rewards */}
            {challenge.rules && challenge.rules.length > 0 && (
                <div className="space-y-4">
                     <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" />
                        Regras & Recompensas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {challenge.rules.map((rule, index) => (
                            <div key={index} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
                                <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                                    <Award className="h-4 w-4" />
                                </div>
                                <span className="font-bold text-white text-sm">{rule}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Participants Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        Participantes
                        <span className="text-sm font-normal text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md">
                            {challenge.participants?.length || 0}
                        </span>
                    </h3>
                </div>

                {challenge.participants && challenge.participants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {challenge.participants.slice(0, 10).map((participant, index) => { // Limitando a 10 para não ficar gigante
                            const name = getParticipantName(participant);
                            const photo = getParticipantPhoto(participant);
                            
                            return (
                                <div 
                                    key={participant._id || index} 
                                    className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800/40 transition-colors"
                                >
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={photo} />
                                        <AvatarFallback className="bg-zinc-800 text-xs font-bold text-zinc-400">
                                            {name?.[0]?.toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-white text-sm truncate">{name}</p>
                                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                                            {participant.userId === user?._id ? (
                                                <span className="text-primary">Você</span>
                                            ) : (
                                                'Participante'
                                            )}
                                        </p>
                                    </div>
                                    {participant.completed && (
                                        <div className="h-6 w-6 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center">
                                            <Check className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {challenge.participants.length > 10 && (
                            <div className="col-span-full text-center py-2">
                                <p className="text-sm text-zinc-500">E mais {challenge.participants.length - 10} participantes...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-zinc-900/20 rounded-2xl border border-white/5 border-dashed">
                        <Users className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-500">Seja o primeiro a participar!</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column - Sticky Action Card */}
        <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
                <div className="glass-card p-6 rounded-3xl border-primary/20 bg-zinc-900/80 backdrop-blur-xl shadow-xl shadow-black/50 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <h3 className="font-bold text-lg text-white mb-4 relative z-10 flex items-center gap-2">
                        {isParticipating ? (
                            <>
                                <Flame className="w-5 h-5 text-orange-500" />
                                Seu Progresso
                            </>
                        ) : (
                            'Sua Missão'
                        )}
                    </h3>

                    {isParticipating ? (
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-end">
                                <span className="text-3xl font-bold text-white">{Math.round(progress)}%</span>
                                <span className="text-sm font-medium text-zinc-400 mb-1">{progressText}</span>
                            </div>
                            <Progress value={progress} className="h-3 bg-zinc-800" indicatorClassName="bg-gradient-to-r from-orange-500 to-primary" />
                            
                            {progress >= 100 ? (
                                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-bold flex items-center justify-center gap-2">
                                    <Trophy className="w-4 h-4" />
                                    Desafio Concluído!
                                </div>
                            ) : (
                                <p className="text-xs text-zinc-500 mt-2">
                                    Continue treinando para completar o desafio e ganhar seus pontos!
                                </p>
                            )}

                             <Button
                                className="w-full mt-4 bg-white/5 text-zinc-300 hover:bg-white/10 h-12 rounded-xl font-bold cursor-default"
                                variant="outline"
                            >
                                <Check className="mr-2 h-5 w-5 text-primary" />
                                Participando
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 relative z-10">
                            <p className="text-zinc-400 text-sm">
                                Aceite este desafio para testar seus limites e ganhar recompensas exclusivas.
                            </p>

                            <Button
                                className={`w-full h-12 rounded-xl font-bold ${isEnded ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-primary text-black hover:bg-primary/90'}`}
                                onClick={handleParticipate}
                                disabled={isParticipatingPending || isEnded}
                            >
                                {isParticipatingPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Entrando...
                                    </>
                                ) : isEnded ? (
                                    'Desafio Encerrado'
                                ) : (
                                    <>
                                        <Play className="mr-2 h-4 w-4 fill-current" />
                                        Aceitar Desafio
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Tip Card */}
                {!isParticipating && !isEnded && (
                    <div className="bg-zinc-900/30 rounded-2xl p-5 border border-white/5">
                        <div className="flex items-center gap-2 text-primary mb-2">
                             <Flame className="w-4 h-4" />
                             <span className="text-sm font-bold">Dica do Coach</span>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Mantenha a consistência nos treinos. Não tente fazer tudo de uma vez. Divida o objetivo em metas menores semanais.
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </motion.div>
  );
}
