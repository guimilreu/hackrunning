"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function AuthLayout({ children }) {
	const { isAuthenticated, _hasHydrated } = useAuthStore();
	const router = useRouter();

	useEffect(() => {
		if (_hasHydrated && isAuthenticated) {
			router.push("/home");
		}
	}, [isAuthenticated, _hasHydrated, router]);

	if (!_hasHydrated) {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	if (isAuthenticated) return null;

	return (
		<div
			className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background bg-cover bg-center bg-no-repeat"
			style={{ backgroundImage: "url('/hackrunning-bg.png')" }}
		>
			{/* Dynamic Background */}
			<div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
				<div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[100px] animate-pulse-slow" />
				<div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[100px] animate-pulse-slow delay-700" />
			</div>

			<div className="w-full max-w-md space-y-8 z-10 px-4">
				<div className="text-center space-y-2 flex flex-col items-center">
					<div className="mb-4">
						<img src="/logo.png" alt="Hack Running" className="object-contain h-16" />
					</div>
					<h1 className="text-3xl font-bold tracking-tighter text-white">Bem-vindo de volta</h1>
					<p className="text-zinc-400 text-sm max-w-xs mx-auto">Prepare-se para superar seus limites hoje.</p>
				</div>
				{children}
			</div>
		</div>
	);
}
