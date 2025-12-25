'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Loader2, Camera, CheckCircle, Instagram, Clock, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCreateWorkout } from '@/hooks/useWorkouts';

const workoutSchema = z.object({
  date: z.string(),
  startTime: z.string().min(1, 'Selecione o horário'),
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

  const getDefaultTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: getDefaultTime(),
      type: 'base',
    }
  });

  const onSubmit = (data) => {
    // Combinar data + hora antes de enviar
    const dateTime = new Date(`${data.date}T${data.startTime}`);
    
    createWorkout({
      ...data,
      date: dateTime.toISOString(),
      planId,
      workoutId,
      photo
    }, {
      onSuccess: () => {
        reset({
          date: new Date().toISOString().split('T')[0],
          startTime: getDefaultTime(),
          type: 'base',
        });
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
      <DialogContent className="w-[95vw] max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-0 gap-0 m-0 rounded-lg sm:rounded-3xl">
        <DialogHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6 sm:pb-4 border-b border-white/10">
          <DialogTitle className="text-xl sm:text-2xl font-bold">Registrar Treino</DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-zinc-400">
            Compartilhe seu treino com a comunidade
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6">
          {/* Data e Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                className="h-10 sm:h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white text-sm sm:text-base"
                {...register('date')}
              />
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Horário
              </Label>
              <Input
                id="startTime"
                type="time"
                className="h-10 sm:h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white text-sm sm:text-base"
                {...register('startTime')}
              />
              {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
            </div>
          </div>

          {/* Tipo de Treino */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="type" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Tipo de Treino
            </Label>
            <Select onValueChange={(val) => setValue('type', val)} defaultValue="base">
              <SelectTrigger className="h-10 sm:h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white text-sm sm:text-base">
                <SelectValue placeholder="Selecione o tipo" />
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

          {/* Distância e Duração */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="distance" className="text-xs sm:text-sm font-medium text-zinc-300">
                Distância (km)
              </Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                placeholder="5.00"
                className="h-10 sm:h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white text-sm sm:text-base"
                {...register('distance')}
              />
              {errors.distance && <p className="text-xs text-red-500">{errors.distance.message}</p>}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="time" className="text-xs sm:text-sm font-medium text-zinc-300">
                Duração (HH:MM:SS)
              </Label>
              <Input
                id="time"
                placeholder="00:45:00"
                className="h-10 sm:h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white font-mono text-sm sm:text-base"
                {...register('time')}
              />
              {errors.time && <p className="text-xs text-red-500">{errors.time.message}</p>}
            </div>
          </div>

          {/* Foto do Treino */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium text-zinc-300">
              Foto do Treino <span className="text-red-500">*</span>
            </Label>
            <div className={`border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              photo 
                ? 'border-primary bg-primary/10' 
                : 'border-white/10 hover:border-primary/50 hover:bg-white/5'
            }`}>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                id="photo-upload"
                onChange={handlePhotoChange}
              />
              <Label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-1.5 sm:gap-2 w-full">
                {photo ? (
                  <>
                    <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    <span className="text-primary font-medium text-xs sm:text-sm break-all text-center px-2">{photo.name}</span>
                    <span className="text-xs text-zinc-500">Clique para trocar</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-8 w-8 sm:h-10 sm:w-10 text-zinc-500" />
                    <span className="text-zinc-400 text-xs sm:text-sm font-medium">Adicionar foto</span>
                    <span className="text-xs text-zinc-500">PNG, JPG até 10MB</span>
                  </>
                )}
              </Label>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="description" className="text-xs sm:text-sm font-medium text-zinc-300">
              Como você se sentiu?
            </Label>
            <Textarea
              id="description"
              placeholder="Conte como foi seu treino..."
              className="bg-zinc-900/50 border-white/10 min-h-[80px] sm:min-h-[100px] focus:border-primary/50 text-white resize-none text-sm sm:text-base"
              {...register('description')}
            />
          </div>

          {/* Instagram Story */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="instagramStoryLink" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-300">
              <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="flex-1">
                Link do Story do Instagram <span className="text-zinc-500 text-xs font-normal">(opcional)</span>
              </span>
            </Label>
            <Input
              id="instagramStoryLink"
              type="url"
              placeholder="https://instagram.com/stories/..."
              className="h-10 sm:h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white text-sm sm:text-base"
              {...register('instagramStoryLink')}
            />
            {errors.instagramStoryLink && <p className="text-xs text-red-500">{errors.instagramStoryLink.message}</p>}
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="w-full sm:flex-1 h-10 sm:h-11 text-sm sm:text-base text-zinc-400 hover:text-white hover:bg-white/10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:flex-1 h-10 sm:h-11 bg-primary text-black text-sm sm:text-base font-bold hover:bg-primary/90 disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Registrar Treino'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}



