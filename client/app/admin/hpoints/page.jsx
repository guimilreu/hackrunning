'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

const useHPointsStats = () => {
  return useQuery({
    queryKey: ['admin', 'hpoints', 'stats'],
    queryFn: async () => {
      const response = await api.get('/hpoints/stats');
      return response.data?.data || response.data;
    },
  });
};

export default function AdminHPointsPage() {
  const { data: stats, isLoading } = useHPointsStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Gestão de HPoints</h1>
        <p className="text-muted-foreground">Acompanhe e gerencie pontos da plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emitido</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-white">
                {stats?.totalIssued || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resgatado</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-white">
                {stats?.totalRedeemed || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-950/50 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Ativo</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-white">
                {(stats?.totalIssued || 0) - (stats?.totalRedeemed || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950/50 border-zinc-800">
        <CardHeader>
          <CardTitle>Ajustes Manuais</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Funcionalidade de ajuste manual de HPoints será implementada aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



