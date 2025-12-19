'use client';

import { useParams, useRouter } from 'next/navigation';
import { useProduct, useRedeemProduct, useProducts } from '@/hooks/useStore';
import { useHPointsBalance } from '@/hooks/useHPoints';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  ArrowRight,
  ShoppingBag, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Share2, 
  Heart, 
  ShieldCheck, 
  Truck, 
  Zap,
  Info
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id);
  const { data: balanceData } = useHPointsBalance();
  const { mutate: redeem, isPending } = useRedeemProduct();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Fetch related products based on category
  const { data: productsData } = useProducts(
    product ? { category: product.category } : null
  );

  const displayProduct = product;

  // Process balance
  const balance = balanceData && typeof balanceData === 'object' 
    ? (balanceData.balance ?? 0)
    : (typeof balanceData === 'number' ? balanceData : 0);
  
  const canAfford = displayProduct ? balance >= displayProduct.points : false;

  // Process related products
  const allProducts = Array.isArray(productsData) 
  ? productsData 
  : (productsData?.products && Array.isArray(productsData.products))
  ? productsData.products
  : (productsData?.data && Array.isArray(productsData.data))
  ? productsData.data
  : [];

  const relatedProducts = allProducts
    .filter(p => p?._id && p._id !== id)
    .slice(0, 4);

  const handleRedeem = () => {
    redeem({ productId: id }, {
      onSuccess: () => {
        setIsDialogOpen(false);
      }
    });
  };

  if (isLoading || !displayProduct) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-10">
         <div className="flex gap-4">
             <Skeleton className="h-10 w-32 bg-zinc-900" />
         </div>
         <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
             <Skeleton className="h-[500px] w-full rounded-3xl bg-zinc-900" />
             <div className="space-y-6">
                 <Skeleton className="h-8 w-1/3 bg-zinc-900" />
                 <Skeleton className="h-16 w-3/4 bg-zinc-900" />
                 <Skeleton className="h-24 w-full bg-zinc-900" />
                 <Skeleton className="h-12 w-1/2 bg-zinc-900" />
             </div>
         </div>
      </div>
    );
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
       
       {/* Header / Breadcrumb */}
       <motion.div 
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         className="flex items-center justify-between"
       >
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="pl-0 text-zinc-400 hover:text-white hover:pl-2 transition-all group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para Loja
          </Button>
          
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white rounded-full">
                <Share2 className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-red-500 rounded-full">
                <Heart className="h-5 w-5" />
            </Button>
          </div>
       </motion.div>

       {/* Main Product Section */}
       <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            
            {/* Image Column */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative aspect-square lg:aspect-[4/3] w-full rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/50 group"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {displayProduct.image ? (
                    <Image 
                        src={displayProduct.image} 
                        alt={displayProduct.name} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-105" 
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <ShoppingBag className="w-24 h-24 opacity-20" />
                    </div>
                )}
                
                <div className="absolute top-4 left-4 z-10">
                     <Badge className="bg-black/60 backdrop-blur-md text-white border border-white/10 hover:bg-black/80 px-3 py-1.5 text-sm font-medium uppercase tracking-wider">
                        {displayProduct.category}
                     </Badge>
                </div>
            </motion.div>

            {/* Info Column */}
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                <motion.div variants={item} className="space-y-4">
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                        {displayProduct.name}
                    </h1>
                    
                    <div className="flex items-end gap-3">
                        <div className="text-5xl font-black text-primary tracking-tighter">
                            {displayProduct.points} <span className="text-2xl font-bold text-primary/80">HP</span>
                        </div>
                        {canAfford ? (
                            <Badge variant="outline" className="mb-2 border-green-500/30 text-green-400 bg-green-500/10">
                                <CheckCircle className="w-3 h-3 mr-1" /> Saldo Suficiente
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="mb-2 border-red-500/30 text-red-400 bg-red-500/10">
                                <AlertCircle className="w-3 h-3 mr-1" /> Saldo Insuficiente ({balance} HP)
                            </Badge>
                        )}
                    </div>
                </motion.div>

                <motion.div variants={item} className="prose prose-invert prose-zinc max-w-none">
                    <p className="text-lg text-zinc-300 leading-relaxed">
                        {displayProduct.description}
                    </p>
                </motion.div>

                {/* Feature Cards */}
                <motion.div variants={item} className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                        <Zap className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                            <h4 className="font-bold text-white text-sm">Resgate Instantâneo</h4>
                            <p className="text-xs text-zinc-400 mt-1">Código enviado para seu email imediatamente.</p>
                        </div>
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                            <h4 className="font-bold text-white text-sm">Garantia Oficial</h4>
                            <p className="text-xs text-zinc-400 mt-1">Produto verificado e autêntico.</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={item} className="pt-6 border-t border-white/5">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                className="w-full h-14 text-lg font-bold bg-primary text-black hover:bg-primary/90 shadow-[0_0_20px_rgba(238,255,0,0.2)] hover:shadow-[0_0_30px_rgba(238,255,0,0.4)] transition-all rounded-xl"
                                disabled={!canAfford || (displayProduct.stock && !displayProduct.stock.available)}
                            >
                                <ShoppingBag className="mr-2 h-5 w-5" />
                                Resgatar Agora
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-xl">Confirmar Resgate</DialogTitle>
                                <DialogDescription>
                                    Você está prestes a usar seus pontos suados para adquirir este item.
                                </DialogDescription>
                            </DialogHeader>
                            
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-white/5 my-4">
                                <div className="flex gap-4 items-center">
                                    <div className="relative h-16 w-16 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                                         {displayProduct.image && <Image src={displayProduct.image} alt={displayProduct.name} fill className="object-cover" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white truncate">{displayProduct.name}</h4>
                                        <div className="flex items-center mt-1">
                                            <span className="font-black text-primary">{displayProduct.points} HP</span>
                                            <span className="text-zinc-500 mx-2">•</span>
                                            <span className="text-xs text-zinc-400">Saldo restante: {balance - displayProduct.points} HP</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <DialogFooter className="gap-2 sm:gap-0">
                                <DialogClose asChild>
                                    <Button variant="ghost" className="hover:bg-white/5">Cancelar</Button>
                                </DialogClose>
                                <Button onClick={handleRedeem} disabled={isPending} className="bg-primary text-black font-bold">
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar Troca'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    
                    {!canAfford && (
                         <p className="text-center text-sm text-zinc-500 mt-4">
                             Continue treinando para acumular mais {displayProduct.points - balance} HPoints!
                         </p>
                    )}
                </motion.div>
            </motion.div>
       </div>

       {/* Tabs Section */}
       <div className="mt-16">
            <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-zinc-900/50 border border-white/5 p-1 h-auto rounded-xl w-full justify-start md:w-auto md:inline-flex">
                    <TabsTrigger value="details" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-black font-medium">Detalhes & Regras</TabsTrigger>
                    <TabsTrigger value="specs" className="rounded-lg px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-black font-medium">Especificações</TabsTrigger>
                </TabsList>
                
                <div className="mt-8 min-h-[200px]">
                    <TabsContent value="details" className="space-y-6 animate-fade-in-up">
                        <div className="bg-zinc-900/30 rounded-2xl p-6 border border-white/5">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Info className="w-5 h-5 mr-2 text-primary" />
                                Informações Importantes
                            </h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-zinc-400 leading-relaxed mb-6">
                                        Este produto é uma recompensa exclusiva para membros HackRunning. 
                                        Após o resgate, você receberá instruções detalhadas em seu e-mail cadastrado.
                                        Certifique-se de que seus dados estão atualizados.
                                    </p>
                                    <h4 className="text-white font-bold mb-2">Destaques:</h4>
                                    <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                                        <li>Produto verificado e autêntico</li>
                                        <li>Entrega garantida pela plataforma</li>
                                        <li>Suporte dedicado para resgates</li>
                                    </ul>
                                </div>
                                
                                {displayProduct.restrictions && displayProduct.restrictions.length > 0 && (
                                    <div className="bg-zinc-950/50 rounded-xl p-5 border border-white/5">
                                        <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wider">Regras de Uso</h4>
                                        <ul className="space-y-3">
                                            {displayProduct.restrictions.map((r, i) => (
                                                <li key={i} className="flex items-start text-sm text-zinc-400">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1.5 mr-2 shrink-0" />
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="specs" className="animate-fade-in-up">
                         <div className="bg-zinc-900/30 rounded-2xl p-6 border border-white/5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <span className="text-xs text-zinc-500 uppercase font-bold">Categoria</span>
                                    <p className="text-white font-medium">{displayProduct.category}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-zinc-500 uppercase font-bold">Tipo de Entrega</span>
                                    <p className="text-white font-medium">Digital (E-mail)</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-zinc-500 uppercase font-bold">Validade</span>
                                    <p className="text-white font-medium">30 dias após resgate</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-zinc-500 uppercase font-bold">SKU</span>
                                    <p className="text-white font-medium font-mono text-sm opacity-70">
                                        {displayProduct._id ? displayProduct._id.slice(-8).toUpperCase() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                         </div>
                    </TabsContent>
                </div>
            </Tabs>
       </div>

       {/* Related Products */}
       {relatedProducts.length > 0 && (
           <div className="pt-16 border-t border-white/5">
               <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-bold text-white">Você também pode gostar</h2>
                   <Link href="/store">
                        <Button variant="link" className="text-primary hover:text-primary/80">Ver tudo <ArrowRight className="ml-2 w-4 h-4" /></Button>
                   </Link>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                   {relatedProducts.map((related) => (
                       <Link key={related._id} href={`/store/${related._id}`}>
                           <div className="glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300 h-full group flex flex-col">
                               <div className="relative h-48 w-full bg-zinc-900 overflow-hidden">
                                   {related.image ? (
                                       <Image src={related.image} alt={related.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                   ) : (
                                       <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                            <ShoppingBag className="w-10 h-10" />
                                       </div>
                                   )}
                                   <div className="absolute top-3 left-3">
                                       <Badge className="bg-black/50 backdrop-blur-md text-white border-white/10">{related.category}</Badge>
                                   </div>
                               </div>
                               <div className="p-4 flex flex-col flex-1">
                                   <h3 className="font-bold text-white mb-1 line-clamp-1 group-hover:text-primary transition-colors">{related.name}</h3>
                                   <div className="mt-auto pt-3 flex items-center justify-between">
                                       <span className="text-primary font-bold">{related.points} HP</span>
                                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
                                           <ArrowRight className="w-4 h-4" />
                                       </div>
                                   </div>
                               </div>
                           </div>
                       </Link>
                   ))}
               </div>
           </div>
       )}
    </div>
  );
}
