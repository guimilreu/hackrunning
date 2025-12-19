import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useHPointsBalance = (options = {}) => {
  return useQuery({
    queryKey: ['hpointsBalance'],
    enabled: options.enabled !== false,
    queryFn: async () => {
      const response = await api.get('/hpoints/balance');
      // Backend retorna { success: true, data: { balance: { balance, totalEarned, totalRedeemed } } }
      const data = response.data?.data || response.data;
      // Extrair o objeto balance de dentro de data.balance
      const balance = data?.balance || data;
      // Garantir que sempre retornamos um objeto com balance numérico
      if (balance && typeof balance === 'object' && !Array.isArray(balance)) {
        return {
          balance: typeof balance.balance === 'number' ? balance.balance : (typeof balance.total === 'number' ? balance.total : 0),
          totalEarned: typeof balance.totalEarned === 'number' ? balance.totalEarned : 0,
          totalRedeemed: typeof balance.totalRedeemed === 'number' ? balance.totalRedeemed : 0,
          expiring: typeof balance.expiring === 'number' ? balance.expiring : 0,
          nextExpirationDate: balance.nextExpirationDate || null,
        };
      }
      // Se for um número direto, retornar como balance
      if (typeof balance === 'number') {
        return { balance, totalEarned: 0, totalRedeemed: 0, expiring: 0, nextExpirationDate: null };
      }
      return { balance: 0, totalEarned: 0, totalRedeemed: 0, expiring: 0, nextExpirationDate: null };
    },
  });
};

export const useHPointsHistory = (filters) => {
  return useQuery({
    queryKey: ['hpointsHistory', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/hpoints/history?${params.toString()}`);
      // Backend retorna { success: true, data: { data: [...], pagination } }
      const responseData = response.data?.data || response.data;
      // O backend retorna { data: points, pagination } onde data é o array de pontos
      const history = responseData?.data || responseData?.history || responseData;
      // Garantir que seja sempre um array
      return Array.isArray(history) ? history : [];
    },
  });
};

export const useHPointsExpiring = () => {
  return useQuery({
    queryKey: ['hpointsExpiring'],
    queryFn: async () => {
      const response = await api.get('/hpoints/expiring');
      return response.data;
    },
  });
};
