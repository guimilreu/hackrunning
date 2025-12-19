'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useForgotPassword } from '@/hooks/useAuth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const onSubmit = (data) => {
    forgotPassword(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-zinc-800 bg-zinc-950/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber as instruções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="bg-zinc-900 border-zinc-800 focus:ring-primary"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Email'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Login
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
