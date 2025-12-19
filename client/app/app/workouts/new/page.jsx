'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Camera, Upload, Instagram } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  // Photo validation handled manually or with refine
});

export default function NewWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workoutId = searchParams.get('workoutId');
  
  const { mutate: createWorkout, isPending } = useCreateWorkout();
  const [photo, setPhoto] = useState(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'base',
    }
  });

  const onSubmit = (data) => {
    createWorkout({
      ...data,
      workoutId, // Link to planned workout if exists
      photo
    });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files?.[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="bg-zinc-950/50 border-zinc-800">
        <CardHeader>
          <CardTitle>Registrar Treino</CardTitle>
          <CardDescription>
            Mostre pra comunidade que o dever foi cumprido!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  className="bg-zinc-900 border-zinc-800"
                  {...register('date')}
                />
                {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select onValueChange={(val) => setValue('type', val)} defaultValue="base">
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                        <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
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
                  className="bg-zinc-900 border-zinc-800"
                  {...register('distance')}
                />
                {errors.distance && <p className="text-xs text-red-500">{errors.distance.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Tempo (HH:MM:SS)</Label>
                <Input
                  id="time"
                  placeholder="00:45:00"
                  className="bg-zinc-900 border-zinc-800"
                  {...register('time')}
                />
                {errors.time && <p className="text-xs text-red-500">{errors.time.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
                <Label>Foto do Treino (Obrigatório)</Label>
                <div className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${photo ? 'border-primary bg-primary/10' : 'border-zinc-800 hover:border-zinc-600'}`}>
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
                                <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-muted-foreground">Clique para adicionar foto</span>
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
                  className="bg-zinc-900 border-zinc-800 min-h-[100px]"
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
                  className="bg-zinc-900 border-zinc-800"
                  {...register('instagramStoryLink')}
                />
                {errors.instagramStoryLink && <p className="text-xs text-red-500">{errors.instagramStoryLink.message}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-black font-bold"
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
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

import { CheckCircle } from 'lucide-react'; // Import CheckCircle
