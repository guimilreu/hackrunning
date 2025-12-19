'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useOnboardingBack } from '@/hooks/useOnboarding';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function OnboardingStep6() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: goBack, isPending: isGoingBack } = useOnboardingBack();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    teste6_distancia_m: '',
    teste6_esforco_0_10: '',
    teste1km_tempo_segundos: '',
    teste1km_esforco_0_10: '',
    objetivo_principal: ''
  });

  const handleBack = () => {
    goBack(5, {
      onSuccess: () => router.push('/onboarding/step5')
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.teste6_distancia_m || !formData.teste1km_tempo_segundos || !formData.objetivo_principal) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsPending(true);
    try {
      await api.post('/onboarding/physical-tests', formData);
      toast.success('Testes físicos salvos!');
      // Invalidar cache para garantir que o layout receba os dados atualizados
      await queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
      router.push('/onboarding/kickstart-kit');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar testes');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      <div className="glass-card rounded-3xl p-6 md:p-8 border-primary/20 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Timer className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Testes Físicos</h2>
          <p className="text-zinc-400 text-sm md:text-base">Vamos medir sua capacidade atual para personalizar seu treino</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dica importante */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              <strong>💡 Dica:</strong> Se ainda não fez os testes, coloque valores aproximados e atualize depois no seu perfil.
            </p>
          </div>

          {/* Teste de 6 minutos */}
          <div className="bg-zinc-800/30 rounded-xl p-4 space-y-4 border border-zinc-700/50">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Teste de 6 minutos
            </h3>
            <p className="text-xs text-zinc-500">Corra o máximo que conseguir em 6 minutos e anote a distância</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white font-medium text-sm">Distância (metros) *</Label>
                <Input
                  type="number"
                  placeholder="Ex: 1200"
                  value={formData.teste6_distancia_m}
                  onChange={(e) => setFormData(prev => ({ ...prev, teste6_distancia_m: e.target.value }))}
                  className="h-11 bg-zinc-800/50 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white font-medium text-sm">Esforço (0-10) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Ex: 7"
                  value={formData.teste6_esforco_0_10}
                  onChange={(e) => setFormData(prev => ({ ...prev, teste6_esforco_0_10: e.target.value }))}
                  className="h-11 bg-zinc-800/50 border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Teste de 1km */}
          <div className="bg-zinc-800/30 rounded-xl p-4 space-y-4 border border-zinc-700/50">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Teste de 1km
            </h3>
            <p className="text-xs text-zinc-500">Corra 1km o mais rápido que conseguir e anote o tempo</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white font-medium text-sm">Tempo (min:seg) *</Label>
                <Input
                  type="text"
                  placeholder="Ex: 5:30"
                  value={formData.teste1km_tempo_segundos}
                  onChange={(e) => setFormData(prev => ({ ...prev, teste1km_tempo_segundos: e.target.value }))}
                  className="h-11 bg-zinc-800/50 border-zinc-700"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white font-medium text-sm">Esforço (0-10) *</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="Ex: 9"
                  value={formData.teste1km_esforco_0_10}
                  onChange={(e) => setFormData(prev => ({ ...prev, teste1km_esforco_0_10: e.target.value }))}
                  className="h-11 bg-zinc-800/50 border-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Objetivo Principal */}
          <div className="space-y-3">
            <Label className="text-white font-semibold text-base">Objetivo principal *</Label>
            <RadioGroup value={formData.objetivo_principal} onValueChange={(v) => setFormData(prev => ({ ...prev, objetivo_principal: v }))}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { value: 'emagrecimento', label: 'Emagrecimento', emoji: '🔥' },
                  { value: 'saude_longevidade', label: 'Saúde e Longevidade', emoji: '💚' },
                  { value: 'iniciar_corrida', label: 'Iniciar na Corrida', emoji: '🏃' },
                  { value: 'completar_5km', label: 'Completar 5km', emoji: '🎯' },
                  { value: 'melhorar_condicionamento', label: 'Melhorar Condicionamento', emoji: '💪' },
                  { value: 'performance', label: 'Performance', emoji: '🏆' }
                ].map((opt) => {
                  const isSelected = formData.objetivo_principal === opt.value;
                  return (
                    <label
                      key={opt.value}
                      htmlFor={`obj-${opt.value}`}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/10 text-white' 
                          : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50'
                      }`}
                    >
                      <RadioGroupItem value={opt.value} id={`obj-${opt.value}`} className="sr-only" />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary bg-primary' : 'border-zinc-500'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                      </div>
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
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
