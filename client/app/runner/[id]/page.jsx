'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Crown, Activity, History, Trophy, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { ActivityCard } from '@/components/profile/ActivityCard';
import { WorkoutDetailsDialog } from '@/components/workouts/WorkoutDetailsDialog';
import { StatsOverview } from '@/components/profile/StatsOverview';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// --- Hooks ---

const useRunnerProfile = (runnerId) => {
  return useQuery({
    queryKey: ['runner', runnerId, 'profile'],
    queryFn: async () => {
      const response = await api.get(`/users/public/${runnerId}`);
      // Verificar se a resposta indica erro
      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || 'Usuário não encontrado');
      }
      return response.data;
    },
    enabled: !!runnerId,
    retry: false, // Não tentar novamente em caso de erro 404
    staleTime: 5 * 60 * 1000, // Manter dados em cache por 5 minutos
  });
};

const useRunnerStats = (runnerId) => {
  return useQuery({
    queryKey: ['runner', runnerId, 'stats', 'all'],
    queryFn: async () => {
      const response = await api.get(`/users/public/${runnerId}/stats?period=all`);
      return response.data?.data?.stats || {};
    },
    enabled: !!runnerId,
  });
};

const useRunnerActivities = (runnerId) => {
  return useQuery({
    queryKey: ['runner', runnerId, 'workouts'],
    queryFn: async () => {
      const response = await api.get(`/users/public/${runnerId}/workouts?sort=-date`);
      return response.data?.data?.workouts || [];
    },
    enabled: !!runnerId,
  });
};

// --- Helpers ---

const getPlanDisplayName = (planType) => {
  const planNames = {
    free: 'Gratuito',
    plus: 'Plus',
    pro: 'PRO',
    corporate: 'Corporate'
  };
  return planNames[planType] || 'Gratuito';
};

const getPlanDescription = (planType) => {
  const descriptions = {
    free: 'Acesso básico à plataforma com treinos básicos e comunidade.',
    plus: 'Planilha personalizada, aulas ilimitadas e suporte prioritário.',
    pro: 'Coach dedicado, análise de performance avançada e mentoria mensal.',
    corporate: 'Plano corporativo com recursos exclusivos para empresas.'
  };
  return descriptions[planType] || descriptions.free;
};

const isPremiumPlan = (planType) => {
  return planType === 'pro' || planType === 'corporate';
};

export default function RunnerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const runnerId = params.id;
  
  const { data: userResponse, isLoading: isLoadingUser, error: userError, isError: isUserError } = useRunnerProfile(runnerId);
  const { data: stats, isLoading: isLoadingStats } = useRunnerStats(runnerId);
  const { data: activities, isLoading: isLoadingActivities } = useRunnerActivities(runnerId);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Extrair usuário de forma mais robusta
  // A API retorna: { success: true, data: { user: ... } }
  const user = userResponse?.data?.user || userResponse?.user || null;
  
  // Obter o tipo do plano do usuário
  let planType = user?.plan?.type || (typeof user?.plan === 'string' ? user.plan : 'free');
  
  // Normalizar o plano para garantir que seja um dos planos válidos
  if (!['free', 'plus', 'pro', 'corporate'].includes(planType)) {
    planType = 'free';
  }
  
  const planStatus = user?.plan?.status || 'active';

  // Verificar primeiro se está carregando
  if (isLoadingUser || isLoadingStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Verificar erro ou ausência de dados apenas após o carregamento terminar
  if (isUserError || userError || !user) {
    return (
      <div className="space-y-6 pb-20 sm:pb-10 max-w-5xl mx-auto">
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
          <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Usuário não encontrado</h3>
          <p className="text-zinc-400 mb-6">O perfil que você está procurando não existe ou não está disponível.</p>
          <Button 
            onClick={() => router.back()}
            className="bg-primary text-black hover:bg-primary/90"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-8 pb-20 sm:pb-10 max-w-5xl mx-auto"
    >
      {/* Header Section */}
      <div className="relative">
        {/* Cover Image Placeholder */}
        <div className="h-32 sm:h-48 w-full rounded-b-3xl sm:rounded-3xl bg-gradient-to-r from-zinc-900 to-zinc-800 overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('http://localhost:3000/hackrunning-bg.png')] bg-cover opacity-100 mix-blend-darken pointer-events-none"></div>
        </div>

        {/* Profile Info */}
        <div className="px-4 sm:px-10 pb-6 -mt-12 sm:-mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 relative z-10">
            <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-zinc-950 ring-4 ring-zinc-900">
                    <Avatar className="w-full h-full border-2 border-white/10">
                        <AvatarImage src={user?.photo} className="object-cover" />
                        <AvatarFallback className="text-2xl sm:text-4xl font-bold bg-zinc-800 text-zinc-500">
                            {user?.name?.[0] || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    {user?.name}
                    {isPremiumPlan(planType) && (
                        <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                    )}
                </h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-zinc-400 text-sm mb-4 sm:mb-2">
                    {(user?.address?.city || user?.city) && (
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {user?.address?.city || user?.city}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Nível {Math.floor((stats?.totalDistance || 0) / 50) + 1}
                    </span>
                </div>
            </div>

            <div className="flex gap-4 w-full sm:w-auto justify-center sm:justify-end border-t border-white/5 pt-4 sm:pt-0 sm:border-0">
                <div className="text-center px-4 sm:px-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">{activities?.length || 0}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase">Atividades</div>
                </div>
                <div className="w-px h-10 bg-white/10 sm:hidden"></div>
                <div className="text-center px-4 sm:px-0">
                    <div className="text-xl sm:text-2xl font-bold text-white">{stats?.totalDistance || 0}</div>
                    <div className="text-[10px] sm:text-xs text-zinc-500 font-bold uppercase">Km Totais</div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full px-4 sm:px-0">
        <TabsList className="bg-zinc-900/50 border border-white/5 p-1 rounded-xl mb-6 w-full grid grid-cols-2 sm:flex sm:w-auto sm:justify-start h-auto">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black py-2.5 sm:px-6">
                Visão Geral
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black py-2.5 sm:px-6">
                Histórico
            </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="text-primary" />
                    Estatísticas Totais
                </h2>
                <StatsOverview stats={stats} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                 <div className="glass-card rounded-3xl p-5 md:p-6 border-primary/20 relative overflow-hidden">
                     {isPremiumPlan(planType) && (
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Crown size={100} className="rotate-12" />
                        </div>
                     )}
                     <h3 className="text-lg font-bold text-white mb-4">Plano Atual</h3>
                     <div className="relative z-10">
                         <div className="flex items-baseline gap-2 mb-2">
                            <h2 className="text-3xl font-bold text-primary">
                                {getPlanDisplayName(planType)}
                            </h2>
                            {planStatus !== 'active' && (
                                <span className="text-xs text-zinc-500 uppercase ml-2">
                                    ({planStatus === 'cancelled' ? 'Cancelado' : 
                                      planStatus === 'suspended' ? 'Suspenso' : 
                                      planStatus === 'pending' ? 'Pendente' : 'Inativo'})
                                </span>
                            )}
                         </div>
                         <p className="text-zinc-400 mb-6">
                            {getPlanDescription(planType)}
                         </p>
                     </div>
                 </div>

                 {/* Placeholder for Recent Achievements or Badges */}
                 <div className="glass-card rounded-3xl p-5 md:p-6 border-white/5">
                    <h3 className="text-lg font-bold text-white mb-4">Conquistas Recentes</h3>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-square rounded-full bg-white/5 flex items-center justify-center border border-white/5 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" title="Em breve">
                                <Trophy className="w-6 h-6 text-yellow-500" />
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-zinc-500 text-sm mt-6">Sistema de conquistas em breve</p>
                 </div>
            </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <History className="text-primary" />
                    Histórico de Atividades
                </h2>
            </div>
            
            {isLoadingActivities ? (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                    <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
            ) : activities?.length > 0 ? (
                <div className="space-y-4">
                    {activities.map((activity) => (
                        <ActivityCard 
                          key={activity._id} 
                          activity={activity} 
                          onClick={() => setSelectedWorkout(activity)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
                    <Activity className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhuma atividade ainda</h3>
                    <p className="text-zinc-400">Este runner ainda não registrou atividades.</p>
                </div>
            )}
        </TabsContent>
      </Tabs>

      <WorkoutDetailsDialog
        workout={selectedWorkout}
        open={!!selectedWorkout}
        onOpenChange={(open) => !open && setSelectedWorkout(null)}
        defaultUser={user}
      />
    </motion.div>
  );
}

