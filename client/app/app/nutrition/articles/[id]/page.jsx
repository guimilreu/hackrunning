'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookOpen, Calendar, Share2 } from 'lucide-react';
import { safeFormatDate } from '@/lib/utils/date';
import { motion } from 'framer-motion';
import Image from 'next/image';

const useArticle = (id) => {
  return useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const response = await api.get(`/content/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
};

export default function ArticleDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: article, isLoading } = useArticle(id);

  if (isLoading) {
    return (
      <div className="space-y-8 pb-10">
        <Skeleton className="h-12 w-48 bg-white/5 rounded-2xl" />
        <Skeleton className="h-96 w-full bg-white/5 rounded-3xl" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="space-y-8 pb-10 text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Artigo não encontrado</h2>
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
      className="space-y-8 pb-10 max-w-4xl mx-auto"
    >
      <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 hover:pl-2 transition-all">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para Artigos
      </Button>

      {/* Hero Section */}
      <div className="glass-card rounded-3xl overflow-hidden relative">
        {article.thumbnail && (
          <div className="relative w-full h-64 md:h-96 bg-zinc-900">
            <Image 
              src={article.thumbnail} 
              alt={article.title} 
              fill 
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        )}
        
        <div className="p-8 md:p-12 relative">
          <div className="flex items-center gap-3 mb-6">
            <Badge className="bg-primary/20 text-primary border-0 px-4 py-1.5 text-sm font-bold">
              {article.category || 'Artigo'}
            </Badge>
            {article.createdAt && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Calendar className="h-4 w-4" />
                {article.createdAt ? safeFormatDate(article.createdAt, "dd 'de' MMMM 'de' yyyy") : 'Data não disponível'}
              </div>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {article.title}
          </h1>

          {article.description && (
            <p className="text-xl text-zinc-300 mb-8 leading-relaxed">
              {article.description}
            </p>
          )}

          <div className="flex items-center gap-4 pt-6 border-t border-white/5">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 hover:bg-white hover:text-black"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: article.title,
                    text: article.description,
                    url: window.location.href,
                  });
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="glass-card rounded-3xl p-8 md:p-12">
        {article.content ? (
          <div className="prose prose-invert prose-lg max-w-none text-zinc-300">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        ) : (
          <p className="text-zinc-400 text-center py-12">Conteúdo não disponível.</p>
        )}
      </div>

      {/* Related Articles */}
      <div className="pt-6 border-t border-white/5">
        <Button
          variant="outline"
          className="w-full border-white/20 hover:bg-white hover:text-black h-12 rounded-xl font-bold"
          onClick={() => router.push('/app/nutrition/articles')}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Ver Outros Artigos
        </Button>
      </div>
    </motion.div>
  );
}
