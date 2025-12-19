'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, BookOpen, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';

const useArticles = () => {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const response = await api.get('/content?type=article');
      // Backend retorna { success: true, data: { contents, pagination } }
      const data = response.data?.data || response.data;
      return data?.contents || (Array.isArray(data) ? data : []);
    },
  });
};

const useSupplements = () => {
  return useQuery({
    queryKey: ['supplements'],
    queryFn: async () => {
      const response = await api.get('/products?category=Suplementação');
      // Backend retorna { success: true, data: { products, pagination } }
      const data = response.data?.data || response.data;
      return data?.products || (Array.isArray(data) ? data : []);
    },
  });
};

export default function NutritionPage() {
  const { user } = useAuthStore();
  const { data: articlesData, isLoading: loadingArticles } = useArticles();
  const { data: supplementsData, isLoading: loadingSupplements } = useSupplements();
  const isPremium = user?.plan === 'premium';
  
  const articles = Array.isArray(articlesData) ? articlesData : [];
  const supplements = Array.isArray(supplementsData) ? supplementsData : [];

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
    <div className="space-y-12 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tighter text-white">Nutrição</h1>
            <p className="text-zinc-400 mt-2">Combustível para sua performance.</p>
        </div>
      </div>

      {!isPremium && (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-500/10 to-primary/5 border border-primary/20 rounded-3xl p-6 flex items-center gap-4 relative overflow-hidden"
        >
             <div className="absolute top-0 right-0 p-12 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
             <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500 shrink-0">
                <Star className="h-6 w-6 fill-current" />
            </div>
            <p className="text-sm text-zinc-300 relative z-10">
              <span className="text-white font-bold">Dica Pro:</span> Membros Premium têm acesso a planos nutricionais exclusivos.
            </p>
        </motion.div>
      )}

      {/* Articles Section */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-xl">
                <BookOpen className="h-5 w-5 text-primary" />
            </div>
            Artigos Recentes
          </h2>
          <Link href="/app/nutrition/articles">
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full">
              Ver todos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loadingArticles ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[320px] w-full rounded-3xl bg-white/5" />)
          ) : articles.length === 0 ? (
            <div className="col-span-full text-center py-12 text-zinc-500">
              Nenhum artigo disponível.
            </div>
          ) : (
            articles.slice(0, 3).map((article) => (
              <motion.div variants={item} key={article._id}>
                <Link href={`/app/nutrition/articles/${article._id}`}>
                    <div className="glass-card rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 group h-full flex flex-col">
                        <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                             {article.thumbnail ? (
                                <Image 
                                    src={article.thumbnail} 
                                    alt={article.title} 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                             ) : (
                                <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                    <BookOpen className="w-10 h-10 text-zinc-600" />
                                </div>
                             )}
                            <div className="absolute top-4 left-4">
                                <Badge className="bg-black/60 backdrop-blur-md text-white border-0">
                                    {article.category}
                                </Badge>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                {article.title}
                            </h3>
                            <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">
                                {article.description}
                            </p>
                            <span className="text-xs font-bold text-primary flex items-center mt-auto">
                                Ler Artigo <ArrowRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Supplements Section */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                Suplementação
            </h2>
             <Link href="/app/store">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-full">
                Ir para Loja <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loadingSupplements ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[350px] w-full rounded-3xl bg-white/5" />)
          ) : supplements.length === 0 ? (
            <div className="col-span-full text-center py-12 text-zinc-500">
              Nenhum suplemento disponível.
            </div>
          ) : (
            supplements.map((supplement) => (
              <motion.div variants={item} key={supplement._id}>
                <Link href={`/app/store/${supplement._id}`}>
                    <div className="glass-card rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 group h-full flex flex-col">
                        <div className="relative h-48 w-full bg-zinc-900 p-6 flex items-center justify-center">
                            {supplement.image ? (
                                <Image 
                                    src={supplement.image} 
                                    alt={supplement.name} 
                                    fill 
                                    className="object-cover" 
                                />
                            ) : (
                                <ShoppingBag className="w-12 h-12 text-zinc-700" />
                            )}
                        </div>
                        <div className="p-5 flex flex-col flex-1">
                            <h3 className="text-base font-bold text-white mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                                {supplement.name}
                            </h3>
                            <p className="text-xs text-zinc-400 line-clamp-2 mb-4 flex-1">
                                {supplement.description}
                            </p>
                            
                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                <span className="text-lg font-bold text-primary">{supplement.points} HP</span>
                                <Badge variant="secondary" className="bg-white/5 text-zinc-300 hover:bg-white/10 border-0">
                                    Cashback
                                </Badge>
                            </div>
                        </div>
                    </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
