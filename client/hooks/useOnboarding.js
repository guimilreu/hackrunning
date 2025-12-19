import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export const useOnboarding = () => {
  return useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: async () => {
      const response = await api.get('/onboarding/status');
      return response.data;
    },
  });
};

export const useOnboardingOptions = () => {
  return useQuery({
    queryKey: ['onboarding', 'options'],
    queryFn: async () => {
      const response = await api.get('/onboarding/options');
      return response.data;
    },
  });
};

export const useSavePersonalData = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/onboarding/personal', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Dados pessoais salvos!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar dados pessoais');
    },
  });
};

export const useSaveAddress = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/onboarding/address', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Endereço salvo!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar endereço');
    },
  });
};

export const useSaveRunningGoal = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/onboarding/running-goal', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Objetivo salvo!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar objetivo');
    },
  });
};

export const useSaveShirtSize = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/onboarding/shirt-size', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tamanho salvo!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar tamanho');
    },
  });
};

export const useCompleteOnboarding = () => {
  const router = useRouter();
  const updateUser = useAuthStore((state) => state.updateUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/onboarding/complete');
      return response.data;
    },
    onSuccess: async () => {
      // Invalidar queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Atualizar usuário no store
      updateUser({ onboarding: { completed: true } });
      
      toast.success('Onboarding completo! Bem-vindo!');
      router.push('/app/home');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao completar onboarding');
    },
  });
};

// Hook genérico para salvar dados do onboarding
export const useSaveOnboarding = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      // Mapear step para rota correta
      const { step, userId, ...payload } = data;
      let endpoint = '/onboarding';
      
      switch (step) {
        case 1:
          endpoint = '/onboarding/runner-profile';
          break;
        case 2:
          endpoint = '/onboarding/objectives';
          break;
        case 3:
          endpoint = '/onboarding/metrics';
          break;
        default:
          endpoint = '/onboarding';
      }
      
      const response = await api.post(endpoint, payload);
      return response.data;
    },
    onSuccess: async (data, variables) => {
      toast.success('Progresso salvo!');
      // Invalidar o cache do status do onboarding para forçar atualização
      await queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao salvar dados');
    },
  });
};

export const useOnboardingBack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (step) => {
      const response = await api.post('/onboarding/back', { step });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['onboarding', 'status'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao voltar etapa');
    },
  });
};

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/orders', data);
      return response.data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar pedido');
    },
  });
};

export const useSkipToKickstart = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/onboarding/skip-to-kickstart');
      return response.data;
    },
    onSuccess: async () => {
      // Invalidar queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      await queryClient.invalidateQueries({ queryKey: ['user'] });
      
      toast.success('Você pode completar o cadastro depois!');
      router.push('/app/onboarding/kickstart-kit');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao pular etapas');
    },
  });
};
