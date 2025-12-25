"use client";

import { useHPointsBalance, useHPointsHistory } from "@/hooks/useHPoints";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
	Trophy,
	ShoppingBag,
	Users,
	History,
	Calendar,
	AlertTriangle,
	ArrowRight,
	TrendingUp,
	Zap,
	Medal,
} from "lucide-react";
import Link from "next/link";
import { safeFormatDate } from "@/lib/utils/date";
import { motion } from "framer-motion";

const QUESTS = [
	{
		title: "Treino do Dia",
		desc: "Complete seu treino planejado",
		points: "+50",
		icon: Calendar,
		progress: 0,
		total: 1,
	},
	{ title: "Desafio Semanal", desc: "Corra 30km esta semana", points: "+500", icon: Trophy, progress: 12, total: 30 },
	{ title: "Social", desc: "Participe de um evento Together", points: "+200", icon: Users, progress: 0, total: 1 },
];

export default function HPointsPage() {
	const { data: balanceData, isLoading: loadingBalance } = useHPointsBalance();
	const { data: historyData, isLoading: loadingHistory } = useHPointsHistory();

	const balance = balanceData || { balance: 0, totalEarned: 0, totalRedeemed: 0 };
	const history = Array.isArray(historyData) ? historyData : [];

	const container = {
		hidden: { opacity: 0 },
		show: {
			opacity: 1,
			transition: { staggerChildren: 0.1 },
		},
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 },
	};

	return (
		<div className="space-y-8 pb-24">
			{/* Header com Status do Usuário */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
			>
				<div>
					<h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white">Seus HPoints</h1>
				</div>

				<Link href="/store">
					<Button className="bg-gradient-to-r from-primary to-primary/80 text-black font-bold hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all rounded-full px-6 h-10 md:h-12">
						<ShoppingBag className="mr-2 h-4 w-4" />
						Resgatar Recompensas
					</Button>
				</Link>
			</motion.div>

			<motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
				{/* Coluna Esquerda: Saldo */}
				<div className="space-y-6">
					{/* Card Principal de Saldo */}
					<motion.div variants={item}>
						<div className="glass-card rounded-[2rem] p-8 relative overflow-hidden border-primary/20">
							{/* Efeitos de Fundo */}
							<div className="absolute top-0 right-0 p-40 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse-slow" />
							<div className="absolute bottom-0 left-0 p-32 bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

							<div className="relative z-10">
								<div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
									<div className="space-y-2">
										<span className="text-zinc-400 font-medium flex items-center gap-2">
											<Zap className="w-4 h-4 text-primary" fill="currentColor" />
											Saldo Disponível
										</span>
										{loadingBalance ? (
											<Skeleton className="h-24 w-64 bg-white/5 rounded-2xl" />
										) : (
											<div className="flex items-baseline gap-2">
												<span className="text-7xl md:text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
													{balance.balance?.toLocaleString("pt-BR") || 0}
												</span>
												<span className="text-xl text-primary font-bold">PTS</span>
											</div>
										)}

										{(balance.expiring || 0) > 0 && (
											<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mt-2">
												<AlertTriangle className="w-3 h-3" />
												{balance.expiring} pontos expirando em breve
											</div>
										)}
									</div>
								</div>
							</div>
						</div>
					</motion.div>

					{/* Seção de Missões (Quests) */}
					{/* <motion.div variants={item}>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<Medal className="w-5 h-5 text-[#eeff00]" />
								Missões Ativas
							</h2>
							<span className="text-xs text-primary font-medium cursor-pointer hover:underline">
								Ver todas
							</span>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							{QUESTS.map((quest, i) => (
								<div
									key={i}
									className="glass-card p-4 rounded-2xl border border-white/5 hover:border-primary/30 transition-all hover:bg-white/5 group cursor-pointer"
								>
									<div className="flex justify-between items-start mb-3">
										<div className="p-2 bg-zinc-900 rounded-xl text-zinc-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
											<quest.icon size={18} />
										</div>
										<Badge className="bg-primary/10 text-primary border-0 font-bold">
											{quest.points}
										</Badge>
									</div>
									<h3 className="font-bold text-white text-sm mb-1">{quest.title}</h3>
									<p className="text-xs text-zinc-400 mb-3 line-clamp-2">{quest.desc}</p>

									<div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
										<div
											className="bg-primary h-full transition-all duration-500"
											style={{ width: `${(quest.progress / quest.total) * 100}%` }}
										/>
									</div>
									<div className="flex justify-between mt-1.5 text-[10px] text-zinc-500">
										<span>
											{quest.progress} / {quest.total}
										</span>
										<span>{Math.round((quest.progress / quest.total) * 100)}%</span>
									</div>
								</div>
							))}
						</div>
					</motion.div> */}

					{/* Histórico Recente */}
					<motion.div variants={item} className="pt-4">
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-bold text-white flex items-center gap-2">
								<History className="w-5 h-5 text-zinc-400" />
								Atividades Recentes
							</h2>
						</div>

						<div className="space-y-3">
							{loadingHistory ? (
								Array.from({ length: 3 }).map((_, i) => (
									<Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/5" />
								))
							) : history.length === 0 ? (
								<div className="glass-card rounded-2xl p-8 text-center border-dashed border-2 border-white/10">
									<p className="text-zinc-500">Nenhuma atividade recente.</p>
								</div>
							) : (
								history.slice(0, 5).map((item) => (
									<div
										key={item._id}
										className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
									>
										<div className="flex items-center gap-4">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center ${
													item.points > 0
														? "bg-green-500/10 text-green-500"
														: "bg-white/5 text-zinc-400"
												}`}
											>
												{item.points > 0 ? <TrendingUp size={18} /> : <ShoppingBag size={18} />}
											</div>
											<div>
												<p className="font-medium text-white text-sm md:text-base">
													{item.description}
												</p>
												<p className="text-xs text-zinc-500">
													{item.date ? safeFormatDate(item.date, "dd MMM, HH:mm") : "-"}
												</p>
											</div>
										</div>
										<span
											className={`font-bold ${
												item.points > 0 ? "text-green-500" : "text-zinc-400"
											}`}
										>
											{item.points > 0 ? "+" : ""}
											{item.points}
										</span>
									</div>
								))
							)}
							{history.length > 0 && (
								<Button variant="ghost" className="w-full text-zinc-500 hover:text-white mt-2">
									Ver histórico completo
								</Button>
							)}
						</div>
					</motion.div>
				</div>
			</motion.div>
		</div>
	);
}
