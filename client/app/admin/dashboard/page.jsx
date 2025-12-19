"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, Zap, TrendingUp, Award, ShoppingBag, ArrowUpRight, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

const useAdminDashboard = () => {
	return useQuery({
		queryKey: ["admin", "dashboard"],
		queryFn: async () => {
			const response = await api.get("/admin/dashboard");
			return response.data?.data || response.data;
		},
	});
};

const useAdminStats = () => {
	return useQuery({
		queryKey: ["admin", "stats"],
		queryFn: async () => {
			const response = await api.get("/admin/stats");
			return response.data?.data || response.data;
		},
	});
};

export default function AdminDashboardPage() {
	const { data: dashboard, isLoading: loadingDashboard } = useAdminDashboard();
	const { data: stats, isLoading: loadingStats } = useAdminStats();

	const container = {
		hidden: { opacity: 0 },
		show: { opacity: 1, transition: { staggerChildren: 0.1 } },
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 },
	};

	const statsCards = [
		{
			title: "Membros Totais",
			value: stats?.totalMembers || dashboard?.users?.total || dashboard?.users?.active || 0,
			icon: Users,
			color: "text-blue-500",
			bg: "bg-blue-500/10",
			border: "border-blue-500/20",
		},
		{
			title: "Adesão Média",
			value: `${stats?.averageAdherence || dashboard?.users?.growthRate || 0}%`,
			icon: TrendingUp,
			color: "text-green-500",
			bg: "bg-green-500/10",
			border: "border-green-500/20",
		},
		{
			title: "KM Total",
			value: stats?.totalKm || dashboard?.workouts?.total || 0,
			icon: Calendar,
			color: "text-primary",
			bg: "bg-primary/10",
			border: "border-primary/20",
		},
		{
			title: "HPoints Gerados",
			value: stats?.totalHPoints || dashboard?.hpoints?.creditedThisMonth || 0,
			icon: Zap,
			color: "text-yellow-500",
			bg: "bg-yellow-500/10",
			border: "border-yellow-500/20",
		},
		{
			title: "Treinos Registrados",
			value: stats?.totalWorkouts || dashboard?.workouts?.total || 0,
			icon: Award,
			color: "text-purple-500",
			bg: "bg-purple-500/10",
			border: "border-purple-500/20",
		},
		{
			title: "Resgates Realizados",
			value: stats?.totalRedemptions || dashboard?.redemptions?.pending || 0,
			icon: ShoppingBag,
			color: "text-orange-500",
			bg: "bg-orange-500/10",
			border: "border-orange-500/20",
		},
	];

	return (
		<div className="space-y-8 pb-10">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
				<div className="space-y-1">
					<h1 className="text-4xl font-bold tracking-tighter text-white">
						Dashboard <span className="text-primary">Admin</span>
					</h1>
					<p className="text-zinc-400 text-lg">Visão geral e métricas da plataforma</p>
				</div>
			</div>

			{/* Stats Grid */}
			<motion.div
				variants={container}
				initial="hidden"
				animate="show"
				className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
			>
				{statsCards.map((stat, index) => {
					const Icon = stat.icon;
					const isLoading = loadingDashboard && loadingStats;

					return (
						<motion.div variants={item} key={index}>
							<div className="glass-card rounded-3xl p-6 relative overflow-hidden group hover:bg-white/5 transition-colors">
								<div className="flex items-start justify-between mb-4">
									<div className={cn("p-3 rounded-2xl", stat.bg)}>
										<Icon className={cn("w-6 h-6", stat.color)} />
									</div>
									<div className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", stat.bg, stat.color, stat.border)}>
										+2.5%
									</div>
								</div>
								
								<div className="space-y-1">
									<h3 className="text-zinc-400 font-medium text-sm">{stat.title}</h3>
									{isLoading ? (
										<Skeleton className="h-10 w-32 bg-white/5" />
									) : (
										<div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
									)}
								</div>

								{/* Decorator */}
								<div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
							</div>
						</motion.div>
					);
				})}
			</motion.div>

			{/* Content Grid */}
			<div className="grid gap-6 md:grid-cols-2">
				<div className="glass-card rounded-3xl p-8 border-white/5">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-xl font-bold text-white flex items-center gap-2">
							<Activity className="text-primary w-5 h-5" />
							Últimas Atividades
						</h2>
						<button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1">
							Ver todas <ArrowUpRight className="w-3 h-3" />
						</button>
					</div>
					
					<div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
						<Activity className="w-12 h-12 text-zinc-700 mb-4" />
						<h3 className="text-white font-bold mb-1">Sem dados recentes</h3>
						<p className="text-zinc-500 text-sm max-w-xs">
							Gráficos e estatísticas detalhadas serão implementados em breve.
						</p>
					</div>
				</div>

				<div className="glass-card rounded-3xl p-8 border-white/5">
					<div className="flex items-center justify-between mb-8">
						<h2 className="text-xl font-bold text-white flex items-center gap-2">
							<Users className="text-primary w-5 h-5" />
							Top Membros
						</h2>
						<button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider flex items-center gap-1">
							Ver ranking <ArrowUpRight className="w-3 h-3" />
						</button>
					</div>

					<div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/10 rounded-2xl bg-black/20">
						<Users className="w-12 h-12 text-zinc-700 mb-4" />
						<h3 className="text-white font-bold mb-1">Ranking Vazio</h3>
						<p className="text-zinc-500 text-sm max-w-xs">
							O ranking de membros mais ativos aparecerá aqui.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
