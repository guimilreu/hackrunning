'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus, BookOpen, Video, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ContentDialog } from '@/components/admin/ContentDialog';
import { toast } from 'sonner';

const useContent = () => {
  return useQuery({
    queryKey: ['admin', 'content'],
    queryFn: async () => {
      const response = await api.get('/content/admin/all');
      const data = response.data?.data || response.data;
      return {
        content: data?.contents || data?.content || data || []
      };
    },
  });
};

export default function AdminContentPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const queryClient = useQueryClient();

  const { data: contentData, isLoading } = useContent();
  const content = contentData?.content || [];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/content', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      toast.success('Conteúdo criado com sucesso!');
      setDialogOpen(false);
      setSelectedContent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar conteúdo');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/content/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      toast.success('Conteúdo atualizado com sucesso!');
      setDialogOpen(false);
      setSelectedContent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar conteúdo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/content/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'content'] });
      toast.success('Conteúdo removido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao remover conteúdo');
    },
  });

  const handleSave = (data) => {
    if (selectedContent) {
      updateMutation.mutate({ id: selectedContent._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item) => {
    setSelectedContent(item);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja remover este conteúdo?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Conteúdo</h1>
          <p className="text-muted-foreground">Gerencie artigos e aulas</p>
        </div>
        <Button 
          className="bg-primary text-black font-bold"
          onClick={() => {
            setSelectedContent(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Conteúdo
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : content.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum conteúdo cadastrado.
          </div>
        ) : (
          content.map((item) => (
            <Card key={item._id} className="bg-zinc-950/50 border-zinc-800 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {item.type === 'article' || item.type === 'class' ? (
                      <BookOpen className="h-5 w-5 text-primary" />
                    ) : (
                      <Video className="h-5 w-5 text-primary" />
                    )}
                    <CardTitle className="text-white">{item.title}</CardTitle>
                    <Badge variant="secondary">{item.type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ContentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        content={selectedContent}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}



