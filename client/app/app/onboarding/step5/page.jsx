'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, ArrowLeft, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useOnboardingBack } from '@/hooks/useOnboarding';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function OnboardingStep5() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate: goBack, isPending: isGoingBack } = useOnboardingBack();
  const [isPending, setIsPending] = useState(false);
  const [formData, setFormData] = useState({
    corre_atualmente: false,
    tempo_experiencia_meses: '',
    dias_corrida_semana: '',
    maior_distancia_recente_km: '',
    dor_atual: false,
    local_dor: [],
    dor_intensidade_0_10: '',
    dor_piora_corrida: false,
    dor_impede_corrida: false
  });

  const handleBack = () => {
    goBack(4, {
      onSuccess: () => router.push('/app/onboarding/step4')
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await api.post('/onboarding/running-history', formData);
      toast.success('Histórico salvo!');
      // Invalidar cache para garantir que o layout receba os dados atualizados
      await queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
      router.push('/app/onboarding/step6');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar histórico');
    } finally {
      setIsPending(false);
    }
  };

  const toggleLocalDor = (local) => {
    setFormData(prev => ({
      ...prev,
      local_dor: prev.local_dor.includes(local)
        ? prev.local_dor.filter(l => l !== local)
        : [...prev.local_dor, local]
    }));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
      <div className="glass-card rounded-3xl p-6 md:p-8 border-primary/20 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Histórico de Corrida</h2>
          <p className="text-zinc-400 text-sm md:text-base">Conte-nos sobre sua experiência com corrida</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Corre atualmente */}
          <div className="space-y-4">
            <label
              htmlFor="corre_atualmente"
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                formData.corre_atualmente 
                  ? 'border-primary bg-primary/10 text-white' 
                  : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50'
              }`}
            >
              <Checkbox
                id="corre_atualmente"
                checked={formData.corre_atualmente}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, corre_atualmente: checked }))}
                className={formData.corre_atualmente ? 'border-primary bg-primary text-black' : ''}
              />
              <div>
                <span className="font-semibold">Corre atualmente</span>
                <p className="text-xs text-zinc-500">Marque se você pratica corrida regularmente</p>
              </div>
            </label>

            {formData.corre_atualmente && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pl-4 border-l-2 border-primary/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white font-medium text-sm">Experiência (meses) — 12 = 1 ano</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 24 (2 anos)"
                      value={formData.tempo_experiencia_meses}
                      onChange={(e) => setFormData(prev => ({ ...prev, tempo_experiencia_meses: e.target.value }))}
                      className="h-11 bg-zinc-800/50 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white font-medium text-sm">Dias por semana</Label>
                    <Input
                      type="number"
                      min="0"
                      max="7"
                      placeholder="Ex: 3"
                      value={formData.dias_corrida_semana}
                      onChange={(e) => setFormData(prev => ({ ...prev, dias_corrida_semana: e.target.value }))}
                      className="h-11 bg-zinc-800/50 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white font-medium text-sm">Maior distância (km)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 10"
                      value={formData.maior_distancia_recente_km}
                      onChange={(e) => setFormData(prev => ({ ...prev, maior_distancia_recente_km: e.target.value }))}
                      className="h-11 bg-zinc-800/50 border-zinc-700"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Dor atual */}
          <div className="space-y-4">
            <label
              htmlFor="dor_atual"
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                formData.dor_atual 
                  ? 'border-red-500/50 bg-red-500/10 text-white' 
                  : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/50'
              }`}
            >
              <Checkbox
                id="dor_atual"
                checked={formData.dor_atual}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dor_atual: checked }))}
                className={formData.dor_atual ? 'border-red-500 bg-red-500 text-white' : ''}
              />
              <div>
                <span className="font-semibold">Tem dor atualmente</span>
                <p className="text-xs text-zinc-500">Alguma lesão ou desconforto?</p>
              </div>
            </label>

            {formData.dor_atual && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4 pl-4 border-l-2 border-red-500/30"
              >
                <div className="space-y-2">
                  <Label className="text-white font-medium text-sm">Local da dor</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { id: 'joelho', label: 'Joelho' },
                      { id: 'quadril', label: 'Quadril' },
                      { id: 'tornozelo', label: 'Tornozelo' },
                      { id: 'canela', label: 'Canela' },
                      { id: 'lombar', label: 'Lombar' },
                      { id: 'pe', label: 'Pé' }
                    ].map((local) => {
                      const isChecked = formData.local_dor.includes(local.id);
                      return (
                        <label
                          key={local.id}
                          htmlFor={`dor-${local.id}`}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                            isChecked 
                              ? 'border-red-500/50 bg-red-500/10 text-white' 
                              : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                          }`}
                        >
                          <Checkbox
                            id={`dor-${local.id}`}
                            checked={isChecked}
                            onCheckedChange={() => toggleLocalDor(local.id)}
                            className={isChecked ? 'border-red-500 bg-red-500 text-white' : ''}
                          />
                          {local.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-medium text-sm">Intensidade (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    placeholder="Ex: 5"
                    value={formData.dor_intensidade_0_10}
                    onChange={(e) => setFormData(prev => ({ ...prev, dor_intensidade_0_10: e.target.value }))}
                    className="h-11 bg-zinc-800/50 border-zinc-700 max-w-[150px]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor="dor_piora"
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                      formData.dor_piora_corrida 
                        ? 'border-orange-500/50 bg-orange-500/10 text-white' 
                        : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <Checkbox
                      id="dor_piora"
                      checked={formData.dor_piora_corrida}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dor_piora_corrida: checked }))}
                    />
                    Piora com corrida
                  </label>
                  <label
                    htmlFor="dor_impede"
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                      formData.dor_impede_corrida 
                        ? 'border-red-500/50 bg-red-500/10 text-white' 
                        : 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <Checkbox
                      id="dor_impede"
                      checked={formData.dor_impede_corrida}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dor_impede_corrida: checked }))}
                    />
                    Impede de correr
                  </label>
                </div>
              </motion.div>
            )}
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
