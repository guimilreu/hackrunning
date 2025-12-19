import { Card, CardContent } from '@/components/ui/card';
import { Footprints, Trophy, Timer, TrendingUp, Activity } from 'lucide-react';

export function StatsOverview({ stats }) {
  const formatDuration = (seconds) => {
    if (!seconds) return '0min';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    
    if (h > 0 && m > 0) {
      return `${h}h ${m}min`;
    } else if (h > 0) {
      return `${h}h`;
    } else {
      return `${m}min`;
    }
  };

  const formatPace = (secondsPerKm) => {
    if (!secondsPerKm) return "0'00\"";
    const m = Math.floor(secondsPerKm / 60);
    const s = Math.round(secondsPerKm % 60);
    return `${m}'${s < 10 ? '0' : ''}${s}"`;
  };

  const items = [
    {
      label: 'Distância Total',
      value: `${stats?.totalDistance || 0} km`,
      icon: Footprints,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Total de Treinos',
      value: stats?.totalWorkouts || 0,
      icon: TrendingUp,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Tempo Total',
      value: formatDuration(stats?.totalTime),
      icon: Timer,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Pace Médio',
      value: formatPace(stats?.averagePace),
      icon: Activity,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  // Activity icon fallback since I used it inside items but didn't import it in the array definition scope if not careful, 
  // but I'll import it at the top. Wait, I imported Footprints, Trophy, Timer, TrendingUp.
  // Let me replace Activity with TrendingUp or add Activity to imports.
  // Actually, let's use Zap or something for Pace. Speedometer would be better but lucide might not have it.
  // Gauge is good.

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <Card key={index} className="glass-card border-white/5">
          <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center">
            <div className={`p-3 rounded-2xl ${item.bg} mb-4`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <p className="text-zinc-400 text-xs uppercase font-bold tracking-wider mb-1">
              {item.label}
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-white">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
