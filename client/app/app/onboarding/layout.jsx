'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/cn';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Loader2, User, Target, Ruler, Heart, Activity, Timer, Gift, Check } from 'lucide-react';

const STEPS = [
  { path: '/app/onboarding/step1', stepNumber: 1, label: 'Perfil', icon: User },
  { path: '/app/onboarding/step2', stepNumber: 2, label: 'Objetivos', icon: Target },
  { path: '/app/onboarding/step3', stepNumber: 3, label: 'Métricas', icon: Ruler },
  { path: '/app/onboarding/step4', stepNumber: 4, label: 'Saúde', icon: Heart },
  { path: '/app/onboarding/step5', stepNumber: 5, label: 'Histórico', icon: Activity },
  { path: '/app/onboarding/step6', stepNumber: 6, label: 'Testes', icon: Timer },
  { path: '/app/onboarding/kickstart-kit', stepNumber: 7, label: 'Kit', icon: Gift },
];

export default function OnboardingLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: onboardingStatus, isLoading } = useOnboarding();

  useEffect(() => {
    if (!isLoading && onboardingStatus?.data) {
      const { currentStep, completed, completedSteps = [] } = onboardingStatus.data;
      const isSuccessPage = pathname.includes('/onboarding/success');

      // Se já completou o onboarding, redirecionar para home (exceto se estiver na página de sucesso)
      if (completed && !isSuccessPage) {
        router.replace('/app/home');
        return;
      }

      // Encontrar qual etapa o usuário está tentando acessar
      const currentStepConfig = STEPS.find(step => pathname.includes(step.path));
      
      if (currentStepConfig) {
        const attemptedStep = currentStepConfig.stepNumber;
        
        // Verificar se o usuário pode acessar este step
        // Permitir acesso apenas se:
        // 1. Está tentando acessar o step atual (currentStep) OU
        // 2. Está tentando acessar um step anterior que já completou OU
        // 3. Está tentando acessar o próximo step (currentStep + 1) se completou o atual
        
        const isCurrentStep = attemptedStep === currentStep;
        const isPreviousCompletedStep = attemptedStep < currentStep && completedSteps.includes(attemptedStep);
        const isNextStepAfterCurrent = attemptedStep === currentStep + 1 && completedSteps.includes(currentStep);
        
        const canAccessStep = isCurrentStep || isPreviousCompletedStep || isNextStepAfterCurrent;
        
        if (!canAccessStep) {
          // Redirecionar para o step atual
          const correctStepConfig = STEPS.find(step => step.stepNumber === currentStep);
          if (correctStepConfig) {
            router.replace(correctStepConfig.path);
          }
        }
      } else if (pathname === '/app/onboarding' || pathname === '/app/onboarding/') {
        // Redirecionar para a etapa correta se estiver na raiz do onboarding
        const correctStepConfig = STEPS.find(step => step.stepNumber === currentStep);
        if (correctStepConfig) {
          router.replace(correctStepConfig.path);
        }
      }
    }
  }, [pathname, onboardingStatus, isLoading, router]);

  // Mostrar loading enquanto verifica o status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Calcular progresso baseado no step atual do usuário, não no pathname
  const userCurrentStep = onboardingStatus?.data?.currentStep || 1;
  const completedSteps = onboardingStatus?.data?.completedSteps || [];
  const progress = (completedSteps.length / STEPS.length) * 100;
  
  // Encontrar índice do step atual no pathname para mostrar no progresso visual
  const currentStepConfig = STEPS.find(step => pathname.includes(step.path));
  const currentStepNumber = currentStepConfig?.stepNumber || userCurrentStep;
  const isKickstartStep = pathname.includes('kickstart-kit');
  const isSuccessPage = pathname.includes('/onboarding/success');

  if (isSuccessPage) {
    return children;
  }

  return (
    <div className={cn(
        "min-h-screen flex flex-col items-center bg-background relative",
        !isKickstartStep ? "justify-center overflow-hidden p-4" : "p-4 md:p-8 lg:p-12"
    )}>
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[100px] animate-pulse-slow delay-700" />
      </div>

      <div className={cn(
        "w-full space-y-6 z-10 transition-all duration-500",
        isKickstartStep ? "max-w-7xl" : "max-w-2xl"
      )}>
        {/* Header com logo */}
        <div className="text-center">
          <img src="/logo.png" alt="Hack Running" className="h-8 mx-auto object-contain" />
        </div>

        {/* Indicador de etapas visual */}
        <div className={cn(
          "mx-auto transition-all duration-500",
          isKickstartStep ? "max-w-4xl" : "max-w-xl"
        )}>
          {/* Mobile: apenas números */}
          <div className="flex md:hidden items-center justify-center gap-1 mb-2">
            {STEPS.map((step, index) => {
              const isCompleted = completedSteps.includes(step.stepNumber);
              const isCurrent = currentStepNumber === step.stepNumber;
              const isPast = step.stepNumber < currentStepNumber;
              
              return (
                <div key={step.stepNumber} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                      isCompleted || isPast
                        ? "bg-primary text-black"
                        : isCurrent
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.stepNumber}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "w-3 h-0.5 transition-all duration-300",
                      isCompleted || isPast ? "bg-primary" : "bg-zinc-700"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: com ícones e labels */}
          <div className="hidden md:flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = completedSteps.includes(step.stepNumber);
              const isCurrent = currentStepNumber === step.stepNumber;
              const isPast = step.stepNumber < currentStepNumber;
              
              return (
                <div key={step.stepNumber} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        isCompleted || isPast
                          ? "bg-primary text-black shadow-lg shadow-primary/30"
                          : isCurrent
                          ? "bg-primary/20 text-primary border-2 border-primary animate-pulse"
                          : "bg-zinc-800/50 text-zinc-500 border border-zinc-700"
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <span className={cn(
                      "text-[10px] mt-1.5 font-medium transition-all duration-300 text-center",
                      isCompleted || isPast
                        ? "text-primary"
                        : isCurrent
                        ? "text-white"
                        : "text-zinc-500"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 mx-2 transition-all duration-300 mt-[-12px]",
                      isCompleted || isPast ? "bg-primary" : "bg-zinc-700"
                    )} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Texto de progresso */}
          <div className="text-center mt-4">
            <p className="text-sm text-zinc-400">
              Etapa <span className="text-white font-semibold">{currentStepNumber}</span> de <span className="text-white font-semibold">{STEPS.length}</span>
              {currentStepConfig && (
                <span className="text-primary ml-2">• {currentStepConfig.label}</span>
              )}
            </p>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
