'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useSaveOnboarding, useSkipToKickstart } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/store/authStore';

const step1Schema = z.object({
  runningTime: z.enum(['<6m', '6m-1y', '1y-3y', '3y+'], {
    required_error: "Selecione há quanto tempo você corre",
  }),
  kmPerMonth: z.string().transform((v) => parseInt(v, 10)).pipe(
    z.number().min(0, "KM deve ser positivo")
  ),
  hasWatch: z.enum(['yes', 'no'], {
    required_error: "Informe se possui relógio",
  }),
  hasStrava: z.enum(['yes', 'no'], {
    required_error: "Informe se possui Strava",
  }),
});

export default function OnboardingStep1() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { mutate: saveOnboarding, isPending } = useSaveOnboarding();
  const { mutate: skipToKickstart, isPending: isSkipping } = useSkipToKickstart();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      kmPerMonth: '0',
    }
  });

  const onSubmit = async (data) => {
    saveOnboarding({
      userId: user?._id,
      step: 1,
      ...data
    }, {
      onSuccess: async () => {
        // Aguardar um pouco para garantir que o cache foi invalidado e a query recarregou
        await new Promise(resolve => setTimeout(resolve, 300));
        router.push('/onboarding/step2');
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
          <h2 className="text-3xl font-bold text-white mb-2">Perfil de Corredor</h2>
          <p className="text-zinc-400">
            Queremos conhecer melhor sua experiência com a corrida.
          </p>
        </div>

        <form id="step1-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <div className="flex flex-col gap-3">
            <Label className="text-base text-zinc-300 font-medium ml-1">Há quanto tempo você corre?</Label>
            <RadioGroup 
              onValueChange={(val) => setValue('runningTime', val)} 
              value={watch('runningTime')}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { id: '<6m', label: 'Menos de 6 meses' },
                { id: '6m-1y', label: '6 meses a 1 ano' },
                { id: '1y-3y', label: '1 a 3 anos' },
                { id: '3y+', label: 'Mais de 3 anos' },
              ].map((item) => {
                const isSelected = watch('runningTime') === item.id;
                return (
                  <div key={item.id} className="relative">
                    <RadioGroupItem value={item.id} id={item.id} className="sr-only" />
                    <Label
                      htmlFor={item.id}
                      className={`
                        flex flex-col items-center justify-center rounded-xl p-4 cursor-pointer transition-all duration-200 h-full text-center border
                        ${isSelected 
                          ? 'bg-primary border-primary text-black font-bold shadow-[0_4px_14px_0_rgba(238,255,0,0.39)] transform scale-[1.02]' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:border-white/20 hover:text-white'
                        }
                      `}
                    >
                      {item.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
            {errors.runningTime && <p className="text-xs text-red-500 ml-1">{errors.runningTime.message}</p>}
          </div>

          <div className="space-y-4">
            <Label htmlFor="kmPerMonth" className="text-base text-zinc-300 font-medium ml-1">Volume médio mensal (KM)</Label>
            <Input
              id="kmPerMonth"
              type="number"
              placeholder="Ex: 50"
              className="h-14 bg-zinc-900/50 border-white/5 hover:border-white/20 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl text-white text-lg transition-all"
              {...register('kmPerMonth')}
            />
            {errors.kmPerMonth && <p className="text-xs text-red-500 ml-1">{errors.kmPerMonth.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-base text-zinc-300 font-medium ml-1">Possui relógio GPS?</Label>
              <RadioGroup 
                onValueChange={(val) => setValue('hasWatch', val)} 
                value={watch('hasWatch')}
                className="flex gap-3"
              >
                  <div className="flex-1">
                    <RadioGroupItem value="yes" id="watch-yes" className="sr-only" />
                    <Label 
                      htmlFor="watch-yes" 
                      className={`
                        flex items-center justify-center h-14 rounded-xl cursor-pointer transition-all duration-200 font-bold border
                        ${watch('hasWatch') === 'yes'
                          ? 'bg-primary border-primary text-black shadow-[0_4px_14px_0_rgba(238,255,0,0.39)]' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:border-white/20 hover:text-white'
                        }
                      `}
                    >
                      Sim
                    </Label>
                  </div>
                  <div className="flex-1">
                    <RadioGroupItem value="no" id="watch-no" className="sr-only" />
                    <Label 
                      htmlFor="watch-no" 
                      className={`
                        flex items-center justify-center h-14 rounded-xl cursor-pointer transition-all duration-200 font-bold border
                        ${watch('hasWatch') === 'no'
                          ? 'bg-zinc-800 border-zinc-700 text-white' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:border-white/20 hover:text-white'
                        }
                      `}
                    >
                      Não
                    </Label>
                  </div>
              </RadioGroup>
               {errors.hasWatch && <p className="text-xs text-red-500 ml-1">{errors.hasWatch.message}</p>}
            </div>

            <div className="space-y-3">
              <Label className="text-base text-zinc-300 font-medium ml-1">Possui conta no Strava?</Label>
              <RadioGroup 
                onValueChange={(val) => setValue('hasStrava', val)} 
                value={watch('hasStrava')}
                className="flex gap-3"
              >
                  <div className="flex-1">
                    <RadioGroupItem value="yes" id="strava-yes" className="sr-only" />
                    <Label 
                      htmlFor="strava-yes" 
                      className={`
                        flex items-center justify-center h-14 rounded-xl cursor-pointer transition-all duration-200 font-bold border
                        ${watch('hasStrava') === 'yes'
                          ? 'bg-[#FC4C02] border-[#FC4C02] text-white shadow-[0_4px_14px_0_rgba(252,76,2,0.39)]' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:border-white/20 hover:text-white'
                        }
                      `}
                    >
                      Sim
                    </Label>
                  </div>
                  <div className="flex-1">
                    <RadioGroupItem value="no" id="strava-no" className="sr-only" />
                    <Label 
                      htmlFor="strava-no" 
                      className={`
                        flex items-center justify-center h-14 rounded-xl cursor-pointer transition-all duration-200 font-bold border
                        ${watch('hasStrava') === 'no'
                          ? 'bg-zinc-800 border-zinc-700 text-white' 
                          : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800 hover:border-white/20 hover:text-white'
                        }
                      `}
                    >
                      Não
                    </Label>
                  </div>
              </RadioGroup>
              {errors.hasStrava && <p className="text-xs text-red-500 ml-1">{errors.hasStrava.message}</p>}
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <Button 
              type="submit" 
              className="w-full h-14 bg-primary text-black font-bold text-lg rounded-xl hover:bg-primary/90 transition-all"
              disabled={isPending || isSkipping}
            >
               {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
               Próximo Passo
               <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              type="button"
              onClick={() => skipToKickstart()}
              className="w-full h-12 bg-transparent border border-zinc-700 text-zinc-400 font-medium text-base rounded-xl hover:bg-zinc-800 hover:text-white hover:border-zinc-600 transition-all"
              disabled={isPending || isSkipping}
            >
              {isSkipping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pulando...
                </>
              ) : (
                'Pular e ir direto para o Starter Pack'
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
