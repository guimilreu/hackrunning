import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useCreateWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // 1. Prepare payload
      const timeParts = data.time.split(':').map(Number);
      const timeInSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];

      const payload = {
        date: data.date,
        distance: data.distance,
        time: timeInSeconds,
        workoutType: data.type,
        notes: data.description,
        instagramStoryLink: data.instagramStoryLink || '',
        type: 'individual',
        trainingPlanWorkoutId: data.workoutId
      };

      // 2. Create workout
      const response = await api.post('/workouts', payload);
      const workout = response.data.data.workout;

      // 3. Upload photo if exists
      if (data.photo) {
        const formData = new FormData();
        formData.append('photo', data.photo);
        await api.post(`/workouts/${workout._id}/photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeedPreview'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['adherence'] });
      queryClient.invalidateQueries({ queryKey: ['nextWorkout'] });
      queryClient.invalidateQueries({ queryKey: ['hpointsBalance'] });
      toast.success('Treino registrado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao registrar treino');
    },
  });
};

export const useUpdateWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/workouts/${id}`, data);
      return { ...response.data, id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeedPreview'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      queryClient.invalidateQueries({ queryKey: ['recentWorkouts'] });
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: ['workout', data.id] });
      }
      toast.success('Treino atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar treino');
    },
  });
};

export const useTrainingPlan = () => {
  return useQuery({
    queryKey: ['trainingPlan', 'current'],
    queryFn: async () => {
      const response = await api.get('/training-plans/current');
      return response.data?.data?.plan || response.data?.plan;
    },
    retry: false,
  });
};

/**
 * Hook para buscar um treino específico por ID
 */
export const useWorkout = (id) => {
  return useQuery({
    queryKey: ['workout', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/workouts/${id}`);
      return response.data?.data?.workout;
    },
    enabled: !!id,
    retry: false,
  });
};

/**
 * Hook para curtir/descurtir treino
 */
export const useToggleLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutId) => {
      const response = await api.post(`/workouts/${workoutId}/like`);
      return { ...response.data, workoutId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeedPreview'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      if (data.workoutId) {
        queryClient.invalidateQueries({ queryKey: ['workout', data.workoutId] });
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Erro ao curtir treino';
      toast.error(message);
    },
  });
};

/**
 * Hook para adicionar comentário
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, text }) => {
      const response = await api.post(`/workouts/${workoutId}/comments`, { text });
      return { ...response.data, workoutId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeedPreview'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      if (data.workoutId) {
        queryClient.invalidateQueries({ queryKey: ['workout', data.workoutId] });
      }
      toast.success('Comentário adicionado!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao adicionar comentário');
    },
  });
};

/**
 * Hook para deletar comentário
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, commentId }) => {
      const response = await api.delete(`/workouts/${workoutId}/comments/${commentId}`);
      return { ...response.data, workoutId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeedPreview'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      if (data.workoutId) {
        queryClient.invalidateQueries({ queryKey: ['workout', data.workoutId] });
      }
      toast.success('Comentário excluído!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir comentário');
    },
  });
};

/**
 * Hook para compartilhar treino
 */
export const useShareWorkout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workoutId, platform }) => {
      const response = await api.post(`/workouts/${workoutId}/share`, { platform });
      return { ...response.data, workoutId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      if (data.workoutId) {
        queryClient.invalidateQueries({ queryKey: ['workout', data.workoutId] });
      }
      toast.success('Compartilhamento registrado!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao compartilhar');
    },
  });
};
