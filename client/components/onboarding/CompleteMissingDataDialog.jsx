'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeekDaySelector } from '@/components/ui/week-day-selector';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function CompleteMissingDataDialog({ open, onOpenChange, missingData }) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [formData, setFormData] = useState({
    bodyMetrics: {},
    physicalTests: {},
    availability: {
      trainingDays: []
    },
    objetivo_principal: '',
    runningHistory: {},
    pain: {},
    lifestyle: {},
    metabolicHealth: {}
  });

  // Carregar dados quando o diálogo abrir ou quando missingData mudar
  useEffect(() => {
    const loadData = async () => {
      // Se já tem missingData, usar ele
      if (missingData?.currentData) {
        setFormData({
          bodyMetrics: {
            altura_cm: missingData.currentData.altura_cm || '',
            peso_kg: missingData.currentData.peso_kg || '',
            cintura_cm: missingData.currentData.cintura_cm || '',
            quadril_cm: missingData.currentData.quadril_cm || ''
          },
          physicalTests: {
            teste6_distancia_m: missingData.currentData.teste6_distancia_m || '',
            teste1km_tempo_segundos: missingData.currentData.teste1km_tempo_segundos 
              ? (typeof missingData.currentData.teste1km_tempo_segundos === 'number' 
                  ? `${Math.floor(missingData.currentData.teste1km_tempo_segundos / 60)}:${(missingData.currentData.teste1km_tempo_segundos % 60).toString().padStart(2, '0')}`
                  : missingData.currentData.teste1km_tempo_segundos)
              : '',
            teste6_esforco_0_10: missingData.currentData.teste6_esforco_0_10 || '',
            teste1km_esforco_0_10: missingData.currentData.teste1km_esforco_0_10 || ''
          },
          availability: {
            trainingDays: missingData.currentData.trainingDays || [],
            tempo_max_sessao_min: missingData.currentData.tempo_max_sessao_min || ''
          },
          objetivo_principal: missingData.currentData.objetivo_principal || '',
          runningHistory: missingData.currentData.runningHistory || {},
          pain: missingData.currentData.pain || {},
          lifestyle: missingData.currentData.lifestyle || {},
          metabolicHealth: missingData.currentData.metabolicHealth || {}
        });
      } else if (open) {
        // Se o diálogo abriu mas não tem missingData, buscar os dados
        setIsLoadingData(true);
        try {
          const response = await api.get('/training-plans/check-missing-data');
          const data = response.data?.data;
          if (data?.currentData) {
            setFormData({
              bodyMetrics: {
                altura_cm: data.currentData.altura_cm || '',
                peso_kg: data.currentData.peso_kg || '',
                cintura_cm: data.currentData.cintura_cm || '',
                quadril_cm: data.currentData.quadril_cm || ''
              },
              physicalTests: {
                teste6_distancia_m: data.currentData.teste6_distancia_m || '',
                teste1km_tempo_segundos: data.currentData.teste1km_tempo_segundos 
                  ? (typeof data.currentData.teste1km_tempo_segundos === 'number' 
                      ? `${Math.floor(data.currentData.teste1km_tempo_segundos / 60)}:${(data.currentData.teste1km_tempo_segundos % 60).toString().padStart(2, '0')}`
                      : data.currentData.teste1km_tempo_segundos)
                  : '',
                teste6_esforco_0_10: data.currentData.teste6_esforco_0_10 || '',
                teste1km_esforco_0_10: data.currentData.teste1km_esforco_0_10 || ''
              },
              availability: {
                trainingDays: data.currentData.trainingDays || [],
                tempo_max_sessao_min: data.currentData.tempo_max_sessao_min || ''
              },
              objetivo_principal: data.currentData.objetivo_principal || '',
              runningHistory: data.currentData.runningHistory || {},
              pain: data.currentData.pain || {},
              lifestyle: data.currentData.lifestyle || {},
              metabolicHealth: data.currentData.metabolicHealth || {}
            });
          }
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    loadData();
  }, [missingData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    const requiredFields = missingData?.missingFields || fieldsToShow;
    const hasAllRequired = requiredFields.every(field => {
      if (field === 'altura_cm') return formData.bodyMetrics.altura_cm;
      if (field === 'peso_kg') return formData.bodyMetrics.peso_kg;
      if (field === 'cintura_cm') return formData.bodyMetrics.cintura_cm;
      if (field === 'quadril_cm') return formData.bodyMetrics.quadril_cm;
      if (field === 'teste6_distancia_m') return formData.physicalTests.teste6_distancia_m;
      if (field === 'teste1km_tempo_segundos') return formData.physicalTests.teste1km_tempo_segundos;
      if (field === 'trainingDays') return formData.availability.trainingDays && formData.availability.trainingDays.length >= 2;
      if (field === 'tempo_max_sessao_min') return formData.availability.tempo_max_sessao_min;
      if (field === 'objetivo_principal') return formData.objetivo_principal;
      return true;
    });

    if (!hasAllRequired) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsPending(true);
    try {
      await api.post('/training-plans/generate-from-missing-data', formData);
      toast.success('Planilha gerada com sucesso!');
      await queryClient.invalidateQueries({ queryKey: ['trainingPlan'] });
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao gerar planilha');
    } finally {
      setIsPending(false);
    }
  };

  const missingFields = missingData?.missingFields || [];
  
  // Se não tem missingData ainda, ou se hasAllData é false mas não tem campos específicos, mostrar todos os campos possíveis
  const showAllFields = !missingData || (missingData && !missingData.hasAllData && missingFields.length === 0);
  const fieldsToShow = showAllFields 
    ? ['altura_cm', 'peso_kg', 'cintura_cm', 'quadril_cm', 'teste6_distancia_m', 'teste1km_tempo_segundos', 'trainingDays', 'tempo_max_sessao_min', 'objetivo_principal']
    : missingFields;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-primary" />
            Complete seus dados para gerar seu treino
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Preencha os campos abaixo para gerarmos sua planilha personalizada. Os campos já preenchidos estão marcados.
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-zinc-400">Carregando seus dados...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Dados Corporais */}
          {(fieldsToShow.includes('altura_cm') || fieldsToShow.includes('peso_kg') || 
            fieldsToShow.includes('cintura_cm') || fieldsToShow.includes('quadril_cm')) && (
            <div className="space-y-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
              <h3 className="font-bold text-white">Dados Corporais</h3>
              <div className="grid grid-cols-2 gap-4">
                {fieldsToShow.includes('altura_cm') && (
                  <div>
                    <Label className="text-zinc-300">Altura (cm) *</Label>
                    <Input
                      type="number"
                      value={formData.bodyMetrics.altura_cm}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bodyMetrics: { ...prev.bodyMetrics, altura_cm: e.target.value }
                      }))}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
                {fieldsToShow.includes('peso_kg') && (
                  <div>
                    <Label className="text-zinc-300">Peso (kg) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.bodyMetrics.peso_kg}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bodyMetrics: { ...prev.bodyMetrics, peso_kg: e.target.value }
                      }))}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
                {fieldsToShow.includes('cintura_cm') && (
                  <div>
                    <Label className="text-zinc-300">Cintura (cm) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.bodyMetrics.cintura_cm}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bodyMetrics: { ...prev.bodyMetrics, cintura_cm: e.target.value }
                      }))}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
                {fieldsToShow.includes('quadril_cm') && (
                  <div>
                    <Label className="text-zinc-300">Quadril (cm) *</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.bodyMetrics.quadril_cm}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bodyMetrics: { ...prev.bodyMetrics, quadril_cm: e.target.value }
                      }))}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Testes Físicos */}
          {(fieldsToShow.includes('teste6_distancia_m') || fieldsToShow.includes('teste1km_tempo_segundos')) && (
            <div className="space-y-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
              <h3 className="font-bold text-white">Testes Físicos</h3>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-300">
                  <strong>Importante:</strong> Faça os testes em dias diferentes, com pelo menos 24h de descanso entre eles.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {fieldsToShow.includes('teste6_distancia_m') && (
                  <div>
                    <Label className="text-zinc-300">Teste 6 min - Distância (metros) *</Label>
                    <Input
                      type="number"
                      value={formData.physicalTests.teste6_distancia_m}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        physicalTests: { ...prev.physicalTests, teste6_distancia_m: e.target.value }
                      }))}
                      className="mt-1"
                      placeholder="Ex: 1200"
                      required
                    />
                  </div>
                )}
                {fieldsToShow.includes('teste1km_tempo_segundos') && (
                  <div>
                    <Label className="text-zinc-300">Teste 1km - Tempo (min:seg) *</Label>
                    <Input
                      type="text"
                      value={formData.physicalTests.teste1km_tempo_segundos}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        physicalTests: { ...prev.physicalTests, teste1km_tempo_segundos: e.target.value }
                      }))}
                      className="mt-1"
                      placeholder="Ex: 5:30"
                      required
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-300">Esforço 6 min (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.physicalTests.teste6_esforco_0_10}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      physicalTests: { ...prev.physicalTests, teste6_esforco_0_10: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300">Esforço 1km (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.physicalTests.teste1km_esforco_0_10}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      physicalTests: { ...prev.physicalTests, teste1km_esforco_0_10: e.target.value }
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Disponibilidade */}
          {(fieldsToShow.includes('trainingDays') || fieldsToShow.includes('tempo_max_sessao_min')) && (
            <div className="space-y-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
              <h3 className="font-bold text-white">Disponibilidade</h3>
              {fieldsToShow.includes('trainingDays') && (
                <div>
                  <Label className="text-zinc-300">Quais dias você quer treinar? *</Label>
                  <p className="text-xs text-zinc-500 mb-3 mt-1">
                    Selecione os dias da semana em que você pode treinar (mínimo 2, máximo 6 dias)
                  </p>
                  <WeekDaySelector
                    selectedDays={formData.availability.trainingDays || []}
                    onChange={(days) => setFormData(prev => ({
                      ...prev,
                      availability: { ...prev.availability, trainingDays: days }
                    }))}
                    minDays={2}
                    maxDays={6}
                  />
                </div>
              )}
              {fieldsToShow.includes('tempo_max_sessao_min') && (
                <div>
                  <Label className="text-zinc-300">Tempo máximo por sessão (min) *</Label>
                  <Select
                    value={formData.availability.tempo_max_sessao_min?.toString()}
                    onValueChange={(v) => setFormData(prev => ({
                      ...prev,
                      availability: { ...prev.availability, tempo_max_sessao_min: parseInt(v) }
                    }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Objetivo Principal */}
          {fieldsToShow.includes('objetivo_principal') && (
            <div className="space-y-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
              <h3 className="font-bold text-white">Objetivo Principal *</h3>
              <RadioGroup
                value={formData.objetivo_principal}
                onValueChange={(v) => setFormData(prev => ({ ...prev, objetivo_principal: v }))}
              >
                <div className="space-y-3">
                  {[
                    { value: 'emagrecimento', label: 'Emagrecimento' },
                    { value: 'saude_longevidade', label: 'Saúde e Longevidade' },
                    { value: 'iniciar_corrida', label: 'Iniciar na Corrida' },
                    { value: 'completar_5km', label: 'Completar 5km' },
                    { value: 'melhorar_condicionamento', label: 'Melhorar Condicionamento' },
                    { value: 'performance', label: 'Performance' }
                  ].map((opt) => (
                    <div key={opt.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.value} />
                      <Label htmlFor={opt.value} className="text-zinc-300 cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-black font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                'Gerar Minha Planilha'
              )}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
