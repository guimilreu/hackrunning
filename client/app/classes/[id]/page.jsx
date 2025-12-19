'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play, Clock, BookOpen, Lock, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import Image from 'next/image';

const useClass = (id) => {
  return useQuery({
    queryKey: ['class', id],
    queryFn: async () => {
      const response = await api.get(`/content/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
};

export default function ClassDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: classItem, isLoading } = useClass(id);
  const isPremium = user?.plan === 'premium';
  const canAccess = !classItem?.premiumOnly || isPremium;

  if (isLoading) {
    return (
      <div className="space-y-8 pb-10">
        <Skeleton className="h-12 w-48 bg-white/5 rounded-2xl" />
        <Skeleton className="h-96 w-full bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="space-y-8 pb-10 text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Aula não encontrada</h2>
        <Button onClick={() => router.back()} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-10"
    >
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Aulas
      </Button>

      {/* Hero Section */}
      <div className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <Badge className="bg-primary/20 text-primary border-0 px-4 py-1.5 text-sm font-bold">
              {classItem.category || 'Aula'}
            </Badge>
            {classItem.premiumOnly && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-0 px-4 py-1.5 text-sm font-bold flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Premium
              </Badge>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {classItem.title}
          </h1>

          {classItem.description && (
            <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
              {classItem.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            {classItem.duration && (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-white">{classItem.duration}</span>
              </div>
            )}
            {classItem.instructor && (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-white">{classItem.instructor}</span>
              </div>
            )}
          </div>

          {/* Video Player */}
          <div className="mb-8">
            {canAccess ? (
              <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/5">
                {classItem.videoUrl ? (
                  <video 
                    src={classItem.videoUrl} 
                    controls 
                    className="w-full h-full"
                    controlsList="nodownload"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400">Vídeo não disponível</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-white/5">
                {classItem.thumbnail && (
                  <Image
                    src={classItem.thumbnail}
                    alt={classItem.title}
                    fill
                    className="object-cover opacity-50"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center p-8">
                    <Lock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Conteúdo Premium</h3>
                    <p className="text-zinc-400 mb-6 max-w-md">
                      Esta aula é exclusiva para membros Premium. Faça upgrade para ter acesso ilimitado a todo o conteúdo.
                    </p>
                    <Button className="bg-primary text-black font-bold hover:bg-primary/90 rounded-full px-8">
                      Fazer Upgrade
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {canAccess && classItem.content && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Conteúdo da Aula</h3>
              <div className="prose prose-invert max-w-none text-zinc-300">
                <div dangerouslySetInnerHTML={{ __html: classItem.content }} />
              </div>
            </div>
          )}

          {/* Materials */}
          {canAccess && classItem.materials && classItem.materials.length > 0 && (
            <div className="mb-8 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
              <h3 className="text-xl font-bold text-white mb-4">Materiais Complementares</h3>
              <ul className="space-y-2">
                {classItem.materials.map((material, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-zinc-300">
                    <span className="text-primary mt-1">•</span>
                    <span>{material}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t border-white/5">
            <Button
              variant="outline"
              className="w-full border-white/20 hover:bg-white hover:text-black h-12 rounded-xl font-bold"
              onClick={() => router.push('/classes')}
            >
              Ver Outras Aulas
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
