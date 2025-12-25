"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Mail, Filter, ChevronRight, User, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const useMembers = (filters) => {
	return useQuery({
		queryKey: ["admin", "members", filters],
		queryFn: async () => {
			const params = new URLSearchParams();
			Object.keys(filters).forEach((key) => {
				if (filters[key]) {
					params.append(key, filters[key]);
				}
			});
			const response = await api.get(`/users?${params.toString()}`);
			return response.data?.data || response.data;
		},
	});
};

export default function AdminMembersPage() {
	const [search, setSearch] = useState("");
	const [planFilter, setPlanFilter] = useState("all");

	const filters = {
		...(planFilter !== "all" && { plan: planFilter }),
		...(search && { search }),
	};

	const { data: membersData, isLoading } = useMembers(filters);
	const members = membersData?.users || membersData?.data?.users || membersData || [];

	const container = {
		hidden: { opacity: 0 },
		show: { opacity: 1, transition: { staggerChildren: 0.05 } },
	};

	const item = {
		hidden: { opacity: 0, y: 10 },
		show: { opacity: 1, y: 0 },
	};

	return (
		<div className="space-y-8 pb-10">
			{/* Header */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
				<div className="space-y-1">
					<h1 className="text-4xl font-bold tracking-tighter text-white">
						Gestão de <span className="text-primary">Membros</span>
					</h1>
					<p className="text-zinc-400 text-lg">Administre os runners e usuários da plataforma</p>
				</div>
				<div className="flex gap-3 w-full md:w-auto">
					<Button className="bg-white/5 text-white hover:bg-white/10 border border-white/10">
						<Users className="mr-2 h-4 w-4" />
						Convidar Membro
					</Button>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-900/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
				<div className="relative flex-1 w-full">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
					<Input
						placeholder="Buscar por nome, email ou CPF..."
						className="pl-10 bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-primary/50 rounded-xl h-11"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
					<select
						value={planFilter}
						onChange={(e) => setPlanFilter(e.target.value)}
						className="px-4 py-2 bg-zinc-900/50 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none min-w-[150px]"
					>
						<option value="all">Todos os Planos</option>
						<option value="free">Gratuito</option>
						<option value="premium">Premium</option>
					</select>
					<Button variant="outline" className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 gap-2 rounded-xl h-11">
						<Filter className="h-4 w-4" />
						Mais Filtros
					</Button>
				</div>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-20 w-full rounded-2xl bg-zinc-900/50" />
					))}
				</div>
			) : members.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/5">
					<Users className="w-16 h-16 text-zinc-700 mb-6" />
					<h3 className="text-xl font-bold text-white mb-2">Nenhum membro encontrado</h3>
					<p className="text-zinc-500 max-w-md mx-auto mb-6">
						Tente ajustar os filtros de busca para encontrar o que procura.
					</p>
					<Button
						variant="outline"
						onClick={() => {
							setSearch("");
							setPlanFilter("all");
						}}
						className="border-white/10 text-white hover:bg-white/5"
					>
						Limpar Filtros
					</Button>
				</div>
			) : (
				<motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
					{members.map((member) => (
						<motion.div variants={item} key={member._id}>
							<Link href={`/admin/members/${member._id}`}>
								<div className="glass-card rounded-2xl p-4 border-white/5 hover:border-primary/30 hover:bg-white/5 transition-all duration-200 cursor-pointer group flex items-center gap-4">
									<Avatar className="h-12 w-12 border border-white/10 group-hover:border-primary/50 transition-colors">
										<AvatarImage src={member.photo || member.profilePhoto} />
										<AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">
											{(member.name || member.firstName || member.email || "M")[0].toUpperCase()}
										</AvatarFallback>
									</Avatar>

									<div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
										<div>
											<p className="font-bold text-white truncate group-hover:text-primary transition-colors">
												{member.name || `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email}
											</p>
											<p className="text-xs text-zinc-500 flex items-center gap-1.5 truncate">
												<Mail className="h-3 w-3" />
												{member.email}
											</p>
										</div>

										<div className="hidden md:flex flex-col">
											<span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Plano</span>
											<Badge
												variant="outline"
												className="w-fit border-white/10 bg-white/5 text-zinc-300 font-normal capitalize"
											>
												{member.plan?.type || member.plan || "free"}
											</Badge>
										</div>

										<div className="hidden md:flex flex-col">
											<span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Status</span>
											<div className="flex items-center gap-2">
												<div
													className={`w-2 h-2 rounded-full ${
														member.status === "active" || member.active ? "bg-green-500" : "bg-zinc-500"
													}`}
												/>
												<span className="text-sm text-zinc-300 capitalize">
													{member.status || (member.active ? "Ativo" : "Inativo")}
												</span>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Button size="icon" variant="ghost" className="rounded-full text-zinc-500 hover:text-white hover:bg-white/10">
											<MoreVertical className="w-4 h-4" />
										</Button>
										<div className="hidden md:flex w-8 h-8 rounded-full bg-white/5 items-center justify-center group-hover:bg-primary group-hover:text-black transition-all">
											<ChevronRight className="w-4 h-4" />
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
