'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export function HPointsAdjustDialog({ open, onOpenChange, userId, userName, onAdjust, isPending }) {
  const [formData, setFormData] = useState({
    type: 'add',
    points: '',
    reason: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const points = formData.type === 'add' ? parseInt(formData.points) : -parseInt(formData.points);
    onAdjust({
      userId,
      points,
      reason: formData.reason
    });
    setFormData({ type: 'add', points: '', reason: '' });
  };

  const handleClose = () => {
    setFormData({ type: 'add', points: '', reason: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajustar HPoints</DialogTitle>
          <DialogDescription>
            {userName && `Ajustar pontos para ${userName}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Ajuste *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white"
              disabled={isPending}
            >
              <option value="add">Adicionar</option>
              <option value="subtract">Remover</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Pontos *</Label>
            <Input
              id="points"
              type="number"
              min="1"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              required
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              minLength={10}
              placeholder="Descreva o motivo do ajuste..."
              className="bg-zinc-950 border-zinc-800 min-h-[100px]"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">Mínimo de 10 caracteres</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.points || !formData.reason || formData.reason.length < 10 || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajustando...
                </>
              ) : (
                'Ajustar Pontos'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
