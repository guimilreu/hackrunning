'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Calendar, Award, ShoppingBag, LogOut, Loader2, Users, BookOpen, Zap, Trophy, User, History, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useHPointsBalance } from '@/hooks/useHPoints';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Skeleton } from '@/components/ui/skeleton';

const NAV_CATEGORIES = [
  {
    label: 'Principal',
    items: [
      { label: 'Início', href: '/home', icon: Home },
    ]
  },
  {
    label: 'Treinamento',
    items: [
      { label: 'Treinos', href: '/training-plan', icon: Calendar },
    //   { label: 'Aulas', href: '/classes', icon: BookOpen },
    ]
  },
  {
    label: 'Gamificação',
    items: [
      { label: 'Desafios', href: '/challenges', icon: Trophy },
    ]
  },
  {
    label: 'Eventos e Loja',
    items: [
      { label: 'Eventos', href: '/races', icon: Award },
      { label: 'Loja', href: '/store', icon: ShoppingBag },
    ]
  },
];

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // PRIMEIRO: Verificar se está em rotas que não precisam do AppLayout
  // Isso deve ser feito ANTES de chamar qualquer hook do Query
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password');
  const isOnboardingRoute = pathname.includes('/onboarding');
  const isCheckoutRoute = pathname.includes('/checkout');
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Se for rota de auth, admin, onboarding ou checkout, retornar apenas children
  // SEM chamar nenhum hook do Query ou do Zustand desnecessariamente
  if (isAuthRoute || isAdminRoute || isOnboardingRoute || isCheckoutRoute) {
    return <>{children}</>;
  }
  
  // DEPOIS: Carregar dados do usuário e chamar hooks do Query
  const { isAuthenticated, user, logout, _hasHydrated } = useAuthStore();
  
  // Só chamar hooks do Query quando estiver autenticado e hidratado
  const shouldFetch = _hasHydrated && isAuthenticated;
  const { data: balanceData, isLoading: loadingBalance } = useHPointsBalance({ enabled: shouldFetch });
  const { data: onboardingData, isLoading: loadingOnboarding } = useOnboarding({ enabled: shouldFetch });
  
  const balance = balanceData?.balance || 0;
  const onboardingComplete = onboardingData?.data?.completed || user?.onboarding?.completed || false;
  const hasPaymentPending = user?.kickstartKit?.paymentPending || false;
  const isPaymentPendingRoute = pathname.includes('/onboarding/payment-pending');

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
      return;
    }

    // Se tem pagamento pendente (PIX/Boleto) e não está na rota de payment-pending ou checkout
    if (_hasHydrated && isAuthenticated && hasPaymentPending && !isPaymentPendingRoute && !isCheckoutRoute) {
      router.push('/onboarding/payment-pending');
      return;
    }

    // Verificar onboarding apenas se estiver autenticado e não estiver em rota de onboarding ou checkout
    // Checkout é permitido durante o onboarding pois faz parte do fluxo de compra do kit
    if (_hasHydrated && isAuthenticated && !isOnboardingRoute && !isCheckoutRoute && !loadingOnboarding && !hasPaymentPending) {
      if (!onboardingComplete) {
        const currentStep = onboardingData?.data?.currentStep || 1;
        const stepPaths = {
          1: '/onboarding/step1',
          2: '/onboarding/step2',
          3: '/onboarding/step3',
          4: '/onboarding/step4',
          5: '/onboarding/step5',
          6: '/onboarding/step6',
          7: '/onboarding/kickstart-kit'
        };
        router.push(stepPaths[currentStep] || '/onboarding/step1');
      }
    }
  }, [isAuthenticated, _hasHydrated, onboardingComplete, hasPaymentPending, isOnboardingRoute, isCheckoutRoute, isPaymentPendingRoute, loadingOnboarding, router]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Verificar onboarding enquanto carrega (exceto para rotas de checkout e payment-pending)
  if (!loadingOnboarding && !isOnboardingRoute && !isCheckoutRoute && !onboardingComplete && !hasPaymentPending) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Itens principais da navegação
  const mainNavItems = NAV_CATEGORIES.flatMap((category) => category.items);
  
  // Itens para bottom navigation no mobile (principais apenas)
  const mobileNavItems = [
    { label: 'Início', href: '/home', icon: Home },
    { label: 'Treinos', href: '/training-plan', icon: Calendar },
	{ label: 'Desafios', href: '/challenges', icon: Trophy },
	{ label: 'Eventos', href: '/races', icon: Award },
	{ label: 'Loja', href: '/store', icon: ShoppingBag },
    { label: 'Perfil', href: '/profile', icon: User },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
        <div className="mb-6 px-2">
           <Link href="/home" className="flex items-center group">
                <img src="/logo.png" alt="Hack Running" className="object-contain" />
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-2">
          {mainNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? "bg-primary/20 text-primary shadow-lg shadow-primary/10" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "group-hover:text-primary transition-colors"}`} />
                  <span className={`font-medium ${isActive ? "text-primary" : ""}`}>{item.label}</span>
                </div>
              </Link>
            );
          })}
          
          {/* Meu Perfil */}
          <Link href="/profile" className="mt-2">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                pathname.startsWith('/profile')
                  ? "bg-primary/20 text-primary shadow-lg shadow-primary/10" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <User className={`h-5 w-5 ${pathname.startsWith('/profile') ? "text-primary" : "group-hover:text-primary transition-colors"}`} />
              <span className={`font-medium ${pathname.startsWith('/profile') ? "text-primary" : ""}`}>Meu Perfil</span>
            </div>
          </Link>
        </nav>
        
        {/* HPoints no final da sidebar (desktop) */}
        <div className="mt-auto pt-4 border-t border-white/5 px-2 space-y-2">
          <Link href="/hpoints" className="group">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200 cursor-pointer">
              <Zap className="h-5 w-5 text-primary" fill="currentColor" />
              <div className="flex-1">
                <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors block">
                  HPoints
                </span>
                {loadingBalance ? (
                  <Skeleton className="h-5 w-20 bg-zinc-800 rounded mt-1" />
                ) : (
                  <span className="text-xl font-bold text-primary block">
                    {balance.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </Link>
          
          {/* Botão de Logout */}
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 group-hover:text-red-400 transition-colors" />
            <span className="font-medium group-hover:text-red-400 transition-colors">Sair</span>
          </button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-white/5 bg-zinc-950/30 backdrop-blur-xl p-6 h-screen sticky top-0 z-40">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md h-16">
         <div className="flex items-center">
                <img src="/logo.png" alt="Hack Running" className="object-contain h-8" />
         </div>
         
         {/* HPoints no mobile header */}
         <Link href="/hpoints" className="group">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer">
             <Zap className="h-4 w-4 text-primary" fill="currentColor" />
             {loadingBalance ? (
               <Skeleton className="h-4 w-12 bg-zinc-800 rounded" />
             ) : (
               <span className="text-base font-bold text-primary">
                 {balance.toLocaleString('pt-BR')}
               </span>
             )}
           </div>
         </Link>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-0">
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 pb-20 md:pb-8 overflow-y-auto h-screen scroll-smooth">
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-zinc-950/80 backdrop-blur-md">
        <nav className="flex items-center justify-around px-2 py-2">
          {mobileNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className="flex flex-col items-center justify-center py-2 px-2 rounded-lg transition-all duration-200 group">
                  <item.icon 
                    className={`h-5 w-5 mb-1 transition-colors ${
                      isActive ? "text-primary" : "text-zinc-400 group-hover:text-primary"
                    }`} 
                  />
                  <span className={`text-xs font-medium transition-colors ${
                    isActive ? "text-primary" : "text-zinc-400 group-hover:text-white"
                  }`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
