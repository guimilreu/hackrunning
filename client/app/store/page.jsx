'use client';

import { useProducts } from '@/hooks/useStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Filter, ShoppingBag, ArrowRight, Tag, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function StorePage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const { data: products, isLoading } = useProducts({ 
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const displayProducts = Array.isArray(products) 
    ? products 
    : (products?.products && Array.isArray(products.products))
    ? products.products
    : (products?.data && Array.isArray(products.data))
    ? products.data
    : [];

  const filteredProducts = displayProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  // Extract unique categories and types
  const categories = [...new Set(displayProducts.map(p => p.category).filter(Boolean))];
  const types = [...new Set(displayProducts.map(p => p.type).filter(Boolean))];

  const hasActiveFilters = categoryFilter !== 'all' || typeFilter !== 'all';

  const clearFilters = () => {
    setCategoryFilter('all');
    setTypeFilter('all');
    setSearch('');
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-white">Loja</h1>
          <p className="text-zinc-400 mt-2">Troque seu suor por recompensas exclusivas.</p>
        </div>
        <Link href="/store/my-redemptions">
          <Button variant="outline" className="rounded-full border-white/10 hover:bg-white/10">
            Meus Resgates
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input 
            placeholder="Buscar produtos..." 
            className="pl-10 h-12 bg-zinc-900/50 border-white/10 rounded-full focus:border-primary/50 text-white placeholder:text-zinc-600 transition-all hover:bg-zinc-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12 px-6 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white relative">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-black text-xs font-bold">
                  {[categoryFilter !== 'all', typeFilter !== 'all'].filter(Boolean).length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-zinc-950 border-white/10 w-80">
            <SheetHeader>
              <SheetTitle className="text-white">Filtros</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-400 mb-2 block">Tipo</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="all">Todos</SelectItem>
                    {types.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
                  onClick={clearFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {categoryFilter !== 'all' && (
              <Badge className="bg-primary/20 text-primary border-primary/20 px-3 py-1">
                {categoryFilter}
                <button
                  onClick={() => setCategoryFilter('all')}
                  className="ml-2 hover:text-primary/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {typeFilter !== 'all' && (
              <Badge className="bg-primary/20 text-primary border-primary/20 px-3 py-1">
                {typeFilter}
                <button
                  onClick={() => setTypeFilter('all')}
                  className="ml-2 hover:text-primary/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        key={`store-${isLoading}-${filteredProducts.length}-${search}-${categoryFilter}-${typeFilter}`}
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-3xl h-[400px] overflow-hidden">
              <Skeleton className="h-[200px] w-full bg-white/5" />
              <div className="p-4 space-y-4">
                <Skeleton className="h-6 w-3/4 bg-white/5" />
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5 rounded-full" />
              </div>
            </div>
          ))
        ) : filteredProducts.length === 0 ? (
          <motion.div 
            variants={item}
            className="col-span-full flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum produto encontrado</h3>
            <p className="text-zinc-400 mb-4">Tente ajustar os filtros ou buscar por outro termo.</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            )}
          </motion.div>
        ) : (
          filteredProducts.map((product) => (
            <motion.div variants={item} key={product._id}>
              <Link href={`/store/${product._id}`}>
                <div className="glass-card rounded-3xl overflow-hidden hover:border-primary/30 transition-all duration-300 h-full flex flex-col group relative">
                  {/* Image Container */}
                  <div className="relative h-56 w-full bg-zinc-900 overflow-hidden">
                    {product.image && product.image.trim() !== '' ? (
                      <Image 
                        src={product.image} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        <ShoppingBag className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                    
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/20 px-3 py-1">
                        <Tag className="w-3 h-3 mr-1" />
                        {product.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-500 font-medium uppercase">Valor</span>
                        <span className="text-lg font-bold text-primary">{product.points} HP</span>
                      </div>
                      <Button size="icon" className="rounded-full bg-white text-black hover:bg-zinc-200 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}
