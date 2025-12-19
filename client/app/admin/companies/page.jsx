'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { CompanyDialog } from '@/components/admin/CompanyDialog';
import { toast } from 'sonner';

const useCompanies = () => {
  return useQuery({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const response = await api.get('/companies');
      const data = response.data?.data || response.data;
      return {
        companies: data?.companies || data || []
      };
    },
  });
};

export default function AdminCompaniesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const queryClient = useQueryClient();

  const { data: companiesData, isLoading } = useCompanies();
  const companies = companiesData?.companies || [];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/companies', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      toast.success('Empresa criada com sucesso!');
      setDialogOpen(false);
      setSelectedCompany(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar empresa');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/companies/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      toast.success('Empresa atualizada com sucesso!');
      setDialogOpen(false);
      setSelectedCompany(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar empresa');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/companies/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
      toast.success('Empresa desativada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao desativar empresa');
    },
  });

  const handleSave = (data) => {
    if (selectedCompany) {
      updateMutation.mutate({ id: selectedCompany._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja desativar esta empresa?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Empresas</h1>
          <p className="text-muted-foreground">Gerencie empresas parceiras</p>
        </div>
        <Button 
          className="bg-primary text-black font-bold"
          onClick={() => {
            setSelectedCompany(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : companies.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhuma empresa cadastrada.
          </div>
        ) : (
          companies.map((company) => (
            <Card key={company._id} className="bg-zinc-950/50 border-zinc-800 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-white">
                        <Link href={`/admin/companies/${company._id}`}>
                          {company.name || company.tradeName || company.corporateName}
                        </Link>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {company.employees?.length || company.membersCount || 0} membros
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(company)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(company._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      <CompanyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        company={selectedCompany}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}



