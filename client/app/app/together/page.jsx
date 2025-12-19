'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNextTogether } from '@/hooks/useDashboard';
import { Loader2, CalendarX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TogetherRedirectPage() {
  const router = useRouter();
  const { data: nextTogether, isLoading } = useNextTogether();

  useEffect(() => {
    if (!isLoading && nextTogether?._id) {
      router.replace(`/app/together/${nextTogether._id}`);
    }
  }, [isLoading, nextTogether, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-zinc-400">Buscando próximo evento...</p>
      </div>
    );
  }

  if (!nextTogether) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
          <CalendarX className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Nenhum Together Agendado</h1>
          <p className="text-zinc-400 max-w-md mx-auto">
            No momento não temos nenhum treino em grupo confirmado. 
            Fique ligado que logo teremos novidades!
          </p>
        </div>
        <Link href="/app/home">
          <Button variant="outline" className="border-white/10">
            Voltar para o Início
          </Button>
        </Link>
      </div>
    );
  }

  return null; // Render nothing while redirecting
}
