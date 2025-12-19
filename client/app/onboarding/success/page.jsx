'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import confetti from 'canvas-confetti';

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Polling to ensure backend has updated the status
    let mounted = true;
    let attempts = 0;
    const maxAttempts = 10;
    
    const verifyStatus = async () => {
      if (!mounted) return;
      
      try {
        // Force refresh user data
        await checkAuth();
        
        // Check local user state after refresh
        const currentUser = useAuthStore.getState().user;
        
        if (currentUser?.onboarding?.completed) {
          setLoading(false);
          triggerConfetti();
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(verifyStatus, 2000); // Retry every 2 seconds
        } else {
          // Fallback after timeout
          setLoading(false);
          triggerConfetti();
        }
      } catch (error) {
        console.error('Error verifying status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(verifyStatus, 2000);
        } else {
          setLoading(false);
          triggerConfetti();
        }
      }
    };

    verifyStatus();

    return () => {
      mounted = false;
    };
  }, [checkAuth]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // since particles fall down, start a bit higher than random
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#eeff00', '#ffffff', '#000000']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#eeff00', '#ffffff', '#000000']
      });
    }, 250);
  };

  const handleStart = () => {
    router.push('/home');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#eeff00] rounded-full blur-[120px] opacity-10" 
        />
      </div>

      <div className="max-w-lg w-full text-center relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1.2, bounce: 0.5 }}
          className="relative w-32 h-32 mx-auto mb-8"
        >
          <div className="absolute inset-0 bg-[#eeff00] rounded-full blur-2xl opacity-50 animate-pulse" />
          <div className="relative w-full h-full bg-[#eeff00] rounded-full flex items-center justify-center text-black shadow-[0_0_60px_rgba(238,255,0,0.6)]">
            <Zap className="w-16 h-16" strokeWidth={2} />
          </div>
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border border-dashed border-[#eeff00]/30 rounded-full"
          />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl md:text-6xl font-black mb-6 tracking-tight leading-none"
        >
          <span className="block text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-zinc-500">
            BEM-VINDO
          </span>
          <span className="text-[#eeff00]">AO TIME!</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-zinc-200 text-lg md:text-xl mb-12 leading-relaxed"
        >
          Sua conta foi configurada e seu <span className="text-white font-bold">Starter Pack</span> garantido. 
          <br />
          Agora é hora de começar a sua jornada.
        </motion.p>

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[#eeff00]" />
            <p className="text-sm text-zinc-400 font-medium">Finalizando os últimos ajustes...</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
             <Button
                onClick={handleStart}
                className="group relative w-full h-20 bg-[#eeff00] hover:bg-[#eeff00] text-black overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(238,255,0,0.3)]"
             >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                
                <div className="relative flex flex-col items-center justify-center">
                  <span className="text-xl font-black tracking-wide">COMEÇAR JORNADA</span>
                  <span className="text-xs font-bold opacity-60 uppercase tracking-widest mt-1">Acessar aplicativo</span>
                </div>
                
                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                  <ArrowRight className="w-8 h-8" />
                </div>
             </Button>

          </motion.div>
        )}
      </div>
    </div>
  );
}
