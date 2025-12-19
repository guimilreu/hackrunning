'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function RejectWorkoutDialog({ open, onOpenChange, onReject, isPending }) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      return;
    }
    onReject(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rejeitar Treino</DialogTitle>
          <DialogDescription>
            Informe o motivo da rejeição. Este motivo será enviado ao membro.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Rejeição *</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Foto não corresponde ao treino registrado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejeitando...
              </>
            ) : (
              'Rejeitar Treino'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
