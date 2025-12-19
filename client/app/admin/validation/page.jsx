'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Loader2, Instagram, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RejectWorkoutDialog } from '@/components/admin/RejectWorkoutDialog';

const useValidationQueue = () => {
  return useQuery({
    queryKey: ['admin', 'validation', 'queue'],
    queryFn: async () => {
      const response = await api.get('/admin/validation/queue');
      return response.data;
    },
  });
};

const useApproveValidation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await api.post(`/admin/validation/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'validation'] });
      toast.success('Treino aprovado!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao aprovar treino');
    },
  });
};

const useRejectValidation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }) => {
      const response = await api.post(`/admin/validation/${id}/reject`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'validation'] });
      toast.success('Treino rejeitado');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao rejeitar treino');
    },
  });
};

export default function AdminValidationPage() {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  
  const { data: queueData, isLoading } = useValidationQueue();
  const { mutate: approve, isPending: approving } = useApproveValidation();
  const { mutate: reject, isPending: rejecting } = useRejectValidation();
  
  const queue = queueData?.queue || queueData?.data?.queue || [];

  const handleApprove = (id) => {
    approve(id);
  };

  const handleRejectClick = (id) => {
    setSelectedWorkoutId(id);
    setRejectDialogOpen(true);
  };

  const handleReject = (reason) => {
    if (selectedWorkoutId) {
      reject({ id: selectedWorkoutId, reason });
      setRejectDialogOpen(false);
      setSelectedWorkoutId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Fila de Validação</h1>
        <p className="text-muted-foreground">Aprove ou rejeite treinos pendentes</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
        ) : queue.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum treino pendente de validação.
          </div>
        ) : (
          queue.map((workout) => (
            <Card key={workout._id} className="bg-zinc-950/50 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{workout.user?.name || 'Membro'}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(workout.date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">
                    Pendente
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {(workout.photo?.url || workout.photo) && (
                  <div className="relative w-full h-64 rounded-lg overflow-hidden bg-zinc-900">
                    <Image 
                      src={workout.photo?.url || workout.photo} 
                      alt="Treino" 
                      fill 
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="text-white font-medium">{workout.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Distância</p>
                    <p className="text-white font-medium">{workout.distance} km</p>
                  </div>
                  {workout.time && (
                    <div>
                      <p className="text-sm text-muted-foreground">Tempo</p>
                      <p className="text-white font-medium">{workout.time}</p>
                    </div>
                  )}
                  {workout.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Descrição</p>
                      <p className="text-white">{workout.description}</p>
                    </div>
                  )}
                  {workout.instagramStoryLink && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                        <Instagram className="w-4 h-4" />
                        Story do Instagram
                      </p>
                      <a 
                        href={workout.instagramStoryLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 break-all"
                      >
                        {workout.instagramStoryLink}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(workout._id)}
                    disabled={approving || rejecting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {approving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => handleRejectClick(workout._id)}
                    disabled={approving || rejecting}
                    variant="destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <RejectWorkoutDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onReject={handleReject}
        isPending={rejecting}
      />
    </div>
  );
}



