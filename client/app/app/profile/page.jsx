'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Mail, Phone, MapPin, Edit, Save, Camera, Crown, Settings, Activity, History, Trophy, Upload } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { ActivityCard } from '@/components/profile/ActivityCard';
import { WorkoutDetailsDialog } from '@/components/workouts/WorkoutDetailsDialog';
import { StatsOverview } from '@/components/profile/StatsOverview';

// --- Hooks ---

const useUserProfile = () => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
  });
};

const useUserStats = () => {
  return useQuery({
    queryKey: ['user', 'stats', 'all'],
    queryFn: async () => {
      const response = await api.get('/users/stats?period=all');
      return response.data?.data?.stats || {};
    },
  });
};

const useUserActivities = () => {
  return useQuery({
    queryKey: ['workouts', 'history'],
    queryFn: async () => {
      const response = await api.get('/workouts?sort=-date');
      return response.data?.data?.workouts || response.data?.workouts || [];
    },
  });
};

const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    },
  });
};

const useUploadProfilePhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await api.post('/users/me/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Foto atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar foto');
    },
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

// --- Components ---

function EditProfileDialog({ user, open, onOpenChange }) {
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      city: '',
    },
  });

  // Resetar o formulário quando o modal abrir ou o usuário mudar
  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
      });
    }
  }, [open, user, reset]);

  const onSubmit = (data) => {
    updateProfile(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-400">Nome Completo</Label>
              <Input id="name" {...register('name')} className="bg-zinc-900/50 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400">Email</Label>
              <Input id="email" type="email" {...register('email')} className="bg-zinc-900/50 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-400">Telefone</Label>
              <Input id="phone" {...register('phone')} className="bg-zinc-900/50 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-zinc-400">Cidade</Label>
              <Input id="city" {...register('city')} className="bg-zinc-900/50 border-white/10 text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
             <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/10 text-white">
                Cancelar
             </Button>
             <Button type="submit" disabled={isPending} className="bg-primary text-black hover:bg-primary/90 font-bold">
                {isPending ? 'Salvando...' : 'Salvar Alterações'}
             </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { user: authUser } = useAuthStore();
  const { data: userResponse, isLoading: isLoadingUser } = useUserProfile();
  const { data: stats, isLoading: isLoadingStats } = useUserStats();
  const { data: activities, isLoading: isLoadingActivities } = useUserActivities();
  const { mutate: uploadPhoto, isPending: isUploadingPhoto } = useUploadProfilePhoto();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const fileInputRef = useRef(null);

  // O backend retorna { success: true, data: { user, onboardingComplete, hpointsBalance } }
  const user = userResponse?.data?.user || userResponse?.user || userResponse;
  const displayUser = user || authUser;
  
  // Obter o tipo do plano do usuário
  // O plano está em plan.type (objeto) ou pode ser uma string direta (fallback)
  // Garantir que sempre temos um plano válido: 'free', 'plus' ou 'pro'
  let planType = displayUser?.plan?.type || (typeof displayUser?.plan === 'string' ? displayUser.plan : 'free');
  
  // Normalizar o plano para garantir que seja um dos planos válidos
  if (!['free', 'plus', 'pro'].includes(planType)) {
    planType = 'free';
  }
  
  const planStatus = displayUser?.plan?.status || 'active';

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    uploadPhoto(file);
  };

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
            <div className="absolute top-4 right-4 sm:bottom-4 sm:top-auto flex gap-2 z-20">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-black/40 border-white/10 text-white backdrop-blur-md hover:bg-black/60 h-8 sm:h-9 relative z-20"
                    onClick={() => setIsEditOpen(true)}
                 >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    <span className="hidden sm:inline">Editar</span>
                    <span className="sm:hidden text-xs">Editar</span>
                 </Button>
            </div>
        </div>

        {/* Profile Info */}
        <div className="px-4 sm:px-10 pb-6 -mt-12 sm:-mt-16 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 relative z-10">
            <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-zinc-950 ring-4 ring-zinc-900">
                    <Avatar className="w-full h-full border-2 border-white/10">
                        <AvatarImage src={displayUser?.photo} className="object-cover" />
                        <AvatarFallback className="text-2xl sm:text-4xl font-bold bg-zinc-800 text-zinc-500">
                            {displayUser?.name?.[0] || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={handlePhotoClick}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-0 right-0 bg-primary text-black p-1.5 rounded-full ring-4 ring-zinc-900 cursor-pointer hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Trocar foto"
                >
                  {isUploadingPhoto ? (
                    <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 flex items-center gap-2">
                    {displayUser?.name}
                    {isPremiumPlan(planType) && (
                        <Crown className="w-5 h-5 text-yellow-500 fill-yellow-500/20" />
                    )}
                </h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-zinc-400 text-sm mb-4 sm:mb-2">
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {displayUser?.city || 'Sem local'}
                    </span>
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
                         {!isPremiumPlan(planType) && planStatus === 'active' && (
                            <Button className="bg-primary text-black font-bold hover:bg-primary/90">
                                Fazer Upgrade
                            </Button>
                         )}
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
                    <p className="text-zinc-400">Registre sua primeira corrida para vê-la aqui!</p>
                </div>
            )}
        </TabsContent>
      </Tabs>

      <EditProfileDialog 
        user={displayUser} 
        open={isEditOpen} 
        onOpenChange={setIsEditOpen} 
      />

      <WorkoutDetailsDialog
        workout={selectedWorkout}
        open={!!selectedWorkout}
        onOpenChange={(open) => !open && setSelectedWorkout(null)}
        defaultUser={displayUser}
      />
    </motion.div>
  );
}


