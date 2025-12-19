'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Clock, BookOpen, Lock, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await api.get('/content?type=class');
      // Backend retorna { success: true, data: { contents, pagination } }
      const data = response.data?.data || response.data;
      return data?.contents || data || [];
    },
  });
};

export default function ClassesPage() {
  const { user } = useAuthStore();
  const { data: classes, isLoading } = useClasses();
  const isPremium = user?.plan === 'premium';

  // Extrair dados da API e garantir que seja sempre um array
  const getDisplayClasses = () => {
    if (isLoading) {
      return null;
    }
    
    if (classes) {
      if (Array.isArray(classes)) {
        return classes;
      }
      if (Array.isArray(classes.content)) {
        return classes.content;
      }
      if (Array.isArray(classes.data)) {
        return classes.data;
      }
      if (Array.isArray(classes.classes)) {
        return classes.classes;
      }
    }
    
    return [];
  };

  const displayClasses = getDisplayClasses();

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
            <h1 className="text-4xl font-bold tracking-tighter text-white">Aulas</h1>
            <p className="text-zinc-400 mt-2">Conhecimento que te leva mais longe.</p>
        </div>
      </div>

      {!isPremium && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-yellow-500/10 to-primary/5 border border-primary/20 rounded-3xl p-6 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-12 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500">
                    <Star className="h-6 w-6 fill-current" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">Desbloqueie Todo o Conteúdo</h3>
                    <p className="text-zinc-400 text-sm max-w-xl mb-4">
                        Membros Free têm acesso a apenas 1 aula por mês. Torne-se Premium para assistir ilimitado.
                    </p>
                    <Button size="sm" className="bg-primary text-black font-bold hover:bg-primary/90 rounded-full">
                        Fazer Upgrade
                    </Button>
                </div>
            </div>
        </motion.div>
      )}

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {isLoading || displayClasses === null ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-3xl bg-white/5" />)
        ) : displayClasses.length === 0 ? (
          <div className="col-span-full text-center py-20 text-zinc-500">
            Nenhuma aula disponível no momento.
          </div>
        ) : (
          displayClasses.map((classItem) => (
            <motion.div variants={item} key={classItem._id}>
                <div className="glass-card rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 group flex flex-col h-full">
                    {/* Thumbnail */}
                    <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                        {classItem.thumbnail ? (
                        <Image 
                            src={classItem.thumbnail} 
                            alt={classItem.title} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <Play className="w-12 h-12 text-zinc-600 opacity-50" />
                            </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

                        <div className="absolute top-4 right-4 flex gap-2">
                            {classItem.premiumOnly && !isPremium && (
                                <Badge className="bg-black/60 backdrop-blur-md text-white border border-white/10">
                                    <Lock className="w-3 h-3 mr-1" /> Premium
                                </Badge>
                            )}
                            <Badge className="bg-primary/90 text-black border-0 font-bold">
                                {classItem.category || 'Aula'}
                            </Badge>
                        </div>

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-black shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                <Play className="w-6 h-6 ml-1 fill-current" />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {classItem.title}
                        </h3>
                        <p className="text-sm text-zinc-400 line-clamp-2 mb-6 flex-1">
                            {classItem.description}
                        </p>

                        <div className="flex items-center justify-between text-xs font-medium text-zinc-500 pt-4 border-t border-white/5">
                            <div className="flex items-center bg-white/5 px-2 py-1 rounded-lg">
                                <Clock className="h-3 w-3 mr-1.5" />
                                {classItem.duration || 'N/A'}
                            </div>
                            {classItem.instructor && (
                                <div className="flex items-center">
                                    <BookOpen className="h-3 w-3 mr-1.5" />
                                    {classItem.instructor}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-4">
                            <Link href={`/app/classes/${classItem._id}`} className="block">
                                <Button className="w-full rounded-xl font-bold bg-white/5 hover:bg-white hover:text-black text-white transition-colors">
                                    Assistir Agora
                                </Button>
                            </Link>
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
