'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const useArticles = (category) => {
  return useQuery({
    queryKey: ['articles', category],
    queryFn: async () => {
      const params = category ? `&category=${category}` : '';
      const response = await api.get(`/content?type=article${params}`);
      // Backend retorna { success: true, data: { contents, pagination } }
      const data = response.data?.data || response.data;
      return data?.contents || data || [];
    },
  });
};

export default function ArticlesPage() {
  const [category, setCategory] = useState('all');

  const { data: articles, isLoading } = useArticles(category !== 'all' ? category : null);

  // Extrair dados da API e garantir que seja sempre um array
  const getDisplayArticles = () => {
    if (isLoading) {
      return null;
    }
    
    if (articles) {
      if (Array.isArray(articles)) {
        return articles;
      }
      if (Array.isArray(articles.content)) {
        return articles.content;
      }
      if (Array.isArray(articles.data)) {
        return articles.data;
      }
      if (Array.isArray(articles.articles)) {
        return articles.articles;
      }
    }
    
    return [];
  };

  const displayArticles = getDisplayArticles();
  const filteredArticles = displayArticles === null ? [] : displayArticles;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center">
            <BookOpen className="mr-2 h-8 w-8" />
            Artigos
          </h1>
          <p className="text-muted-foreground">Conteúdo exclusivo sobre nutrição e performance.</p>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] bg-zinc-950 border-zinc-800">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="nutrition">Nutrição</SelectItem>
            <SelectItem value="supplementation">Suplementação</SelectItem>
            <SelectItem value="technique">Técnica</SelectItem>
            <SelectItem value="mindset">Mentalidade</SelectItem>
            <SelectItem value="health">Saúde</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading || displayArticles === null ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
        ) : filteredArticles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum artigo encontrado.
          </div>
        ) : (
          filteredArticles.map((article) => (
            <Link key={article._id} href={`/nutrition/articles/${article._id}`}>
              <Card className="bg-zinc-950/50 border-zinc-800 hover:border-primary/50 transition-all h-full">
                {article.thumbnail && (
                  <div className="relative h-40 w-full bg-zinc-900">
                    <Image 
                      src={article.thumbnail} 
                      alt={article.title} 
                      fill 
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{article.category}</Badge>
                  </div>
                  <CardTitle className="text-white line-clamp-2">{article.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{article.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
