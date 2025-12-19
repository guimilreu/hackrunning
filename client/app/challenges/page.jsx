'use client';

import { useChallenges, useParticipateChallenge } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Calendar, Target, Loader2, Play, Flame, Timer, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

export default function ChallengesPage() {
  const { user } = useAuthStore();
  const { data: challenges, isLoading } = useChallenges();
  const { mutate: participate, isPending } = useParticipateChallenge();

  const displayChallenges = challenges || [];

  const handleParticipate = (challengeId) => {
      participate({ challengeId });
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
            <h1 className="text-4xl font-bold tracking-tighter text-white">Desafios</h1>
            <p className="text-zinc-400 mt-2">Vença a si mesmo e conquiste a glória.</p>
        </div>
      </div>

      <motion.div 
        key={`challenges-${isLoading}-${displayChallenges.length}-${displayChallenges?.map(c => c._id).join(',') || ''}`}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2"
      >
        {isLoading ? (
             Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-3xl bg-white/5" />)
        ) : displayChallenges.length === 0 ? (
            <motion.div 
              variants={item}
              className="col-span-full text-center py-20 flex flex-col items-center"
            >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Sem desafios ativos</h3>
                <p className="text-zinc-400">Volte em breve para novas missões.</p>
            </motion.div>
        ) : (
            displayChallenges.map((challenge) => {
                const participation = challenge.participants?.find(p => p.userId === user?._id);
                const isParticipating = !!participation;
                const daysLeft = differenceInDays(new Date(challenge.endDate), new Date());
                
                let progress = 0;
                let progressText = '';
                if (isParticipating) {
                    if (challenge.criteria.minKm) {
                        progress = Math.min((participation.progress.km / challenge.criteria.minKm) * 100, 100);
                        progressText = `${participation.progress.km}/${challenge.criteria.minKm} km`;
                    } else if (challenge.criteria.minWorkouts) {
                         progress = Math.min((participation.progress.workouts / challenge.criteria.minWorkouts) * 100, 100);
                         progressText = `${participation.progress.workouts}/${challenge.criteria.minWorkouts} treinos`;
                    }
                }

                return (
                    <motion.div variants={item} key={challenge._id}>
                        <div className="glass-card rounded-3xl p-8 hover:border-primary/30 transition-all duration-300 relative overflow-hidden group h-full flex flex-col">
                            {/* Background Elements */}
                            <div className="absolute top-0 right-0 p-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[100px] -mr-10 -mt-10 pointer-events-none" />
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <Badge className="bg-primary text-black border-0 px-3 py-1 text-sm font-bold shadow-[0_0_15px_rgba(238,255,0,0.3)]">
                                        +{challenge.bonusPoints} PTS
                                    </Badge>
                                    <div className="flex items-center text-xs font-bold text-zinc-400 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                                        <Timer className="w-3 h-3 mr-1.5" />
                                        {daysLeft} DIAS RESTANTES
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{challenge.name}</h3>
                                    <p className="text-zinc-400 leading-relaxed text-sm">
                                        {challenge.description}
                                    </p>
                                </div>

                                <div className="mt-auto space-y-6">
                                    {isParticipating ? (
                                        <div className="bg-zinc-900/50 p-5 rounded-2xl border border-white/5">
                                            <div className="flex justify-between text-sm mb-3">
                                                <span className="text-white font-bold flex items-center">
                                                    <Flame className="w-4 h-4 mr-2 text-orange-500" />
                                                    Seu Progresso
                                                </span>
                                                <span className="text-primary font-bold tracking-wider">{progressText}</span>
                                            </div>
                                            <Progress value={progress} className="h-2 bg-zinc-800" indicatorClassName="bg-gradient-to-r from-orange-500 to-primary" />
                                        </div>
                                    ) : (
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                                            <div className="p-2 bg-zinc-900 rounded-lg text-zinc-500">
                                                <Target className="h-5 w-5" />
                                            </div>
                                            <span className="text-sm text-zinc-300">Participe para desbloquear recompensas e badges exclusivos.</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Link href={`/challenges/${challenge._id}`} className="flex-1">
                                            <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-white hover:text-black font-bold">
                                                Ver Detalhes
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                        {!isParticipating && (
                                            <Button 
                                                className="flex-1 h-12 bg-white text-black font-bold hover:bg-primary transition-colors rounded-xl shadow-lg"
                                                onClick={() => handleParticipate(challenge._id)}
                                                disabled={isPending}
                                            >
                                                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                                                    <>
                                                        <Play className="mr-2 h-4 w-4 fill-current" />
                                                        Aceitar
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>
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
