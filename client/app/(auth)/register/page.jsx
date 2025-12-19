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
import { useRegister } from '@/hooks/useAuth';
import { maskCPF, maskPhone } from '@/lib/utils/masks';
import { validateCPF } from '@/lib/utils/validators';

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  cpf: z.string()
    .min(14, 'CPF inválido')
    .refine((cpf) => validateCPF(cpf), {
      message: 'CPF inválido. Verifique os dígitos digitados.'
    }),
  phone: z.string().min(15, 'Telefone inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const { mutate: registerUser, isPending } = useRegister();

  const onSubmit = (data) => {
    const { confirmPassword, ...rest } = data;
    const payload = {
      ...rest,
      cpf: data.cpf.replace(/\D/g, ''),
      phone: data.phone.replace(/\D/g, ''),
    };
    registerUser(payload);
  };

  const handleCPFChange = (e) => {
    setValue('cpf', maskCPF(e.target.value), { shouldValidate: true });
  };

  const handlePhoneChange = (e) => {
    setValue('phone', maskPhone(e.target.value), { shouldValidate: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
       <div className="glass-card rounded-2xl p-1 border-0">
        <div className="bg-black/40 rounded-xl p-6 sm:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-1 mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">Criar Conta</h2>
              <p className="text-sm text-zinc-400">
                Comece sua jornada hoje.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  className="h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white placeholder:text-zinc-600 transition-all"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white placeholder:text-zinc-600 transition-all"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf" className="text-zinc-300">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    className="h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white placeholder:text-zinc-600 transition-all"
                    {...register('cpf', {
                      onChange: handleCPFChange
                    })}
                  />
                  {errors.cpf && (
                    <p className="text-xs text-red-400">{errors.cpf.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-zinc-300">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    className="h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white placeholder:text-zinc-600 transition-all"
                    {...register('phone', {
                      onChange: handlePhoneChange
                    })}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-400">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" classname="text-zinc-300">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    className="h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white transition-all"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-400">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" classname="text-zinc-300">Confirmar</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    className="h-11 bg-zinc-900/50 border-white/10 focus:border-primary/50 text-white transition-all"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-black hover:bg-primary/90 font-bold mt-4 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.4)] transition-all"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-zinc-500">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Fazer login
                </Link>
              </p>
            </div>
        </div>
      </div>
    </motion.div>
  );
}
