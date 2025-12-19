"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Mail, Calendar, Zap, Award, Phone, MapPin, Activity, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const useMember = (id) => {
	return useQuery({
		queryKey: ["admin", "member", id],
		queryFn: async () => {
			const response = await api.get(`/users/${id}`);
			return response.data?.data || response.data;
		},
		enabled: !!id,
	});
};

export default function AdminMemberDetailPage() {
	const params = useParams();
	const { data: member, isLoading } = useMember(params.id);

	const container = {
		hidden: { opacity: 0 },
		show: { opacity: 1, transition: { staggerChildren: 0.1 } },
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 },
	};

	if (isLoading) {
		return (
			<div className="space-y-8">
				<Skeleton className="h-10 w-32" />
				<Skeleton className="h-[300px] w-full rounded-3xl" />
				<div className="grid gap-6 md:grid-cols-2">
					<Skeleton className="h-40 w-full rounded-3xl" />
					<Skeleton className="h-40 w-full rounded-3xl" />
				</div>
			</div>
		);
	}

	if (!member) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
				<User className="w-16 h-16 text-zinc-700 mb-6" />
				<h3 className="text-xl font-bold text-white mb-2">Membro não encontrado</h3>
				<Link href="/admin/members">
					<Button className="mt-4 bg-primary text-black font-bold">Voltar para a lista</Button>
				</Link>
			</div>
		);
	}

	return (
		<motion.div 
			className="space-y-8 pb-10"
			variants={container}
			initial="hidden"
			animate="show"
		>
			<div className="flex items-center gap-4">
				<Link href="/admin/members">
					<Button variant="ghost" className="hover:bg-white/10 text-zinc-400 hover:text-white rounded-full w-10 h-10 p-0">
						<ArrowLeft className="h-5 w-5" />
					</Button>
				</Link>
				<h1 className="text-xl font-bold text-white">Detalhes do Membro</h1>
			</div>

			{/* Profile Header */}
			<motion.div variants={item}>
				<div className="glass-card rounded-3xl p-8 border-white/5 relative overflow-hidden">
					{/* Background Decoration */}
					<div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

					<div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
						<Avatar className="h-32 w-32 border-4 border-white/5 ring-4 ring-white/5 shadow-2xl">
							<AvatarImage src={member.photo || member.profilePhoto} className="object-cover" />
							<AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold text-4xl">
								{(member.name || member.firstName || member.email || "M")[0].toUpperCase()}
							</AvatarFallback>
						</Avatar>

						<div className="flex-1 text-center md:text-left space-y-4">
							<div>
								<h2 className="text-3xl font-bold text-white tracking-tight mb-2">
									{member.name || `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email}
								</h2>
								<div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
									<Badge className="bg-primary/20 text-primary border-primary/20 px-3 py-1 hover:bg-primary/30 uppercase tracking-wide font-bold">
										{member.plan?.type || member.plan || "free"}
									</Badge>
									<Badge 
										variant="outline" 
										className={`border-white/10 ${member.status === 'active' || member.active ? 'text-green-400 bg-green-500/10' : 'text-zinc-400 bg-white/5'}`}
									>
										{member.status === 'active' || member.active ? (
											<span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Ativo</span>
										) : (
											<span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-zinc-400" /> Inativo</span>
										)}
									</Badge>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-white/5">
								<div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
									<div className="p-2 bg-white/5 rounded-lg">
										<Mail className="h-4 w-4 text-zinc-400" />
									</div>
									<div className="overflow-hidden">
										<p className="text-xs text-zinc-500 uppercase font-bold">Email</p>
										<p className="text-sm text-white truncate" title={member.email}>{member.email}</p>
									</div>
								</div>

								{member.phone && (
									<div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
										<div className="p-2 bg-white/5 rounded-lg">
											<Phone className="h-4 w-4 text-zinc-400" />
										</div>
										<div>
											<p className="text-xs text-zinc-500 uppercase font-bold">Telefone</p>
											<p className="text-sm text-white">{member.phone}</p>
										</div>
									</div>
								)}

								{(member.city || member.location) && (
									<div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
										<div className="p-2 bg-white/5 rounded-lg">
											<MapPin className="h-4 w-4 text-zinc-400" />
										</div>
										<div>
											<p className="text-xs text-zinc-500 uppercase font-bold">Localização</p>
											<p className="text-sm text-white">{member.city || member.location}</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Stats Grid */}
			<div className="grid gap-6 md:grid-cols-3">
				<motion.div variants={item}>
					<div className="glass-card rounded-3xl p-6 border-white/5 bg-gradient-to-br from-yellow-500/10 to-transparent">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500">
								<Zap className="h-6 w-6" />
							</div>
							<h3 className="font-bold text-white">HPoints</h3>
						</div>
						<div className="space-y-1">
							<p className="text-4xl font-bold text-white tracking-tighter">{member.hpointsBalance || 0}</p>
							<p className="text-zinc-500 text-sm">Pontos acumulados</p>
						</div>
					</div>
				</motion.div>

				<motion.div variants={item}>
					<div className="glass-card rounded-3xl p-6 border-white/5 bg-gradient-to-br from-primary/10 to-transparent">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-primary/20 rounded-xl text-primary">
								<Activity className="h-6 w-6" />
							</div>
							<h3 className="font-bold text-white">Treinos</h3>
						</div>
						<div className="space-y-1">
							<p className="text-4xl font-bold text-white tracking-tighter">{member.totalWorkouts || 0}</p>
							<p className="text-zinc-500 text-sm">Treinos concluídos</p>
						</div>
					</div>
				</motion.div>

				<motion.div variants={item}>
					<div className="glass-card rounded-3xl p-6 border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-3 bg-blue-500/20 rounded-xl text-blue-500">
								<Clock className="h-6 w-6" />
							</div>
							<h3 className="font-bold text-white">Adesão</h3>
						</div>
						<div className="space-y-1">
							<p className="text-4xl font-bold text-white tracking-tighter">{member.adherence || "0"}%</p>
							<p className="text-zinc-500 text-sm">Taxa de frequência</p>
						</div>
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
}
