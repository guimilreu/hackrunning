'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { NotificationDialog } from '@/components/admin/NotificationDialog';

const useNotifications = () => {
  return useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      const data = response.data?.data || response.data;
      return {
        notifications: data?.notifications || data || []
      };
    },
  });
};

export default function AdminNotificationsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useNotifications();
  const notifications = notificationsData?.notifications || [];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/notifications/system', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
      toast.success('Notificação enviada com sucesso!');
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar notificação');
    },
  });

  const handleSave = (data) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Notificações</h1>
          <p className="text-muted-foreground">Gerencie notificações da plataforma</p>
        </div>
        <Button 
          className="bg-primary text-black font-bold"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Notificação
        </Button>
      </div>

      <Card className="bg-zinc-950/50 border-zinc-800">
        <CardHeader>
          <CardTitle>Notificações Enviadas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma notificação enviada.
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className="flex items-center justify-between p-4 rounded-lg border border-zinc-800"
                >
                  <div className="flex items-center gap-4">
                    <Bell className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-white">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                  {notification.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NotificationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        isPending={createMutation.isPending}
      />
    </div>
  );
}



