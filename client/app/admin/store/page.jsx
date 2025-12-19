'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ProductDialog } from '@/components/admin/ProductDialog';
import { toast } from 'sonner';

const useProducts = () => {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const response = await api.get('/products/admin/all');
      return response.data?.data || response.data;
    },
  });
};

export default function AdminStorePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: productsData, isLoading } = useProducts();
  const products = productsData?.products || [];

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/products', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Produto criado com sucesso!');
      setDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar produto');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Produto atualizado com sucesso!');
      setDialogOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar produto');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      toast.success('Produto removido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao remover produto');
    },
  });

  const handleSave = (data) => {
    if (selectedProduct) {
      updateMutation.mutate({ id: selectedProduct._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja remover este produto?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Loja</h1>
          <p className="text-muted-foreground">Gerencie produtos e recompensas</p>
        </div>
        <Button 
          className="bg-primary text-black font-bold"
          onClick={() => {
            setSelectedProduct(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)
        ) : products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum produto cadastrado.
          </div>
        ) : (
          products.map((product) => (
            <Card key={product._id} className="bg-zinc-950/50 border-zinc-800 hover:border-primary/50 transition-all h-full flex flex-col">
              {product.image && (
                <div className="relative h-48 w-full bg-zinc-900">
                  <Image 
                    src={product.image} 
                    alt={product.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{product.name}</CardTitle>
                    {product.category && (
                      <Badge variant="secondary">{product.category}</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(product._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
                <p className="text-lg font-bold text-primary">{product.points} HP</p>
                <p className="text-xs text-muted-foreground">
                  Estoque: {product.stock?.quantity || product.stock || 0}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}



