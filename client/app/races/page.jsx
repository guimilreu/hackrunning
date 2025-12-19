'use client';

import { useEvents } from '@/hooks/useEvents';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MapPin, ExternalLink, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { safeFormatDate } from '@/lib/utils/date';
import { motion } from 'framer-motion';

export default function RacesPage() {
  const { data: races, isLoading } = useEvents('race');

  // Extrair dados da API
  const getDisplayRaces = () => {
    if (isLoading) {
      return null;
    }
    
    if (races) {
      if (Array.isArray(races)) {
        return races;
      }
      if (Array.isArray(races.races)) {
        return races.races;
      }
      if (Array.isArray(races.data)) {
        return races.data;
      }
      if (Array.isArray(races.events)) {
        return races.events;
      }
    }
    
    return [];
  };

  const displayRaces = getDisplayRaces();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tighter text-white">Calendário</h1>
            <p className="text-zinc-400 mt-2">Próximas provas e eventos oficiais.</p>
        </div>
      </div>

      <motion.div 
        key={`races-${isLoading}-${displayRaces?.length || 0}-${displayRaces?.map(r => r._id).join(',') || ''}`}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {isLoading || displayRaces === null ? (
             Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[350px] w-full rounded-3xl bg-white/5" />)
        ) : displayRaces.length === 0 ? (
            <motion.div 
              variants={item}
              className="col-span-full text-center py-20 flex flex-col items-center"
            >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Trophy className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Nenhuma prova encontrada</h3>
                <p className="text-zinc-400">Volte em breve para novas provas.</p>
            </motion.div>
        ) : (
            displayRaces.map((race) => (
                <motion.div variants={item} key={race._id}>
                    <div className="glass-card rounded-3xl p-6 flex flex-col h-full hover:border-primary/30 transition-all duration-300 group relative overflow-hidden">
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors pointer-events-none" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-6">
                                 <Badge variant="outline" className="bg-white/5 text-white border-white/10 px-3 py-1 font-bold">
                                    {race.date ? safeFormatDate(race.date, "MMM yyyy").toUpperCase() : 'DATA NÃO DISPONÍVEL'}
                                 </Badge>
                                 <div className="p-2 rounded-full bg-white/5 text-yellow-500">
                                    <Trophy className="h-5 w-5" />
                                 </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                                {race.name}
                            </h3>
                            
                            <div className="space-y-3 mt-4 mb-6 flex-1">
                                <div className="flex items-center text-sm text-zinc-400">
                                    <Calendar className="h-4 w-4 mr-3 text-zinc-500" />
                                    {race.date ? safeFormatDate(race.date, "dd 'de' MMMM, EEEE") : 'Data não disponível'}
                                </div>
                                <div className="flex items-center text-sm text-zinc-400">
                                    <MapPin className="h-4 w-4 mr-3 text-zinc-500" />
                                    {race.location?.address ? `${race.location.address}, ${race.location.city}, ${race.location.state}` : (typeof race.location === 'string' ? race.location : 'Local a definir')}
                                </div>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {race.distances.map(d => (
                                        <span key={d} className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t border-white/5 mt-auto">
                                 <Link href={`/races/${race._id}`} className="flex-1">
                                    <Button variant="secondary" className="w-full bg-white/5 hover:bg-white text-white hover:text-black transition-colors rounded-xl">Detalhes</Button>
                                 </Link>
                                 {race.externalLink && (
                                     <Link href={race.externalLink} target="_blank" className="flex-1">
                                        <Button className="w-full bg-primary text-black font-bold hover:bg-primary/90 rounded-xl">
                                            Inscrição 
                                        </Button>
                                     </Link>
                                 )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))
        )}
      </motion.div>
    </div>
  );
}
