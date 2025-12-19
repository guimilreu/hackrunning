import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export const useProducts = (filters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/products?${params.toString()}`);
      // Backend retorna { success: true, data: { products, pagination } }
      const data = response.data?.data || response.data;
      return data?.products || data || [];
    },
  });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      // Backend retorna { success: true, data: { product } }
      // Extrai o produto corretamente de qualquer nível de aninhamento
      let product = response.data;
      
      if (product?.data?.product) {
        product = product.data.product;
      } else if (product?.data) {
        product = product.data;
      } else if (product?.product) {
        product = product.product;
      }
      
      return product;
    },
    enabled: !!id,
  });
};

export const useRedeemProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }) => {
      const response = await api.post('/redemptions', { productId, quantity });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Resgate realizado com sucesso! Verifique seu email.');
      queryClient.invalidateQueries({ queryKey: ['hpointsBalance'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock update
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao realizar resgate');
    },
  });
};

export const useRedemptions = (status) => {
  return useQuery({
    queryKey: ['redemptions', status],
    queryFn: async () => {
      const params = status && status !== 'all' ? `?status=${status}` : '';
      const response = await api.get(`/redemptions${params}`);
      return response.data?.data?.redemptions || response.data?.redemptions || response.data || [];
    },
  });
};

export const useRedemption = (id) => {
  return useQuery({
    queryKey: ['redemption', id],
    queryFn: async () => {
      const response = await api.get(`/redemptions/${id}`);
      return response.data?.data || response.data;
    },
    enabled: !!id,
  });
};
