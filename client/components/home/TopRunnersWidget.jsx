"use client";

import { useTopRunners } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Activity } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export function TopRunnersWidget() {
	const { data: runners, isLoading } = useTopRunners();

	return (
		<motion.div
			variants={{
				hidden: { opacity: 0, y: 20 },
				show: { opacity: 1, y: 0 },
			}}
			className="glass-card rounded-3xl p-6 border-white/5"
		>
			<div className="flex items-center gap-2 text-primary mb-4">
				<Trophy className="w-5 h-5" />
				<span className="text-xs font-bold uppercase tracking-wider">
					Top 10 da Semana
				</span>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-12 w-full bg-white/5" />
					))}
				</div>
			) : runners && runners.length > 0 ? (
				<div className="space-y-2">
					{runners.map((runner, index) => (
						<Link
							key={runner.userId}
							href={`/runner/${runner.userId}`}
							className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group"
						>
							<div className="flex items-center gap-3 flex-1 min-w-0">
								<div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
									{index < 3 ? (
										<div
											className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
												index === 0
													? "bg-yellow-500/20 text-yellow-500"
													: index === 1
													? "bg-zinc-400/20 text-zinc-400"
													: "bg-orange-500/20 text-orange-500"
											}`}
										>
											{index + 1}
										</div>
									) : (
										<span className="text-xs text-zinc-500 font-bold w-6 text-center">
											{index + 1}
										</span>
									)}
								</div>
								<Avatar className="h-8 w-8 border border-white/10 flex-shrink-0">
									<AvatarImage src={runner.photo} />
									<AvatarFallback className="bg-zinc-800 font-bold text-zinc-400 text-xs">
										{runner.name?.[0] || "U"}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-bold text-white truncate">
										{runner.name || "Runner"}
									</p>
									<div className="flex items-center gap-2 text-xs text-zinc-400">
										<span className="font-mono font-bold text-primary">
											{Number(runner.totalDistance).toFixed(2)} km
										</span>
										<span className="text-zinc-600">•</span>
										<span className="flex items-center gap-1 text-[10px] text-zinc-500">
											<Activity className="w-2.5 h-2.5" />
											{runner.activityCount} {runner.activityCount === 1 ? "atividade" : "atividades"}
										</span>
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>
			) : (
				<div className="text-center py-8">
					<Trophy className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
					<p className="text-sm text-zinc-500">
						Nenhum corredor esta semana
					</p>
				</div>
			)}
		</motion.div>
	);
}

