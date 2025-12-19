'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Heart, MessageSquare, Share2, TrendingUp, Trophy } from 'lucide-react';
import { safeFormatDate } from '@/lib/utils/date';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';

const useCommunityFeed = () => {
  return useQuery({
    queryKey: ['community', 'feed'],
    queryFn: async () => {
      const response = await api.get('/workouts?status=approved&limit=20');
      const data = response.data?.data || response.data;
      return data?.workouts || data || [];
    },
  });
};

const useTopAthletes = () => {
    // Mock for now, or fetch from API if endpoint exists
    return useQuery({
        queryKey: ['community', 'top'],
        queryFn: async () => {
            // Simulate API delay
            await new Promise(r => setTimeout(r, 500));
            return [
                { id: 1, name: 'Ana Silva', points: 12500, avatar: null },
                { id: 2, name: 'Carlos Run', points: 11200, avatar: null },
                { id: 3, name: 'Julia Speed', points: 9800, avatar: null },
            ];
        }
    });
};

export default function CommunityPage() {
  const { data: feed, isLoading } = useCommunityFeed();
  const { data: topAthletes, isLoading: loadingTop } = useTopAthletes();

  const getDisplayFeed = () => {
    if (isLoading) return null;
    if (feed) {
      if (Array.isArray(feed)) return feed;
      if (Array.isArray(feed.workouts)) return feed.workouts;
      if (Array.isArray(feed.data)) return feed.data;
      if (Array.isArray(feed.feed)) return feed.feed;
    }
    return [];
  };

  const displayFeed = getDisplayFeed();

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tighter text-white">Comunidade</h1>
            <p className="text-zinc-400 mt-2">Onde a equipe se encontra.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-6">
            <motion.div 
                key={`community-${isLoading}-${displayFeed?.length || 0}`}
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                {isLoading || displayFeed === null ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[500px] w-full rounded-3xl bg-white/5" />)
                ) : displayFeed.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-zinc-400">Nenhuma atividade recente encontrada.</p>
                </div>
                ) : (
                displayFeed.map((activity) => (
                    <motion.div variants={item} key={activity._id}>
                        <div className="glass-card rounded-3xl overflow-hidden border-white/5 bg-[#0a0a0a] hover:border-primary/20 transition-all duration-300">
                            {/* Header */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-white/10">
                                        <AvatarImage src={activity.user?.photo} />
                                        <AvatarFallback className="bg-zinc-800 font-bold text-zinc-400 text-xs">
                                            {activity.user?.name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-white text-sm">{activity.user?.name || 'Atleta'}</p>
                                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">
                                            {activity.date ? safeFormatDate(activity.date, "dd 'de' MMM • HH:mm") : ''}
                                        </p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white rounded-full">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Activity Image (Full Width) */}
                            {activity.photo && typeof activity.photo === 'string' && activity.photo.trim() !== '' ? (
                                <div className="relative w-full aspect-[4/3] bg-zinc-900">
                                    <Image 
                                    src={activity.photo} 
                                    alt="Treino" 
                                    fill 
                                    className="object-cover"
                                    />
                                    <div className="absolute bottom-4 left-4">
                                        <Badge className="bg-black/60 backdrop-blur-md text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                            {activity.workoutType || activity.type}
                                        </Badge>
                                    </div>
                                </div>
                            ) : (
                                // Map Placeholder if no photo
                                <div className="relative w-full aspect-[3/1] bg-white/5 flex items-center justify-center border-y border-white/5">
                                    <MapPin className="w-8 h-8 text-zinc-700" />
                                </div>
                            )}

                            {/* Content */}
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white mb-1">
                                        {activity.distance} km <span className="text-zinc-500 font-normal">run</span>
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm font-mono text-zinc-300">
                                        {activity.pace && (
                                            <span className="flex items-center gap-1.5">
                                                <TrendingUp className="w-3 h-3 text-primary" />
                                                {activity.pace}/km
                                            </span>
                                        )}
                                        {activity.time && (
                                            <span>{activity.time}</span>
                                        )}
                                    </div>
                                </div>

                                {activity.description && (
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-4">{activity.description}</p>
                                )}

                                {/* Interactions */}
                                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 gap-2 px-2">
                                        <Heart className="w-5 h-5" />
                                        <span className="text-xs font-bold">Curtir</span>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/5 gap-2 px-2">
                                        <MessageSquare className="w-5 h-5" />
                                        <span className="text-xs font-bold">Comentar</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))
                )}
            </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
            {/* Top Athletes Widget */}
            <div className="glass-card rounded-3xl p-6 border-white/5 sticky top-6">
                <div className="flex items-center gap-2 mb-6">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-bold text-white">Top da Semana</h3>
                </div>
                
                {loadingTop ? (
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full bg-white/5 rounded-xl" />
                        <Skeleton className="h-12 w-full bg-white/5 rounded-xl" />
                        <Skeleton className="h-12 w-full bg-white/5 rounded-xl" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {topAthletes?.map((athlete, index) => (
                            <div key={athlete.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-white/5
                                    ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 
                                      index === 1 ? 'bg-zinc-400/20 text-zinc-400' :
                                      index === 2 ? 'bg-orange-700/20 text-orange-700' : 'bg-white/5 text-zinc-500'}
                                `}>
                                    {index + 1}
                                </div>
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">{athlete.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{athlete.name}</p>
                                    <p className="text-xs text-zinc-500">{athlete.points} pts</p>
                                </div>
                            </div>
                        ))}
                        <Button variant="ghost" className="w-full text-xs text-zinc-500 hover:text-white mt-2">
                            Ver Ranking Completo
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick Links */}
            <div className="glass-card rounded-3xl p-6 border-white/5">
                 <h3 className="font-bold text-white mb-4">Atalhos</h3>
                 <div className="space-y-2">
                    <Link href="/app/challenges">
                        <Button variant="outline" className="w-full justify-start border-white/5 hover:bg-white/5 text-zinc-300">
                            <Trophy className="w-4 h-4 mr-2 text-primary" />
                            Desafios Ativos
                        </Button>
                    </Link>
                    <Link href="/app/together">
                        <Button variant="outline" className="w-full justify-start border-white/5 hover:bg-white/5 text-zinc-300">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            Próximos Eventos
                        </Button>
                    </Link>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}
