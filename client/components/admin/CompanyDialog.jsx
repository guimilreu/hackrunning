'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function CompanyDialog({ open, onOpenChange, company, onSave, isPending }) {
  const [formData, setFormData] = useState({
    corporateName: '',
    tradeName: '',
    cnpj: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    },
    responsible: {
      name: '',
      email: '',
      phone: ''
    },
    plan: {
      type: 'basic',
      monthlyValue: 0,
      maxEmployees: 50
    }
  });

  useEffect(() => {
    if (company) {
      setFormData({
        corporateName: company.corporateName || company.name || '',
        tradeName: company.tradeName || company.name || '',
        name: company.name || company.tradeName || company.corporateName || '',
        cnpj: company.cnpj || '',
        address: company.address || {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: ''
        },
        responsible: company.responsible || {
          name: '',
          email: '',
          phone: ''
        },
        plan: company.plan || {
          type: 'basic',
          monthlyValue: 0,
          maxEmployees: 50
        }
      });
    } else {
      setFormData({
        corporateName: '',
        tradeName: '',
        name: '',
        cnpj: '',
        address: {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: ''
        },
        responsible: {
          name: '',
          email: '',
          phone: ''
        },
        plan: {
          type: 'basic',
          monthlyValue: 0,
          maxEmployees: 50
        }
      });
    }
  }, [company, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Garantir que o campo name está presente (usado pelo backend)
    const data = {
      ...formData,
      name: formData.name || formData.tradeName || formData.corporateName,
    };
    onSave(data);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
          <DialogDescription>
            {company ? 'Atualize as informações da empresa' : 'Preencha os dados da nova empresa'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={formData.name || formData.tradeName || formData.corporateName}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  name: e.target.value,
                  tradeName: e.target.value,
                  corporateName: e.target.value
                })}
                required
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="corporateName">Razão Social</Label>
              <Input
                id="corporateName"
                value={formData.corporateName}
                onChange={(e) => setFormData({ ...formData, corporateName: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome Fantasia</Label>
              <Input
                id="tradeName"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                required
                placeholder="00.000.000/0000-00"
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending || !!company}
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <h3 className="font-semibold text-white">Endereço</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={formData.address.number}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, number: e.target.value }
                  })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.address.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, zipCode: e.target.value }
                  })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.address.neighborhood}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, neighborhood: e.target.value }
                  })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value }
                  })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <h3 className="font-semibold text-white">Responsável *</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsibleName">Nome</Label>
                <Input
                  id="responsibleName"
                  value={formData.responsible.name}
                  onChange={(e) => setFormData({
                    ...formData,
                    responsible: { ...formData.responsible, name: e.target.value }
                  })}
                  required
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibleEmail">Email</Label>
                <Input
                  id="responsibleEmail"
                  type="email"
                  value={formData.responsible.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    responsible: { ...formData.responsible, email: e.target.value }
                  })}
                  required
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsiblePhone">Telefone</Label>
                <Input
                  id="responsiblePhone"
                  value={formData.responsible.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    responsible: { ...formData.responsible, phone: e.target.value }
                  })}
                  required
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <h3 className="font-semibold text-white">Plano</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="planType">Tipo</Label>
                <select
                  id="planType"
                  value={formData.plan.type}
                  onChange={(e) => setFormData({
                    ...formData,
                    plan: { ...formData.plan, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white"
                  disabled={isPending}
                >
                  <option value="basic">Básico</option>
                  <option value="intermediate">Intermediário</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyValue">Valor Mensal (R$)</Label>
                <Input
                  id="monthlyValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.plan.monthlyValue}
                  onChange={(e) => setFormData({
                    ...formData,
                    plan: { ...formData.plan, monthlyValue: parseFloat(e.target.value) || 0 }
                  })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxEmployees">Máx. Funcionários</Label>
                <Input
                  id="maxEmployees"
                  type="number"
                  min="1"
                  value={formData.plan.maxEmployees}
                  onChange={(e) => setFormData({
                    ...formData,
                    plan: { ...formData.plan, maxEmployees: parseInt(e.target.value) || 50 }
                  })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
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
