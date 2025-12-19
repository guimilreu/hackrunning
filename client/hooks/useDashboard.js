import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useHomeData = () => {
  return useQuery({
    queryKey: ['homeData'],
    queryFn: async () => {
      const response = await api.get('/users/dashboard');
      return response.data?.data || response.data;
    },
  });
};

export const useAdherence = () => {
  return useQuery({
    queryKey: ['adherence'],
    queryFn: async () => {
      const response = await api.get('/training-plans/current');
      const plan = response.data?.data?.plan || response.data?.plan;
      if (!plan) return { weekly: 0, monthly: 0 };
      
      // Calcular adesão semanal
      const completed = plan.workouts?.filter(w => w.completed).length || 0;
      const total = plan.workouts?.length || 1;
      const weekly = Math.round((completed / total) * 100);
      
      return { weekly, monthly: weekly };
    },
  });
};

export const useNextWorkout = () => {
  return useQuery({
    queryKey: ['nextWorkout'],
    queryFn: async () => {
      const response = await api.get('/training-plans/next-workout');
      return response.data?.data || response.data;
    },
  });
};

export const useHPointsBalance = () => {
  return useQuery({
    queryKey: ['hpointsBalance'],
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

export const useWeeklyWorkouts = () => {
  return useQuery({
    queryKey: ['weeklyWorkouts'],
    queryFn: async () => {
      const response = await api.get('/training-plans/week');
      const workouts = response.data?.data?.workouts || response.data?.workouts || [];
      
      // Agrupar por dia da semana
      const weekData = Array.from({ length: 7 }, (_, i) => ({
        day: i,
        planned: 0,
        completed: 0,
      }));
      
      workouts.forEach(workout => {
        const day = new Date(workout.date).getDay();
        if (weekData[day]) {
          weekData[day].planned++;
          if (workout.completed) {
            weekData[day].completed++;
          }
        }
      });
      
      return weekData;
    },
  });
};

export const useGoalsProgress = () => {
  return useQuery({
    queryKey: ['goalsProgress'],
    queryFn: async () => {
      const response = await api.get('/users/stats');
      const stats = response.data?.data || response.data || {};
      
      return [
        {
          id: 'km',
          label: 'Quilômetros',
          current: stats.totalKm || 0,
          target: 100,
          unit: 'km',
        },
        {
          id: 'workouts',
          label: 'Treinos',
          current: stats.totalWorkouts || 0,
          target: 30,
          unit: 'treinos',
        },
        {
          id: 'adherence',
          label: 'Adesão',
          current: stats.adherence || 0,
          target: 80,
          unit: '%',
        },
      ];
    },
  });
};

export const useNextTogether = () => {
  return useQuery({
    queryKey: ['nextTogether'],
    queryFn: async () => {
      const response = await api.get('/events?type=together&limit=1');
      const events = response.data?.data?.events || response.data?.events || [];
      return events[0] || null;
    },
  });
};

export const useCommunityFeedPreview = () => {
  return useQuery({
    queryKey: ['communityFeedPreview'],
    queryFn: async () => {
      const response = await api.get('/workouts?status=approved&limit=10&sort=-createdAt');
      const data = response.data?.data || response.data;
      return data?.workouts || data || [];
    },
  });
};

export const useCommunityFeed = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: ['communityFeed', limit],
    queryFn: async ({ pageParam = 1 }) => {
      // Calcular data de 7 dias atrás
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = sevenDaysAgo.toISOString();
      
      const response = await api.get(`/workouts?status=approved&page=${pageParam}&limit=${limit}&sort=-createdAt&startDate=${startDate}`);
      const data = response.data?.data || response.data;
      return {
        workouts: data?.workouts || data || [],
        pagination: data?.pagination || { page: pageParam, limit, total: 0, pages: 0 }
      };
    },
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
  });
};
