'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export function NotificationDialog({ open, onOpenChange, onSave, isPending }) {
  const [formData, setFormData] = useState({
    type: 'system',
    title: '',
    message: '',
    link: '',
    targetType: 'all',
    targetValue: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      targetValue: formData.targetType === 'all' ? undefined : formData.targetValue
    };
    onSave(data);
    setFormData({
      type: 'system',
      title: '',
      message: '',
      link: '',
      targetType: 'all',
      targetValue: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Notificação</DialogTitle>
          <DialogDescription>
            Crie uma notificação para enviar aos membros
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
              <option value="system">Sistema</option>
              <option value="new_challenge">Novo Desafio</option>
              <option value="together_upcoming">Together Próximo</option>
              <option value="race_upcoming">Corrida Próxima</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={100}
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              maxLength={500}
              className="bg-zinc-950 border-zinc-800 min-h-[100px]"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="link">Link (opcional)</Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://..."
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="targetType">Destinatário *</Label>
            <select
              id="targetType"
              value={formData.targetType}
              onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetValue: '' })}
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white"
              disabled={isPending}
            >
              <option value="all">Todos</option>
              <option value="plan">Por Plano</option>
              <option value="company">Por Empresa</option>
              <option value="user">Usuário Específico</option>
            </select>
          </div>
          {formData.targetType !== 'all' && (
            <div className="space-y-2">
              <Label htmlFor="targetValue">
                {formData.targetType === 'plan' && 'Plano'}
                {formData.targetType === 'company' && 'ID da Empresa'}
                {formData.targetType === 'user' && 'ID do Usuário'}
              </Label>
              {formData.targetType === 'plan' ? (
                <select
                  id="targetValue"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white"
                  disabled={isPending}
                >
                  <option value="">Selecione...</option>
                  <option value="free">Gratuito</option>
                  <option value="paid">Pago</option>
                  <option value="premium">Premium</option>
                  <option value="corporate">Corporativo</option>
                </select>
              ) : (
                <Input
                  id="targetValue"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  required
                  placeholder={formData.targetType === 'company' ? 'ID da empresa' : 'ID do usuário'}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Notificação'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
