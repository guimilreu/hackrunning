'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export function ProductDialog({ open, onOpenChange, product, onSave, isPending }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'hack_product',
    category: '',
    points: 0,
    monetaryValue: 0,
    stock: {
      available: true,
      quantity: 0
    },
    active: true
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        type: product.type || 'hack_product',
        category: product.category || '',
        points: product.points || 0,
        monetaryValue: product.monetaryValue || 0,
        stock: product.stock || { available: true, quantity: 0 },
        active: product.active !== undefined ? product.active : true
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'hack_product',
        category: '',
        points: 0,
        monetaryValue: 0,
        stock: { available: true, quantity: 0 },
        active: true
      });
    }
  }, [product, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          <DialogDescription>
            {product ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white"
                disabled={isPending}
              >
                <option value="hack_product">Produto Hack</option>
                <option value="mediterraneum_product">Produto Mediterraneum</option>
                <option value="paid_plan">Plano Pago</option>
                <option value="race_registration">Inscrição Corrida</option>
                <option value="service">Serviço</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">HPoints *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                required
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monetaryValue">Valor Monetário (R$)</Label>
              <Input
                id="monetaryValue"
                type="number"
                min="0"
                step="0.01"
                value={formData.monetaryValue}
                onChange={(e) => setFormData({ ...formData, monetaryValue: parseFloat(e.target.value) || 0 })}
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Estoque</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                value={formData.stock.quantity}
                onChange={(e) => setFormData({
                  ...formData,
                  stock: { ...formData.stock, quantity: parseInt(e.target.value) || 0 }
                })}
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.stock.available}
                  onChange={(e) => setFormData({
                    ...formData,
                    stock: { ...formData.stock, available: e.target.checked }
                  })}
                  disabled={isPending}
                  className="w-4 h-4"
                />
                <span className="text-sm">Disponível</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
