'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Activity, Users, Trophy, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      {/* Navigation */}
      <nav className="w-full py-6 px-6 md:px-12 flex justify-between items-center z-50">
        <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-black">
            <Activity size={20} />
          </div>
          Hack Running<span className="text-primary">.</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:text-primary transition-colors">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary text-black hover:bg-primary/90 font-semibold rounded-full px-6">
              Começar Agora
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-20 py-12 md:py-24 text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-sm text-zinc-300 mb-4 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            A nova era da corrida conectada
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1]">
            Supere seus <br />
            <span className="text-gradient-primary">limites</span> hoje.
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Junte-se a uma comunidade de elite. Rastreie suas corridas, participe de desafios globais e conquiste recompensas reais.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-zinc-200 transition-all hover:scale-105">
                Criar Conta Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/20 hover:bg-white/10 hover:text-white transition-all">
                Saber Mais
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Stats / Features */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full"
        >
          {[
            { 
              icon: Activity, 
              title: "Tracking Avançado", 
              desc: "Métricas detalhadas em tempo real para maximizar sua performance." 
            },
            { 
              icon: Users, 
              title: "Comunidade Global", 
              desc: "Conecte-se com corredores de todo o mundo e compartilhe conquistas." 
            },
            { 
              icon: Trophy, 
              title: "Gamificação Real", 
              desc: "Ganhe HPoints por km e troque por equipamentos e descontos exclusivos." 
            }
          ].map((feature, i) => (
            <div key={i} className="glass-card p-8 rounded-2xl flex flex-col items-start gap-4 hover:border-primary/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <feature.icon size={24} />
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed text-left">
                {feature.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Simple Footer */}
      <footer className="py-8 text-center text-zinc-600 text-sm">
        <p>&copy; 2025 Hack Running. Todos os direitos reservados.</p>
      </footer>
    </div>
  )
}
