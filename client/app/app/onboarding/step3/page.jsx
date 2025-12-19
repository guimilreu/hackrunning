'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WeekDaySelector } from '@/components/ui/week-day-selector';
import { useSaveOnboarding, useOnboardingBack } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/store/authStore';

const step3Schema = z.object({
  weight: z.string().transform((v) => parseFloat(v)).pipe(
    z.number().positive("Peso inválido")
  ),
  height: z.string().transform((v) => parseInt(v)).pipe(
    z.number().positive("Altura inválida")
  ),
  cintura_cm: z.string().transform((v) => parseFloat(v)).pipe(
    z.number().positive("Cintura inválida")
  ),
  quadril_cm: z.string().transform((v) => parseFloat(v)).pipe(
    z.number().positive("Quadril inválido")
  ),
  trainingDays: z.array(z.number()).min(2, "Selecione pelo menos 2 dias").max(6, "Selecione no máximo 6 dias"),
  tempo_max_sessao_min: z.string().transform((v) => parseInt(v)).pipe(
    z.number().refine((v) => [30, 45, 60, 90].includes(v), "Tempo deve ser 30, 45, 60 ou 90 minutos")
  ),
  paceTarget: z.string().optional(),
  time5k: z.string().optional(),
});

export default function OnboardingStep3() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutate: saveOnboarding, isPending } = useSaveOnboarding();
  const { mutate: goBack, isPending: isGoingBack } = useOnboardingBack();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      trainingDays: [],
    }
  });

  const handleBack = () => {
    goBack(2, {
      onSuccess: () => {
        router.push('/app/onboarding/step2');
      }
    });
  };

  const onSubmit = async (data) => {
    // Calcular a frequência baseada nos dias selecionados
    const frequency = data.trainingDays.length;
    
    saveOnboarding({
      userId: user?._id,
      step: 3,
      ...data,
      frequency, // Adicionar a frequência calculada
    }, {
      onSuccess: async () => {
        // Aguardar um pouco para garantir que o cache foi invalidado e a query recarregou
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push('/app/onboarding/step4');
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card rounded-3xl p-6 md:p-8 border-primary/20 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Métricas e Metas</h2>
          <p className="text-zinc-400">
            Defina seus pontos de partida e onde quer chegar.
          </p>
        </div>

        <form id="step3-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="weight" className="text-zinc-300">Peso (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                className="h-12 bg-zinc-900/50 border-white/10 rounded-xl text-white focus:border-primary/50 text-lg"
                {...register('weight')}
              />
              {errors.weight && <p className="text-xs text-red-500">{errors.weight.message}</p>}
            </div>

            <div className="space-y-3">
              <Label htmlFor="height" className="text-zinc-300">Altura (cm) *</Label>
              <Input
                id="height"
                type="number"
                placeholder="Ex: 175"
                className="h-12 bg-zinc-900/50 border-white/10 rounded-xl text-white focus:border-primary/50 text-lg"
                {...register('height')}
              />
              {errors.height && <p className="text-xs text-red-500">{errors.height.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="cintura_cm" className="text-zinc-300">Cintura (cm) *</Label>
              <Input
                id="cintura_cm"
                type="number"
                step="0.1"
                placeholder="Ex: 85"
                className="h-12 bg-zinc-900/50 border-white/10 rounded-xl text-white focus:border-primary/50 text-lg"
                {...register('cintura_cm')}
              />
              {errors.cintura_cm && <p className="text-xs text-red-500">{errors.cintura_cm.message}</p>}
              <p className="text-xs text-zinc-500">Medida na altura do umbigo</p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="quadril_cm" className="text-zinc-300">Quadril (cm) *</Label>
              <Input
                id="quadril_cm"
                type="number"
                step="0.1"
                placeholder="Ex: 95"
                className="h-12 bg-zinc-900/50 border-white/10 rounded-xl text-white focus:border-primary/50 text-lg"
                {...register('quadril_cm')}
              />
              {errors.quadril_cm && <p className="text-xs text-red-500">{errors.quadril_cm.message}</p>}
              <p className="text-xs text-zinc-500">Medida na parte mais larga</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-zinc-300">Quais dias você quer treinar? *</Label>
            <p className="text-xs text-zinc-500 mb-3">
              Selecione os dias da semana em que você pode treinar (mínimo 2, máximo 6 dias)
            </p>
            <WeekDaySelector
              selectedDays={watch('trainingDays') || []}
              onChange={(days) => setValue('trainingDays', days, { shouldValidate: true })}
              minDays={2}
              maxDays={6}
              error={errors.trainingDays?.message}
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="tempo_max_sessao_min" className="text-zinc-300">Tempo máximo por sessão (min) *</Label>
            <select
              id="tempo_max_sessao_min"
              className="h-12 bg-zinc-900/50 border border-white/10 rounded-xl text-white focus:border-primary/50 text-lg px-4 w-full"
              {...register('tempo_max_sessao_min')}
            >
              <option value="">Selecione</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">60 minutos</option>
              <option value="90">90 minutos</option>
            </select>
            {errors.tempo_max_sessao_min && <p className="text-xs text-red-500">{errors.tempo_max_sessao_min.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="paceTarget" className="text-zinc-300">Meta de Pace (min/km)</Label>
              <Input
                id="paceTarget"
                placeholder="Ex: 5:00"
                className="h-12 bg-zinc-900/50 border-white/10 rounded-xl text-white focus:border-primary/50 text-lg"
                {...register('paceTarget')}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="time5k" className="text-zinc-300">Tempo atual nos 5km</Label>
              <Input
                id="time5k"
                placeholder="Ex: 25:00"
                className="h-12 bg-zinc-900/50 border-white/10 rounded-xl text-white focus:border-primary/50 text-lg"
                {...register('time5k')}
              />
            </div>
          </div>

          <div className="flex justify-between pt-6">
             <Button 
              variant="ghost" 
              onClick={handleBack}
              disabled={isPending || isGoingBack}
              className="text-zinc-400 hover:text-white"
            >
               {isGoingBack ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowLeft className="mr-2 h-5 w-5" />}
               Voltar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-black font-bold h-12 px-8 rounded-xl hover:bg-primary/90 transition-all"
              disabled={isPending || isGoingBack}
            >
               {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
               Próximo Passo
               <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
