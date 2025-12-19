import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Activity, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatWorkoutType } from '@/lib/utils/workouts';

export function ActivityCard({ activity, onClick }) {
  const { date, workoutType, distance, time, pace, photo, hpoints } = activity;

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
  };

  const formatPace = (secondsPerKm) => {
    const m = Math.floor(secondsPerKm / 60);
    const s = Math.round(secondsPerKm % 60);
    return `${m}'${s < 10 ? '0' : ''}${s}"/km`;
  };

  const getWorkoutColor = (type) => {
    const colors = {
      base: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      long_run: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      interval: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      recovery: 'bg-green-500/10 text-green-500 border-green-500/20',
      race: 'bg-red-500/10 text-red-500 border-red-500/20',
      strength: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    };
    return colors[type] || colors.base;
  };

  return (
    <Card 
      className={`glass-card overflow-hidden border-white/5 hover:border-primary/20 transition-all group ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left: Photo or Map Placeholder */}
          <div className="w-full sm:w-48 h-32 sm:h-auto bg-zinc-900 relative shrink-0">
            {photo?.url ? (
              <img 
                src={photo.url} 
                alt="Treino" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white/5">
                <Activity className="w-8 h-8 text-zinc-700" />
              </div>
            )}
            
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className={`backdrop-blur-md ${getWorkoutColor(workoutType)}`}>
                {formatWorkoutType(workoutType)}
              </Badge>
            </div>
          </div>

          {/* Right: Details */}
          <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center text-zinc-400 text-sm mb-1">
                  <Calendar className="w-3 h-3 mr-2" />
                  {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                <h3 className="text-xl font-bold text-white">
                  {distance} km
                  <span className="text-zinc-500 text-sm font-normal ml-2">de corrida</span>
                </h3>
              </div>
              {hpoints?.points > 0 && (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-primary font-bold uppercase">HPoints</span>
                  <div className="flex items-center text-primary font-bold">
                    <Trophy className="w-4 h-4 mr-1" />
                    +{hpoints.points}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Clock className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold">Tempo</p>
                  <p className="text-white font-mono">{formatDuration(time)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/5">
                  <Activity className="w-4 h-4 text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500 uppercase font-bold">Pace Médio</p>
                  <p className="text-white font-mono">{formatPace(pace)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

