import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useEvents = (type) => {
  return useQuery({
    queryKey: ['events', type],
    queryFn: async () => {
      const response = await api.get(`/events?type=${type}`);
      // Backend retorna { success: true, data: { events, pagination } }
      const data = response.data?.data || response.data;
      return data?.events || data || [];
    },
  });
};

export const useEvent = (id) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await api.get(`/events/${id}`);
      // Backend retorna { success: true, data: { event, userStatus } }
      const data = response.data?.data || response.data;
      const event = data?.event || data;
      
      // Se não encontrou evento e a resposta indica erro
      if (response.data?.success === false || !event) {
        return null;
      }
      
      return event;
    },
    enabled: !!id,
  });
};

export const useConfirmPresence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId }) => {
      const response = await api.post(`/events/${eventId}/confirm-presence`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Presença confirmada!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['nextTogether'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao confirmar presença');
    },
  });
};

export const useCancelConfirmation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId }) => {
      const response = await api.post(`/events/${eventId}/cancel-confirmation`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Confirmação cancelada');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      queryClient.invalidateQueries({ queryKey: ['nextTogether'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao cancelar confirmação');
    },
  });
};

export const useChallenges = () => {
    return useQuery({
      queryKey: ['challenges'],
      queryFn: async () => {
        const response = await api.get('/challenges');
        // Backend retorna { success: true, data: { challenges } }
        const data = response.data?.data || response.data;
        return data?.challenges || data || [];
      },
    });
  };

export const useParticipateChallenge = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async ({ challengeId }) => {
        const response = await api.post(`/challenges/${challengeId}/participate`);
        return response.data;
      },
      onSuccess: (data, variables) => {
        toast.success('Você entrou no desafio!');
        queryClient.invalidateQueries({ queryKey: ['challenges'] });
        queryClient.invalidateQueries({ queryKey: ['challenge', variables.challengeId] });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erro ao entrar no desafio');
      },
    });
  };
