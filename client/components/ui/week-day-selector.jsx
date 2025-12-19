'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

const WEEKDAYS = [
  { id: 0, short: 'D', long: 'Domingo' },
  { id: 1, short: 'S', long: 'Segunda' },
  { id: 2, short: 'T', long: 'Terça' },
  { id: 3, short: 'Q', long: 'Quarta' },
  { id: 4, short: 'Q', long: 'Quinta' },
  { id: 5, short: 'S', long: 'Sexta' },
  { id: 6, short: 'S', long: 'Sábado' },
];

/**
 * Componente para seleção visual de dias da semana
 * @param {Array} selectedDays - Array de números (0-6) representando os dias selecionados
 * @param {Function} onChange - Callback chamado quando a seleção muda
 * @param {number} minDays - Número mínimo de dias que devem ser selecionados (padrão: 2)
 * @param {number} maxDays - Número máximo de dias que podem ser selecionados (padrão: 6)
 */
export function WeekDaySelector({ 
  selectedDays = [], 
  onChange, 
  minDays = 2, 
  maxDays = 6,
  error 
}) {
  const handleDayToggle = (dayId) => {
    const isSelected = selectedDays.includes(dayId);
    
    if (isSelected) {
      // Remover dia, mas verificar se não fica abaixo do mínimo
      const newSelection = selectedDays.filter(d => d !== dayId);
      if (newSelection.length >= minDays) {
        onChange(newSelection);
      }
    } else {
      // Adicionar dia, mas verificar se não ultrapassa o máximo
      if (selectedDays.length < maxDays) {
        onChange([...selectedDays, dayId].sort((a, b) => a - b));
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          const canDeselect = selectedDays.length > minDays;
          const canSelect = selectedDays.length < maxDays;
          const isDisabled = isSelected ? !canDeselect : !canSelect;

          return (
            <button
              key={day.id}
              type="button"
              onClick={() => handleDayToggle(day.id)}
              disabled={isDisabled}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl transition-all duration-200 group relative",
                "w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-14 md:h-14",
                isSelected
                  ? "bg-primary text-black font-bold shadow-[0_4px_14px_0_rgba(238,255,0,0.39)] scale-105"
                  : "bg-zinc-900/50 border border-white/5 text-zinc-400 hover:bg-zinc-800 hover:border-white/20 hover:text-white",
                isDisabled && !isSelected && "opacity-40 cursor-not-allowed",
                error && "border-red-500/30"
              )}
              title={day.long}
            >
              <span className={cn(
                "text-xs sm:text-sm font-bold",
                isSelected && "text-black"
              )}>
                {day.short}
              </span>
              
              {/* Tooltip on hover */}
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-zinc-400 whitespace-nowrap pointer-events-none">
                {day.long}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Info text */}
      <div className="flex items-center justify-between text-xs">
        <p className={cn(
          "text-zinc-500",
          error && "text-red-500"
        )}>
          {error || `Selecione de ${minDays} a ${maxDays} dias`}
        </p>
        <p className="text-zinc-400 font-medium">
          {selectedDays.length} {selectedDays.length === 1 ? 'dia' : 'dias'} selecionado{selectedDays.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
