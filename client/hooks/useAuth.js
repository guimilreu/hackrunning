import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      const responseData = data.data || data;
      login(responseData.user, responseData.token);
      toast.success('Login realizado com sucesso!');
      
      // Verificar se tem pagamento pendente (PIX/Boleto)
      const hasPaymentPending = responseData.user?.kickstartKit?.paymentPending;
      const onboardingComplete = responseData.onboardingComplete || responseData.user?.onboarding?.completed || false;
      
      if (hasPaymentPending) {
        // Se tem pagamento pendente, ir direto para a tela de aguardar pagamento
        router.push('/app/onboarding/payment-pending');
      } else if (onboardingComplete) {
        router.push('/app/home');
      } else {
        router.push('/app/onboarding/step1');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao realizar login');
    },
  });
};

export const useRegister = () => {
  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      const responseData = data.data || data;
      // Fazer login automático após cadastro
      login(responseData.user, responseData.token);
      toast.success('Cadastro realizado com sucesso!');
      
      // Verificar se tem pagamento pendente (PIX/Boleto)
      const hasPaymentPending = responseData.user?.kickstartKit?.paymentPending;
      const onboardingComplete = responseData.onboardingComplete || responseData.user?.onboarding?.completed || false;
      
      if (hasPaymentPending) {
        // Se tem pagamento pendente, ir direto para a tela de aguardar pagamento
        router.push('/app/onboarding/payment-pending');
      } else if (onboardingComplete) {
        router.push('/app/home');
      } else {
        router.push('/app/onboarding/step1');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao realizar cadastro');
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/auth/forgot-password', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email de recuperação enviado!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao solicitar recuperação');
    },
  });
};

export const useResetPassword = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ token, password, confirmPassword }) => {
      const response = await api.post('/auth/reset-password', { token, password, confirmPassword });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Senha redefinida com sucesso!');
      router.push('/login');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao redefinir senha');
    },
  });
};
