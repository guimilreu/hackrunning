'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Plus, Calendar, MapPin, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { safeFormatDate } from '@/lib/utils/date';
import { EventDialog } from '@/components/admin/EventDialog';
import { toast } from 'sonner';

const useEvents = () => {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async () => {
      const response = await api.get('/events');
      return response.data?.data || response.data;
    },
  });
};

export default function AdminEventsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const queryClient = useQueryClient();

  const { data: eventsData, isLoading } = useEvents();
  const events = eventsData?.events || eventsData || [];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/events', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      toast.success('Evento criado com sucesso!');
      setDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar evento');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/events/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      toast.success('Evento atualizado com sucesso!');
      setDialogOpen(false);
      setSelectedEvent(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar evento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/events/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
      toast.success('Evento removido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao remover evento');
    },
  });

  const handleSave = (data) => {
    if (selectedEvent) {
      updateMutation.mutate({ id: selectedEvent._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja remover este evento?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Eventos</h1>
          <p className="text-muted-foreground">Gerencie eventos e provas</p>
        </div>
        <Button 
          className="bg-primary text-black font-bold"
          onClick={() => {
            setSelectedEvent(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
        ) : events.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum evento cadastrado.
          </div>
        ) : (
          events.map((event) => (
            <Card key={event._id} className="bg-zinc-950/50 border-zinc-800 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white">{event.name}</CardTitle>
                    <Badge variant="secondary">{event.type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(event)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {event.date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {safeFormatDate(event.date, "dd 'de' MMM 'de' yyyy")}
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.location?.address ? `${event.location.address}, ${event.location.city}, ${event.location.state}` : (typeof event.location === 'string' ? event.location : 'Local não informado')}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
