'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useOnboardingBack } from '@/hooks/useOnboarding';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const step4Schema = z.object({
  alimentacao_status: z.enum(['nao_ajuda_emagrecimento', 'sabe_mas_nao_segue', 'relativamente_saudavel', 'estruturada_emagrecimento', 'ja_emagreceu_e_reganhou']),
  acucar_frequencia: z.enum(['diario', '2_3x_semana', 'raro']),
  alcool_frequencia: z.enum(['nenhum', '1_2x_semana', '3x_ou_mais']),
});

export default function OnboardingStep4() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { mutate: goBack, isPending: isGoingBack } = useOnboardingBack();
  const [healthConditions, setHealthConditions] = React.useState({
    hipertensao: false,
    diabetes_tipo2: false,
    pre_diabetes: false,
    colesterol_alto: false,
    resistencia_insulina: false,
    historico_familiar_diabetes: false,
    historico_familiar_cardio: false
  });
  const [isPending, setIsPending] = React.useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(step4Schema),
  });

  const handleBack = () => {
    goBack(3, {
      onSuccess: () => {
        router.push('/onboarding/step3');
      }
    });
  };

  const onSubmit = async (data) => {
    setIsPending(true);
    try {
      await api.post('/onboarding/anamnesis', {
        ...data,
        ...healthConditions
      });
      toast.success('Anamnese salva!');
      // Invalidar cache para garantir que o layout receba os dados atualizados
      await queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
      router.push('/onboarding/step5');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar anamnese');
    } finally {
      setIsPending(false);
    }
  };

  const alimentacaoValue = watch('alimentacao_status');
  const acucarValue = watch('acucar_frequencia');
  const alcoolValue = watch('alcool_frequencia');

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card rounded-3xl p-6 md:p-8 border-primary/20 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Saúde e Estilo de Vida</h2>
          <p className="text-zinc-400 text-sm md:text-base">Conte-nos sobre seus hábitos e condições de saúde</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Alimentação */}
          <div className="space-y-3">
            <Label className="text-white font-semibold text-base">Como você avalia sua alimentação? *</Label>
            <RadioGroup value={alimentacaoValue} onValueChange={(v) => setValue('alimentacao_status', v)}>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'nao_ajuda_emagrecimento', label: 'Não ajuda no emagrecimento' },
                  { value: 'sabe_mas_nao_segue', label: 'Sabe o que fazer mas não segue' },
                  { value: 'relativamente_saudavel', label: 'Relativamente saudável' },
                  { value: 'estruturada_emagrecimento', label: 'Estruturada para emagrecimento' },
                  { value: 'ja_emagreceu_e_reganhou', label: 'Já emagreceu e reganhou peso' }
                ].map((opt) => {
                  const isSelected = alimentacaoValue === opt.value;
                  return (
                    <label
                      key={opt.value}
                      htmlFor={`alim-${opt.value}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10 text-white' 
                          : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50'
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`alim-${opt.value}`} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-zinc-500'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
            {errors.alimentacao_status && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">{errors.alimentacao_status.message || 'Selecione uma opção'}</p>
            )}
          </div>

          {/* Açúcar e Álcool lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Açúcar */}
            <div className="space-y-3">
              <Label className="text-white font-semibold text-base">Consumo de açúcar *</Label>
              <RadioGroup value={acucarValue} onValueChange={(v) => setValue('acucar_frequencia', v)}>
                <div className="space-y-2">
                  {[
                    { value: 'diario', label: 'Diário' },
                    { value: '2_3x_semana', label: '2-3x por semana' },
                    { value: 'raro', label: 'Raro' }
                  ].map((opt) => {
                    const isSelected = acucarValue === opt.value;
                    return (
                      <label
                        key={opt.value}
                        htmlFor={`acucar-${opt.value}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/10 text-white' 
                            : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <RadioGroupItem value={opt.value} id={`acucar-${opt.value}`} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-zinc-500'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                        </div>
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>
              {errors.acucar_frequencia && (
                <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">{errors.acucar_frequencia.message || 'Selecione uma opção'}</p>
              )}
            </div>

            {/* Álcool */}
            <div className="space-y-3">
              <Label className="text-white font-semibold text-base">Consumo de álcool *</Label>
              <RadioGroup value={alcoolValue} onValueChange={(v) => setValue('alcool_frequencia', v)}>
                <div className="space-y-2">
                  {[
                    { value: 'nenhum', label: 'Nenhum' },
                    { value: '1_2x_semana', label: '1-2x por semana' },
                    { value: '3x_ou_mais', label: '3x ou mais' }
                  ].map((opt) => {
                    const isSelected = alcoolValue === opt.value;
                    return (
                      <label
                        key={opt.value}
                        htmlFor={`alcool-${opt.value}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/10 text-white' 
                            : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <RadioGroupItem value={opt.value} id={`alcool-${opt.value}`} className="sr-only" />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-primary bg-primary' : 'border-zinc-500'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                        </div>
                        <span className="text-sm">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>
              {errors.alcool_frequencia && (
                <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg">{errors.alcool_frequencia.message || 'Selecione uma opção'}</p>
              )}
            </div>
          </div>

          {/* Condições de saúde */}
          <div className="space-y-3">
            <Label className="text-white font-semibold text-base">Condições de saúde</Label>
            <p className="text-zinc-500 text-xs">Marque todas que se aplicam (opcional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { key: 'hipertensao', label: 'Hipertensão' },
                { key: 'diabetes_tipo2', label: 'Diabetes Tipo 2' },
                { key: 'pre_diabetes', label: 'Pré-diabetes' },
                { key: 'colesterol_alto', label: 'Colesterol Alto' },
                { key: 'resistencia_insulina', label: 'Resistência à Insulina' },
                { key: 'historico_familiar_diabetes', label: 'Histórico Familiar Diabetes' },
                { key: 'historico_familiar_cardio', label: 'Histórico Familiar Cardio' }
              ].map((condition) => {
                const isChecked = healthConditions[condition.key];
                return (
                  <label
                    key={condition.key}
                    htmlFor={condition.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked 
                        ? 'border-red-500/50 bg-red-500/10 text-white' 
                        : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50'
                    }`}
                  >
                    <Checkbox
                      id={condition.key}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        setHealthConditions(prev => ({ ...prev, [condition.key]: checked }));
                      }}
                      className={isChecked ? 'border-red-500 bg-red-500 text-white' : ''}
                    />
                    <span className="text-sm">{condition.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <Button 
              type="button"
              variant="ghost" 
              onClick={handleBack}
              disabled={isPending || isGoingBack}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {isGoingBack ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowLeft className="mr-2 h-5 w-5" />}
              Voltar
            </Button>
            <Button 
              type="submit" 
              className="bg-primary text-black font-bold h-12 px-8 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
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
