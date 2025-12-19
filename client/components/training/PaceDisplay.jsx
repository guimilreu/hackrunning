'use client';

import { Info, Gauge, TrendingUp, Zap, Flame, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
// Tooltip removido - usando hover simples

/**
 * Converte segundos por km para formato legível
 */
const formatPace = (secondsPerKm) => {
  if (!secondsPerKm) return 'N/A';
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
};

/**
 * Componente para exibir ritmos calculados com explicações
 */
export function PaceDisplay({ paces, className = '' }) {
  if (!paces || Object.keys(paces).length === 0) {
    return null;
  }

  const zones = [
    {
      name: 'Z1',
      label: 'Zona 1 - Regenerativa',
      icon: Heart,
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      pace: paces.z1,
      description: 'Ritmo muito leve para recuperação ativa. Você consegue conversar facilmente.'
    },
    {
      name: 'Z2',
      label: 'Zona 2 - Aeróbica',
      icon: Gauge,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      pace: paces.z2,
      description: 'Ritmo confortável onde você desenvolve a base aeróbica. Consegue manter uma conversa.'
    },
    {
      name: 'T',
      label: 'Threshold - Limiar',
      icon: TrendingUp,
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      pace: { min_s_per_km: paces.t_s_per_km, max_s_per_km: paces.t_s_per_km },
      description: 'Ritmo forte mas sustentável. Melhora seu limiar de lactato. Consegue falar frases curtas.'
    },
    {
      name: 'I',
      label: 'Intervalado - VO2',
      icon: Zap,
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      pace: { min_s_per_km: paces.i_s_per_km, max_s_per_km: paces.i_s_per_km },
      description: 'Alta intensidade para melhorar VO2 máx. Recuperação ativa entre intervalos.'
    },
    {
      name: 'R',
      label: 'Rápido - Velocidade',
      icon: Flame,
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      pace: { min_s_per_km: paces.r_s_per_km, max_s_per_km: paces.r_s_per_km },
      description: 'Velocidade máxima para melhorar economia de corrida. Tiros curtos com recuperação completa.'
    },
    {
      name: 'LR',
      label: 'Longão',
      icon: Gauge,
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      pace: paces.long_run,
      description: 'Corrida longa em ritmo confortável para construir resistência e base aeróbica.'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-white">Seus Ritmos de Treino</h3>
        <Info className="w-4 h-4 text-zinc-400" title="Estes ritmos foram calculados baseados nos seus testes físicos. Use-os como referência durante seus treinos." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {zones.map((zone) => {
          const Icon = zone.icon;
          const isRange = zone.pace?.min_s_per_km !== zone.pace?.max_s_per_km;
          const paceDisplay = isRange
            ? `${formatPace(zone.pace.min_s_per_km)} - ${formatPace(zone.pace.max_s_per_km)}`
            : formatPace(zone.pace?.min_s_per_km);

          return (
            <div
              key={zone.name}
              className={`p-4 rounded-xl border ${zone.color} transition-all hover:scale-105 group relative`}
              title={zone.description}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5" />
                <span className="font-bold text-sm">{zone.name}</span>
              </div>
              <div className="text-xs text-zinc-300 mb-1">{zone.label}</div>
              <div className="font-mono font-bold text-lg">{paceDisplay}</div>
              {/* Tooltip simples no hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 border border-white/10 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 max-w-xs">
                <p className="font-semibold mb-1">{zone.label}</p>
                <p className="text-zinc-300">{zone.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Componente para exibir pace range de um treino específico
 */
export function WorkoutPaceDisplay({ workout, className = '' }) {
  if (!workout?.pace_range) {
    return null;
  }

  const { min_s_per_km, max_s_per_km } = workout.pace_range;
  const isRange = min_s_per_km !== max_s_per_km;
  const paceDisplay = isRange
    ? `${formatPace(min_s_per_km)} - ${formatPace(max_s_per_km)}`
    : formatPace(min_s_per_km);

  return (
    <span className={`flex items-center gap-2 bg-white/5 px-2 py-1 rounded-md ${className}`}>
      <Gauge className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-mono font-bold text-zinc-300">
        {paceDisplay}
      </span>
    </span>
  );
}

/**
 * Componente para exibir steps detalhados de um treino
 */
export function WorkoutStepsDisplay({ workout, className = '' }) {
  if (!workout?.steps || workout.steps.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
        Estrutura do Treino
      </div>
      <div className="space-y-1.5">
        {workout.steps.map((step, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/5"
          >
            <span className="text-primary font-bold text-xs w-6">{index + 1}.</span>
            <span className="text-zinc-300">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
