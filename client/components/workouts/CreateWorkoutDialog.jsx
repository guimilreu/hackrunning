'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Loader2, Camera, CheckCircle, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCreateWorkout } from '@/hooks/useWorkouts';

const workoutSchema = z.object({
  date: z.string(),
  type: z.string().min(1, 'Selecione o tipo'),
  distance: z.string().transform(v => parseFloat(v)).pipe(z.number().positive()),
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Formato HH:MM:SS'),
  description: z.string().optional(),
  instagramStoryLink: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: 'URL inválida'
  }),
});

export function CreateWorkoutDialog({ open, onOpenChange, planId, workoutId }) {
  const { mutate: createWorkout, isPending } = useCreateWorkout();
  const [photo, setPhoto] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'base',
    }
  });

  const onSubmit = (data) => {
    createWorkout({
      ...data,
      planId,
      workoutId,
      photo
    }, {
      onSuccess: () => {
        reset();
        setPhoto(null);
        onOpenChange(false);
      }
    });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files?.[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Treino</DialogTitle>
          <DialogDescription>
            Mostre pra comunidade que o dever foi cumprido!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                className="bg-zinc-900/50 border-white/10 focus:border-primary/50"
                {...register('date')}
              />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select onValueChange={(val) => setValue('type', val)} defaultValue="base">
                <SelectTrigger className="bg-zinc-900/50 border-white/10 focus:border-primary/50">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  <SelectItem value="base">Base (Leve)</SelectItem>
                  <SelectItem value="pace">Ritmo (Tempo)</SelectItem>
                  <SelectItem value="interval">Intervalado</SelectItem>
                  <SelectItem value="long">Longo</SelectItem>
                  <SelectItem value="recovery">Regenerativo</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Distância (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                placeholder="Ex: 5.00"
                className="bg-zinc-900/50 border-white/10 focus:border-primary/50"
                {...register('distance')}
              />
              {errors.distance && <p className="text-xs text-red-500">{errors.distance.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Tempo (HH:MM:SS)</Label>
              <Input
                id="time"
                placeholder="00:45:00"
                className="bg-zinc-900/50 border-white/10 focus:border-primary/50"
                {...register('time')}
              />
              {errors.time && <p className="text-xs text-red-500">{errors.time.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto do Treino (Obrigatório)</Label>
            <div className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${photo ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-primary/50 hover:bg-white/5'}`}>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="photo-upload"
                onChange={handlePhotoChange}
              />
              <Label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
                {photo ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-primary mb-2" />
                    <span className="text-primary font-medium">{photo.name}</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-zinc-500 mb-2" />
                    <span className="text-zinc-400">Clique para adicionar foto</span>
                  </>
                )}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Como você se sentiu?</Label>
            <Textarea
              id="description"
              placeholder="Escreva sobre o treino..."
              className="bg-zinc-900/50 border-white/10 min-h-[100px] focus:border-primary/50"
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagramStoryLink" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              Link do Story do Instagram (Opcional)
            </Label>
            <Input
              id="instagramStoryLink"
              type="url"
              placeholder="https://instagram.com/stories/..."
              className="bg-zinc-900/50 border-white/10 focus:border-primary/50"
              {...register('instagramStoryLink')}
            />
            {errors.instagramStoryLink && <p className="text-xs text-red-500">{errors.instagramStoryLink.message}</p>}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="text-zinc-400 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-black font-bold hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Confirmar Treino'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



