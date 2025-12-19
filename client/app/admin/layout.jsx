"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
	LayoutDashboard,
	Users,
	Building2,
	Calendar,
	CheckCircle,
	Zap,
	ShoppingBag,
	Award,
	FileText,
	Bell,
	LogOut,
	Loader2,
	Settings,
	ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { ScrollArea } from "@/components/ui/scroll-area";

const ADMIN_NAV_ITEMS = [
	{ label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
	{ label: "Membros", href: "/admin/members", icon: Users },
	{ label: "Empresas", href: "/admin/companies", icon: Building2 },
	{ label: "Planilhas", href: "/admin/training-plans", icon: Calendar },
	{ label: "Validação", href: "/admin/validation", icon: CheckCircle },
	{ label: "HPoints", href: "/admin/hpoints", icon: Zap },
	{ label: "Loja", href: "/admin/store", icon: ShoppingBag },
	{ label: "Eventos", href: "/admin/events", icon: Award },
	{ label: "Conteúdo", href: "/admin/content", icon: FileText },
	{ label: "Notificações", href: "/admin/notifications", icon: Bell },
];

export default function AdminLayout({ children }) {
	const { isAuthenticated, user, logout, _hasHydrated } = useAuthStore();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		if (_hasHydrated) {
			if (!isAuthenticated) {
				router.push("/login");
				return;
			}
			// Verificar se é admin
			if (user?.role !== "admin" && user?.role !== "super_admin") {
				router.push("/app/home");
			}
		}
	}, [isAuthenticated, _hasHydrated, user, router]);

	if (!_hasHydrated) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "super_admin")) {
		return null;
	}

	return (
		<div className="min-h-screen bg-black flex flex-col md:flex-row font-sans text-white overflow-hidden">
			{/* Desktop Sidebar */}
			<aside className="hidden md:flex flex-col w-72 border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl h-screen sticky top-0 z-50">
				<div className="p-6 border-b border-white/5">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
							<Settings className="w-5 h-5 text-black" />
						</div>
						<div>
							<h1 className="text-xl font-bold tracking-tighter text-white leading-none">
								ADMIN
							</h1>
							<p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-0.5">
								Hack Running
							</p>
						</div>
					</div>
				</div>

				<ScrollArea className="flex-1 px-4 py-6">
					<div className="space-y-1">
						<p className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Menu Principal</p>
						<nav className="space-y-1">
							{ADMIN_NAV_ITEMS.map((item) => {
								const isActive = pathname.startsWith(item.href);
								return (
									<Link key={item.href} href={item.href}>
										<Button
											variant="ghost"
											className={cn(
												"w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200 group relative overflow-hidden",
												isActive 
													? "bg-primary text-black font-bold hover:bg-primary/90" 
													: "text-zinc-400 hover:text-white hover:bg-white/5"
											)}
										>
											<item.icon className={cn("h-5 w-5", isActive ? "text-black" : "text-zinc-500 group-hover:text-white")} />
											<span className="flex-1 text-left">{item.label}</span>
											{isActive && <ChevronRight className="w-4 h-4 text-black/50" />}
										</Button>
									</Link>
								);
							})}
						</nav>
					</div>
				</ScrollArea>

				<div className="p-4 border-t border-white/5 bg-black/20">
					<div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 mb-2">
						<div className="flex items-center gap-3 mb-3">
							<Avatar className="h-10 w-10 border border-white/10">
								<AvatarImage src={user?.photo} />
								<AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">{user?.name?.[0] || "A"}</AvatarFallback>
							</Avatar>
							<div className="flex-1 overflow-hidden">
								<p className="text-sm font-bold truncate text-white">{user?.name}</p>
								<p className="text-xs text-zinc-500 truncate">{user?.email}</p>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<Link href="/app/home">
								<Button variant="outline" size="sm" className="w-full h-8 text-xs border-white/10 hover:bg-white/5 hover:text-white">
									App
								</Button>
							</Link>
							<Button 
								variant="outline" 
								size="sm" 
								className="w-full h-8 text-xs border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400"
								onClick={logout}
							>
								Sair
							</Button>
						</div>
					</div>
				</div>
			</aside>

			{/* Mobile Header */}
			<header className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950 sticky top-0 z-50">
				<div className="flex items-center gap-2">
					<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
						<Settings className="w-5 h-5 text-black" />
					</div>
					<h1 className="text-lg font-bold tracking-tighter text-white">
						ADMIN
					</h1>
				</div>
				<Avatar className="h-8 w-8 border border-white/10">
					<AvatarImage src={user?.photo} />
					<AvatarFallback>{user?.name?.[0] || "A"}</AvatarFallback>
				</Avatar>
			</header>

			{/* Main Content */}
			<main className="flex-1 overflow-y-auto bg-black relative">
				{/* Background Gradients */}
				<div className="fixed inset-0 pointer-events-none">
					<div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
					<div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
				</div>
				
				<div className="relative z-10 p-4 pb-24 md:p-8 max-w-7xl mx-auto">
					{children}
				</div>
			</main>
		</div>
	);
}
