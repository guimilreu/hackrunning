'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export function EventDialog({ open, onOpenChange, event, onSave, isPending }) {
  const [formData, setFormData] = useState({
    type: 'together',
    name: '',
    description: '',
    date: '',
    time: '',
    location: {
      address: '',
      city: '',
      state: ''
    },
    hpointsRedemptionAvailable: false,
    hpointsRequired: 0
  });

  useEffect(() => {
    if (event) {
      setFormData({
        type: event.type || 'together',
        name: event.name || '',
        description: event.description || '',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        time: event.time || '',
        location: event.location || { address: '', city: '', state: '' },
        hpointsRedemptionAvailable: event.hpointsRedemptionAvailable || false,
        hpointsRequired: event.hpointsRequired || 0
      });
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        type: 'together',
        name: '',
        description: '',
        date: tomorrow.toISOString().split('T')[0],
        time: '',
        location: { address: '', city: '', state: '' },
        hpointsRedemptionAvailable: false,
        hpointsRequired: 0
      });
    }
  }, [event, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      date: new Date(`${formData.date}T${formData.time}`)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          <DialogDescription>
            {event ? 'Atualize as informações do evento' : 'Preencha os dados do novo evento'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <option value="together">Together</option>
              <option value="race">Corrida</option>
            </select>
          </div>
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
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <h3 className="font-semibold text-white">Localização *</h3>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.location.address}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, address: e.target.value }
                })}
                required
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                  required
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value }
                  })}
                  required
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hpointsRedemptionAvailable}
                  onChange={(e) => setFormData({ ...formData, hpointsRedemptionAvailable: e.target.checked })}
                  disabled={isPending}
                  className="w-4 h-4"
                />
                <span className="text-sm">Permitir resgate com HPoints</span>
              </label>
            </div>
            {formData.hpointsRedemptionAvailable && (
              <div className="space-y-2">
                <Label htmlFor="hpointsRequired">HPoints Necessários</Label>
                <Input
                  id="hpointsRequired"
                  type="number"
                  min="0"
                  value={formData.hpointsRequired}
                  onChange={(e) => setFormData({ ...formData, hpointsRequired: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
            )}
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
