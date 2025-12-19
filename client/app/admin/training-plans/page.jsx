"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, ArrowRight, Dumbbell, Clock, Activity, Search, Filter } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const useTrainingPlans = () => {
	return useQuery({
		queryKey: ["admin", "training-plans"],
		queryFn: async () => {
			// Tenta buscar na rota admin se existir, ou fallback para rota geral
			try {
				const response = await api.get("/training-plans/admin/all");
				return response.data?.data || response.data;
			} catch (error) {
				// Fallback para rota antiga ou tentativa de listar
				const response = await api.get("/training-plans");
				return response.data?.data || response.data;
			}
		},
		retry: 1
	});
};

export default function AdminTrainingPlansPage() {
	const { data: plansData, isLoading } = useTrainingPlans();
	const plans = Array.isArray(plansData) ? plansData : (plansData?.plans || []);

	const container = {
		hidden: { opacity: 0 },
		show: { opacity: 1, transition: { staggerChildren: 0.1 } },
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 },
	};

	return (
		<div className="space-y-8 pb-10">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
				<div className="space-y-1">
					<h1 className="text-4xl font-bold tracking-tighter text-white">
						Planilhas de <span className="text-primary">Treino</span>
					</h1>
					<p className="text-zinc-400 text-lg">Gerencie os modelos e atribuições de treinos</p>
				</div>
				<div className="flex gap-3 w-full md:w-auto">
					<Button className="bg-primary text-black font-bold hover:bg-primary/90">
						<Dumbbell className="mr-2 h-4 w-4" />
						Nova Planilha
					</Button>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col md:flex-row gap-4">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
					<Input 
						placeholder="Buscar planilhas..." 
						className="pl-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-primary/50 rounded-xl"
					/>
				</div>
				<Button variant="outline" className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 gap-2 rounded-xl">
					<Filter className="h-4 w-4" />
					Filtros
				</Button>
			</div>

			{/* Grid */}
			{isLoading ? (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Skeleton key={i} className="h-[200px] w-full rounded-3xl bg-zinc-900/50" />
					))}
				</div>
			) : plans.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
					<Dumbbell className="w-16 h-16 text-zinc-700 mb-6" />
					<h3 className="text-xl font-bold text-white mb-2">Nenhuma planilha encontrada</h3>
					<p className="text-zinc-500 max-w-md mx-auto mb-6">
						Não encontramos planilhas cadastradas no sistema. Crie a primeira planilha para começar.
					</p>
					<Button className="bg-primary text-black font-bold">
						Criar Planilha
					</Button>
				</div>
			) : (
				<motion.div
					variants={container}
					initial="hidden"
					animate="show"
					className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
				>
					{plans.map((plan) => (
						<motion.div variants={item} key={plan._id}>
							<Link href={`/admin/training-plans/${plan._id}`} className="block group h-full">
								<div className="glass-card rounded-3xl p-6 h-full border-white/5 group-hover:border-primary/50 transition-all duration-300 relative overflow-hidden flex flex-col">
									{/* Hover Gradient */}
									<div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

									<div className="relative z-10 flex-1">
										<div className="flex justify-between items-start mb-4">
											<div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/5 group-hover:border-primary/20 transition-colors">
												<Dumbbell className="w-6 h-6 text-primary" />
											</div>
											<Badge variant="outline" className="bg-white/5 border-white/10 text-zinc-400 text-[10px] uppercase font-bold tracking-wider group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
												{plan.level || "Geral"}
											</Badge>
										</div>

										<h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">
											{plan.name || "Planilha Sem Nome"}
										</h3>
										
										<p className="text-zinc-500 text-sm mb-6 line-clamp-2">
											{plan.description || "Sem descrição definida para esta planilha."}
										</p>

										<div className="grid grid-cols-2 gap-3 mt-auto">
											<div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
												<div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
													<Calendar className="w-3 h-3" />
													<span>Treinos</span>
												</div>
												<span className="text-lg font-bold text-white">{plan.workouts?.length || 0}</span>
											</div>
											<div className="bg-zinc-900/50 rounded-xl p-3 border border-white/5">
												<div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
													<Users className="w-3 h-3" />
													<span>Membros</span>
												</div>
												<span className="text-lg font-bold text-white">{plan.usersCount || 0}</span>
											</div>
										</div>
									</div>

									<div className="relative z-10 mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
										<span className="text-zinc-500 group-hover:text-zinc-300 transition-colors">
											Ver detalhes
										</span>
										<div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
											<ArrowRight className="w-4 h-4" />
										</div>
									</div>
								</div>
							</Link>
						</motion.div>
					))}
				</motion.div>
			)}
		</div>
	);
}
