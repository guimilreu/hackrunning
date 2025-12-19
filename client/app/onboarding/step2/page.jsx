'use client';

import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSaveOnboarding, useOnboardingBack } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/store/authStore';

const OBJECTIVES = [
  { id: 'weight_loss', label: 'Emagrecimento' },
  { id: 'health', label: 'Saúde e Bem-estar' },
  { id: 'performance', label: 'Performance / Velocidade' },
  { id: 'discipline', label: 'Disciplina / Constância' },
  { id: 'race_preparation', label: 'Preparação para Prova' },
];

const step2Schema = z.object({
  objectives: z.array(z.string()).min(1, 'Selecione pelo menos um objetivo'),
});

export default function OnboardingStep2() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutate: saveOnboarding, isPending } = useSaveOnboarding();
  const { mutate: goBack, isPending: isGoingBack } = useOnboardingBack();

  const { handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      objectives: [],
    }
  });

  const selectedObjectives = watch('objectives') || [];

  const handleBack = () => {
    goBack(1, {
      onSuccess: () => {
        router.push('/onboarding/step1');
      }
    });
  };

  const handleCheckedChange = useCallback((checked, id) => {
    const current = selectedObjectives || [];
    if (checked) {
      if (!current.includes(id)) {
        setValue('objectives', [...current, id], { shouldValidate: true });
      }
    } else {
      setValue('objectives', current.filter(item => item !== id), { shouldValidate: true });
    }
  }, [selectedObjectives, setValue]);

  const onSubmit = async (data) => {
    saveOnboarding({
      userId: user?._id,
      step: 2,
      ...data
    }, {
      onSuccess: async () => {
        // Aguardar um pouco para garantir que o cache foi invalidado e a query recarregou
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push('/onboarding/step3');
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
          <h2 className="text-3xl font-bold text-white mb-2">Seus Objetivos</h2>
          <p className="text-zinc-400">
             O que você busca alcançar com o Hack Running?
          </p>
        </div>

        <form id="step2-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OBJECTIVES.map((item) => {
              const isChecked = selectedObjectives.includes(item.id);
              return (
                <label
                  key={item.id}
                  htmlFor={item.id}
                  className={`flex items-center space-x-4 rounded-2xl border-2 p-5 transition-all cursor-pointer group ${
                    isChecked
                      ? 'border-[#eeff00] bg-[#eeff00]/10' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#eeff00]/30'
                  }`}
                >
                  <Checkbox
                    id={item.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      handleCheckedChange(checked, item.id);
                    }}
                    className={`border-2 transition-all ${
                      isChecked 
                        ? 'border-[#eeff00] bg-[#eeff00] text-black' 
                        : 'border-zinc-500 group-hover:border-[#eeff00]/50'
                    }`}
                  />
                  <span className={`font-semibold text-lg transition-colors ${
                    isChecked ? 'text-[#eeff00]' : 'text-zinc-300 group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.objectives && (
            <p className="text-sm text-red-500 font-medium text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
              {errors.objectives.message}
            </p>
          )}

          <div className="flex justify-between pt-4">
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
