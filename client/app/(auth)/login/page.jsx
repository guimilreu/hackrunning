'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useLogin } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending } = useLogin();

  const onSubmit = (data) => {
    login(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="glass-card rounded-2xl p-1 border-0">
        <div className="bg-black/40 rounded-xl p-6 sm:p-8">
            <div className="space-y-1 mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">Login</h2>
              <p className="text-sm text-zinc-400">
                Entre com suas credenciais para acessar.
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white placeholder:text-zinc-600 transition-all hover:border-white/20"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" classname="text-zinc-300">Senha</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary/80 hover:text-primary transition-colors"
                  >
                    Esqueceu?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white transition-all hover:border-white/20"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-red-400">{errors.password.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-primary text-black hover:bg-primary/90 font-bold rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] transition-all"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500">
                Não tem uma conta?{' '}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Criar conta
                </Link>
              </p>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
