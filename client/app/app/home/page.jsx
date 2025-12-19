"use client";

import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
	useAdherence,
	useNextWorkout,
	useHPointsBalance,
	useNextTogether,
	useCommunityFeed,
} from "@/hooks/useDashboard";
import { useConfirmPresence, useCancelConfirmation } from "@/hooks/useEvents";
import { useToggleLike, useShareWorkout } from "@/hooks/useWorkouts";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Calendar,
	Trophy,
	Zap,
	ArrowRight,
	MapPin,
	TrendingUp,
	Activity,
	Users,
	RefreshCw,
	MessageSquare,
	Heart,
	Share2,
	Check,
	Loader2,
	Edit2,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { safeFormatDate } from "@/lib/utils/date";
import { formatWorkoutType } from "@/lib/utils/workouts";
import { CreateWorkoutDialog } from "@/components/workouts/CreateWorkoutDialog";
import { WorkoutDetailsDialog } from "@/components/workouts/WorkoutDetailsDialog";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

export default function HomePage() {
	const { user } = useAuthStore();
	const [createWorkoutOpen, setCreateWorkoutOpen] = useState(false);
	const [selectedWorkout, setSelectedWorkout] = useState(null);
	const queryClient = useQueryClient();

	// Dashboard Hooks
	const { data: adherence, isLoading: loadingAdherence } = useAdherence();
	const { data: nextWorkout, isLoading: loadingWorkout } = useNextWorkout();
	const { data: hpoints, isLoading: loadingHPoints } = useHPointsBalance();
	const { data: nextTogether, isLoading: loadingTogether } = useNextTogether();
	const { mutate: confirmTogether, isPending: confirmingTogether } = useConfirmPresence();
	const { mutate: cancelTogether, isPending: cancellingTogether } = useCancelConfirmation();
	const [cancelTogetherDialogOpen, setCancelTogetherDialogOpen] = useState(false);

	// Mutations para likes e shares
	const { mutate: toggleLike } = useToggleLike();
	const { mutate: shareWorkout } = useShareWorkout();

	// Community Feed com Infinite Scroll
	const {
		data: communityFeedData,
		isLoading: loadingCommunity,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useCommunityFeed(10);

	// Ref para observar quando chegar ao final
	const loadMoreRef = useRef(null);

	// Flatten all pages into single array
	const communityFeed = communityFeedData?.pages?.flatMap((page) => page.workouts) || [];

	// Intersection Observer para scroll infinito
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const first = entries[0];
				if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage();
				}
			},
			{ threshold: 0.1 }
		);

		const currentRef = loadMoreRef.current;
		if (currentRef) {
			observer.observe(currentRef);
		}

		return () => {
			if (currentRef) {
				observer.unobserve(currentRef);
			}
		};
	}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

	const handleRefresh = () => {
		queryClient.invalidateQueries({ queryKey: ["adherence"] });
		queryClient.invalidateQueries({ queryKey: ["nextWorkout"] });
		queryClient.invalidateQueries({ queryKey: ["hpointsBalance"] });
		queryClient.invalidateQueries({ queryKey: ["nextTogether"] });
		queryClient.invalidateQueries({ queryKey: ["communityFeed"] });
	};

	const handleLike = (workoutId, e) => {
		e.stopPropagation();
		toggleLike(workoutId);
	};

	const handleShare = (workoutId, e) => {
		e.stopPropagation();
		
		// Check if Web Share API is available
		if (navigator.share) {
			navigator.share({
				title: 'Confira meu treino!',
				text: 'Veja meu último treino no Hack Running',
				url: window.location.origin + '/app/home'
			}).then(() => {
				shareWorkout({ workoutId, platform: 'native' });
			}).catch((err) => {
				console.log('Erro ao compartilhar:', err);
			});
		} else {
			// Fallback - copy to clipboard
			navigator.clipboard.writeText(window.location.origin + '/app/home').then(() => {
				shareWorkout({ workoutId, platform: 'link' });
			});
		}
	};

	const handleComment = (workoutId, e) => {
		e.stopPropagation();
		setSelectedWorkout(communityFeed.find(w => w._id === workoutId));
	};

	const container = {
		hidden: { opacity: 0 },
		show: { opacity: 1, transition: { staggerChildren: 0.1 } },
	};

	const item = {
		hidden: { opacity: 0, y: 20 },
		show: { opacity: 1, y: 0 },
	};

	return (
		<div className="space-y-8 pb-10 max-w-7xl mx-auto">
			{/* --- Top Section: Welcome & Quick Actions --- */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
				<div className="space-y-1">
					<h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
						Olá, <span className="text-gradient-primary">{user?.name?.split(" ")[0] || "Atleta"}</span>
					</h1>
					<p className="text-zinc-400 text-lg">Vamos movimentar essa comunidade hoje?</p>
				</div>
				<div className="flex gap-3 w-full md:w-auto">
					{/* <Button
						variant="outline"
						size="icon"
						onClick={handleRefresh}
						className="rounded-full border-white/10 hover:bg-white/10 w-12 h-12"
					>
						<RefreshCw className="h-4 w-4" />
					</Button> */}
					<Button
						size="lg"
						className="bg-primary text-black font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(250,204,21,0.3)] rounded-full px-8 h-12 flex-1 md:flex-none"
						onClick={() => setCreateWorkoutOpen(true)}
					>
						<Zap className="mr-2 h-5 w-5 fill-current" />
						Registrar Treino
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
				{/* --- Left Column: Feed (Social) - Span 8 --- */}
				<div className="lg:col-span-8 space-y-8">
					{/* Widgets Cards (Mobile only - above feed) */}
					<div className="lg:hidden space-y-6">
						{/* Next Workout Widget */}
						<motion.div
							variants={item}
							className="glass-card rounded-3xl p-6 border-primary/20 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden group"
						>
							<div className="absolute top-0 right-0 p-24 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

							<div className="relative z-10">
								<div className="flex items-center gap-2 text-primary mb-4">
									<Calendar className="w-5 h-5" />
									<span className="text-xs font-bold uppercase tracking-wider">Próximo Treino</span>
								</div>

								{loadingWorkout ? (
									<Skeleton className="h-16 w-full bg-white/5" />
								) : nextWorkout ? (
									<div className="space-y-4">
										<div>
											<h3 className="text-2xl font-bold text-white mb-1">
												{formatWorkoutType(nextWorkout.type || nextWorkout.workoutType)}
											</h3>
											<div className="flex gap-3 text-sm text-zinc-400">
												<span className="flex items-center gap-1">
													<Activity className="w-3 h-3" />
													{nextWorkout.duration_min || nextWorkout.time || 0} min
												</span>
												<span>•</span>
												<span>{safeFormatDate(nextWorkout.date, "EEEE, dd MMM")}</span>
											</div>
										</div>
										<Link href={`/app/training-plan?workout=${nextWorkout._id}`} className="block">
											<Button className="w-full bg-white/5 hover:bg-white/10 text-white border-0 justify-between group-hover:pl-6 transition-all">
												Ver Detalhes <ArrowRight className="w-4 h-4" />
											</Button>
										</Link>
									</div>
								) : (
									<div className="py-4">
										<p className="text-zinc-500 text-sm mb-4">Sem treinos agendados.</p>
										<Link href="/app/training-plan">
											<Button size="sm" variant="outline" className="w-full border-white/10">
												Ver Plano
											</Button>
										</Link>
									</div>
								)}
							</div>
						</motion.div>

						{/* HPoints Widget */}
						<motion.div variants={item} className="glass-card rounded-3xl p-6 border-white/5">
							<div className="flex items-center gap-3 mb-4">
								<div className="p-2 bg-primary/10 rounded-lg text-primary">
									<Trophy className="w-5 h-5" />
								</div>
								<div>
									<span className="text-xs font-bold text-zinc-500 uppercase block">Seus Pontos</span>
									<span className="text-2xl font-bold text-white">
										{loadingHPoints ? "..." : hpoints?.balance || 0}{" "}
										<span className="text-sm text-primary">HP</span>
									</span>
								</div>
							</div>
							<Link href="/app/store" className="block">
								<Button className="w-full bg-white/5 hover:bg-white/10 text-white border-0 justify-between group-hover:pl-6 transition-all">
									Ir para a loja <ArrowRight className="w-4 h-4" />
								</Button>
							</Link>
						</motion.div>

						{/* Next Together */}
						<motion.div
							variants={item}
							className="glass-card rounded-3xl p-6 border-white/5 hover:border-blue-500/30 transition-colors group"
						>
							<div className="flex items-center justify-between mb-4">
								<span className="text-xs font-bold text-blue-500 uppercase flex items-center gap-2">
									<Users className="w-3 h-3" /> Together
								</span>
								<Link href="/app/together">
									<ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
								</Link>
							</div>
							{nextTogether ? (
								<div className="space-y-4">
									<div>
										<h4 className="font-bold text-white text-lg mb-1">
											{nextTogether.name || "Treino em Grupo"}
										</h4>
										<p className="text-sm text-zinc-400 mb-2">
											{nextTogether.date
												? safeFormatDate(nextTogether.date, "dd 'de' MMM • HH:mm")
												: "Data a definir"}
										</p>
										<div className="flex items-center gap-2 text-xs font-bold text-zinc-500 bg-white/5 px-3 py-1.5 rounded-lg w-fit">
											<Users className="w-3 h-3" />
											{nextTogether.confirmed?.length || 0} confirmados
										</div>
									</div>

									{nextTogether.confirmed?.includes(user?._id) ? (
										<Button
											className="w-full bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 h-10 font-bold cursor-pointer"
											onClick={() => setCancelTogetherDialogOpen(true)}
										>
											<Check className="w-4 h-4 mr-2" />
											Você vai!
										</Button>
									) : (
										<Button
											className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-bold"
											onClick={() =>
												confirmTogether(
													{ eventId: nextTogether._id },
													{
														onSuccess: () => {
															queryClient.invalidateQueries({ queryKey: ["nextTogether"] });
														},
													}
												)
											}
											disabled={confirmingTogether}
										>
											{confirmingTogether ? (
												<Loader2 className="w-4 h-4 animate-spin" />
											) : (
												"Confirmar Presença"
											)}
										</Button>
									)}

									<Link href={`/app/together/${nextTogether._id}`} className="block">
										<Button
											variant="outline"
											className="w-full border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white h-9 text-xs"
										>
											Ver detalhes e quem vai
										</Button>
									</Link>
								</div>
							) : (
								<p className="text-sm text-zinc-500">Nenhum evento próximo.</p>
							)}
						</motion.div>
					</div>

					<h2 className="text-2xl font-bold text-white flex items-center gap-2">
						<Users className="text-primary" />
						Feed da Equipe
						<span className="text-sm text-zinc-500 font-normal">
							(últimos 7 dias)
						</span>
					</h2>

					{loadingCommunity ? (
						Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-[400px] w-full rounded-3xl bg-white/5" />
						))
					) : communityFeed && communityFeed.length > 0 ? (
						<>
							<motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
								{communityFeed.map((activity) => {
								const isOwnActivity =
									user?._id === (activity.userId?._id || activity.userId) ||
									user?._id === activity.user?._id;
								
								const userIdStr = user?._id?.toString();
								const isLiked = activity.likes?.some(like => {
									const likeId = like?._id?.toString() || like?.toString();
									return likeId === userIdStr;
								}) || false;
								const likesCount = activity.likes?.length || 0;
								const commentsCount = activity.comments?.length || 0;

								return (
									<motion.div
										variants={item}
										key={activity._id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3 }}
									>
										<div
											className="glass-card rounded-3xl overflow-hidden border border-white/5 bg-[#0a0a0a] hover:!bg-zinc-900/80 hover:!border-white/10 hover:scale-[1.01] transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl"
											onClick={() => setSelectedWorkout(activity)}
										>
											{/* Header */}
											<div className="p-5 flex items-center justify-between">
												<div className="flex items-center gap-3">
													<Avatar className="h-10 w-10 border border-white/10 ring-2 ring-transparent transition-all">
														<AvatarImage src={activity.user?.photo} />
														<AvatarFallback className="bg-zinc-800 font-bold text-zinc-400 text-xs">
															{activity.user?.name?.[0] || user?.name?.[0] || "U"}
														</AvatarFallback>
													</Avatar>
													<div>
														<p className="font-bold text-white text-sm hover:text-primary cursor-pointer transition-colors">
															{activity.user?.name || user?.name || "Atleta"}
															{isOwnActivity && (
																<span className="text-zinc-500 text-[10px] font-normal ml-2">
																	(Você)
																</span>
															)}
														</p>
														<p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">
															{activity.date
																? safeFormatDate(activity.date, "dd 'de' MMM • HH:mm")
																: ""}
														</p>
													</div>
												</div>
												<Button
													variant="ghost"
													size="icon"
													className="text-zinc-600 hover:text-white rounded-full"
													onClick={(e) => handleShare(activity._id, e)}
												>
													<Share2 className="w-4 h-4" />
												</Button>
											</div>

											{/* Activity Media */}
											{activity.photo?.url ||
											(typeof activity.photo === "string" && activity.photo.trim() !== "") ? (
												<div className="relative w-full aspect-[4/3] bg-zinc-900 group cursor-pointer">
													<Image
														src={activity.photo?.url || activity.photo}
														alt="Treino"
														fill
														className="object-cover"
													/>
													<div className="absolute bottom-4 left-4">
														<Badge className="bg-black/60 backdrop-blur-md text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider">
															{formatWorkoutType(activity.workoutType || activity.type)}
														</Badge>
													</div>
												</div>
											) : (
												<div className="relative w-full h-32 bg-gradient-to-r from-zinc-900 to-zinc-950 flex items-center justify-center border-y border-white/5">
													<div className="flex gap-8 text-zinc-700">
														<Activity className="w-12 h-12 opacity-20" />
														<MapPin className="w-12 h-12 opacity-20" />
													</div>
												</div>
											)}

											{/* Content & Stats */}
											<div className="p-6">
												<div className="flex justify-between items-start mb-4">
													<h3 className="text-xl font-bold text-white mb-1">
														{activity.distance} km
														<span className="text-zinc-500 text-sm font-normal ml-2">
															corrida
														</span>
													</h3>
													<div className="flex items-center gap-4 text-sm font-mono text-zinc-300">
														{activity.pace && (
															<span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
																<TrendingUp className="w-3 h-3 text-primary" />
																{Math.floor(activity.pace / 60)}'
																{String(Math.round(activity.pace % 60)).padStart(
																	2,
																	"0"
																)}
																"/km
															</span>
														)}
														{activity.time && (
															<span className="text-zinc-500">
																{Math.floor(activity.time / 3600) > 0 &&
																	`${Math.floor(activity.time / 3600)}h `}
																{Math.floor((activity.time % 3600) / 60)}min
															</span>
														)}
													</div>
												</div>

												{(activity.notes || activity.description) && (
													<p className="text-zinc-400 text-sm leading-relaxed mb-6 bg-white/5 p-4 rounded-xl border border-white/5 italic">
														"{activity.notes || activity.description}"
													</p>
												)}

												{/* Interactions Bar */}
												{isOwnActivity ? (
													<div className="flex items-center gap-2 pt-4 border-t border-white/5">
														<Button
															variant="ghost"
															size="sm"
															className="flex-1 text-zinc-400 hover:text-primary hover:bg-primary/10 gap-2 rounded-xl"
															onClick={(e) => {
																e.stopPropagation();
																setSelectedWorkout(activity);
															}}
														>
															<Edit2 className="w-4 h-4" />
															<span className="text-xs font-bold">Editar</span>
														</Button>
													</div>
												) : (
													<div className="flex items-center gap-2 pt-4 border-t border-white/5">
														<Button
															variant="ghost"
															size="sm"
															className={`flex-1 gap-2 rounded-xl transition-all ${
																isLiked 
																	? 'text-red-500 bg-red-500/10' 
																	: 'text-zinc-400 hover:text-red-500 hover:bg-red-500/10'
															}`}
															onClick={(e) => handleLike(activity._id, e)}
														>
															<Heart className={`w-5 h-5 transition-all ${isLiked ? 'fill-current' : ''}`} />
															<span className="text-xs font-bold">
																{isLiked ? 'Curtido' : 'Curtir'}
																{likesCount > 0 && ` (${likesCount})`}
															</span>
														</Button>
														<Button
															variant="ghost"
															size="sm"
															className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5 gap-2 rounded-xl"
															onClick={(e) => handleComment(activity._id, e)}
														>
															<MessageSquare className="w-5 h-5" />
															<span className="text-xs font-bold">
																Comentar
																{commentsCount > 0 && ` (${commentsCount})`}
															</span>
														</Button>
													</div>
												)}
											</div>
										</div>
									</motion.div>
								);
							})}
						</motion.div>

						{/* Loading indicator para scroll infinito */}
						<div ref={loadMoreRef} className="py-8 flex justify-center">
							{isFetchingNextPage ? (
								<div className="flex items-center gap-2 text-zinc-500">
									<Loader2 className="w-5 h-5 animate-spin" />
									<span className="text-sm">Carregando mais atividades...</span>
								</div>
							) : hasNextPage ? (
								<div className="text-xs text-zinc-600">Scroll para carregar mais</div>
							) : communityFeed.length > 0 ? (
								<div className="text-sm text-zinc-600">
									Você viu todas as atividades dos últimos 7 dias
								</div>
							) : null}
						</div>
					</>
					) : (
						<div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5 border-dashed">
							<Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
							<p className="text-zinc-400">
								A comunidade está silenciosa hoje. Seja o primeiro a postar!
							</p>
							<Button variant="link" onClick={() => setCreateWorkoutOpen(true)} className="text-primary">
								Registrar atividade
							</Button>
						</div>
					)}
				</div>

				{/* --- Right Column: Widgets (Dashboard) - Span 4 --- */}
				<motion.div variants={container} initial="hidden" animate="show" className="hidden lg:block lg:col-span-4 space-y-6">
					{/* Next Workout Widget */}
					<motion.div
						variants={item}
						className="glass-card rounded-3xl p-6 border-primary/20 bg-gradient-to-b from-zinc-900 to-black relative overflow-hidden group"
					>
						<div className="absolute top-0 right-0 p-24 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

						<div className="relative z-10">
							<div className="flex items-center gap-2 text-primary mb-4">
								<Calendar className="w-5 h-5" />
								<span className="text-xs font-bold uppercase tracking-wider">Próximo Treino</span>
							</div>

							{loadingWorkout ? (
								<Skeleton className="h-16 w-full bg-white/5" />
							) : nextWorkout ? (
								<div className="space-y-4">
									<div>
										<h3 className="text-2xl font-bold text-white mb-1">
											{formatWorkoutType(nextWorkout.type || nextWorkout.workoutType)}
										</h3>
										<div className="flex gap-3 text-sm text-zinc-400">
											<span className="flex items-center gap-1">
												<Activity className="w-3 h-3" />
												{nextWorkout.duration_min || nextWorkout.time || 0} min
											</span>
											<span>•</span>
											<span>{safeFormatDate(nextWorkout.date, "EEEE, dd MMM")}</span>
										</div>
									</div>
									<Link href={`/app/training-plan?workout=${nextWorkout._id}`} className="block">
										<Button className="w-full bg-white/5 hover:bg-white/10 text-white border-0 justify-between group-hover:pl-6 transition-all">
											Ver Detalhes <ArrowRight className="w-4 h-4" />
										</Button>
									</Link>
								</div>
							) : (
								<div className="py-4">
									<p className="text-zinc-500 text-sm mb-4">Sem treinos agendados.</p>
									<Link href="/app/training-plan">
										<Button size="sm" variant="outline" className="w-full border-white/10">
											Ver Plano
										</Button>
									</Link>
								</div>
							)}
						</div>
					</motion.div>

					{/* HPoints Widget */}
					<motion.div variants={item} className="glass-card rounded-3xl p-6 border-white/5">
						<div className="flex items-center gap-3 mb-4">
							<div className="p-2 bg-primary/10 rounded-lg text-primary">
								<Trophy className="w-5 h-5" />
							</div>
							<div>
								<span className="text-xs font-bold text-zinc-500 uppercase block">Seus Pontos</span>
								<span className="text-2xl font-bold text-white">
									{loadingHPoints ? "..." : hpoints?.balance || 0}{" "}
									<span className="text-sm text-primary">HP</span>
								</span>
							</div>
						</div>
						<Link href="/app/store" className="block">
							<Button className="w-full bg-white/5 hover:bg-white/10 text-white border-0 justify-between group-hover:pl-6 transition-all">
								Ir para a loja <ArrowRight className="w-4 h-4" />
							</Button>
						</Link>
					</motion.div>

					{/* Next Together */}
					<motion.div
						variants={item}
						className="glass-card rounded-3xl p-6 border-white/5 hover:border-blue-500/30 transition-colors group"
					>
						<div className="flex items-center justify-between mb-4">
							<span className="text-xs font-bold text-blue-500 uppercase flex items-center gap-2">
								<Users className="w-3 h-3" /> Together
							</span>
							<Link href="/app/together">
								<ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-500 transition-colors" />
							</Link>
						</div>
						{nextTogether ? (
							<div className="space-y-4">
								<div>
									<h4 className="font-bold text-white text-lg mb-1">
										{nextTogether.name || "Treino em Grupo"}
									</h4>
									<p className="text-sm text-zinc-400 mb-2">
										{nextTogether.date
											? safeFormatDate(nextTogether.date, "dd 'de' MMM • HH:mm")
											: "Data a definir"}
									</p>
									<div className="flex items-center gap-2 text-xs font-bold text-zinc-500 bg-white/5 px-3 py-1.5 rounded-lg w-fit">
										<Users className="w-3 h-3" />
										{nextTogether.confirmed?.length || 0} confirmados
									</div>
								</div>

								{nextTogether.confirmed?.includes(user?._id) ? (
									<Button
										className="w-full bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 h-10 font-bold cursor-pointer"
										onClick={() => setCancelTogetherDialogOpen(true)}
									>
										<Check className="w-4 h-4 mr-2" />
										Você vai!
									</Button>
								) : (
									<Button
										className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-bold"
										onClick={() =>
											confirmTogether(
												{ eventId: nextTogether._id },
												{
													onSuccess: () => {
														queryClient.invalidateQueries({ queryKey: ["nextTogether"] });
													},
												}
											)
										}
										disabled={confirmingTogether}
									>
										{confirmingTogether ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											"Confirmar Presença"
										)}
									</Button>
								)}

								<Link href={`/app/together/${nextTogether._id}`} className="block">
									<Button
										variant="outline"
										className="w-full border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white h-9 text-xs"
									>
										Ver detalhes e quem vai
									</Button>
								</Link>
							</div>
						) : (
							<p className="text-sm text-zinc-500">Nenhum evento próximo.</p>
						)}
					</motion.div>
				</motion.div>
			</div>

			<CreateWorkoutDialog open={createWorkoutOpen} onOpenChange={setCreateWorkoutOpen} />

			<WorkoutDetailsDialog
				workout={selectedWorkout}
				open={!!selectedWorkout}
				onOpenChange={(open) => !open && setSelectedWorkout(null)}
			/>

			{/* Cancel Together Confirmation Dialog */}
			{nextTogether && (
				<Dialog open={cancelTogetherDialogOpen} onOpenChange={setCancelTogetherDialogOpen}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Cancelar Presença?</DialogTitle>
							<DialogDescription>
								Tem certeza que deseja cancelar sua presença no Together? Você pode confirmar novamente
								depois.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setCancelTogetherDialogOpen(false)}
								disabled={cancellingTogether}
							>
								Não, manter presença
							</Button>
							<Button
								variant="outline"
								className="border-red-500/20 text-red-500 hover:bg-red-500/10"
								onClick={() =>
									cancelTogether(
										{ eventId: nextTogether._id },
										{
											onSuccess: () => {
												queryClient.invalidateQueries({ queryKey: ["nextTogether"] });
												setCancelTogetherDialogOpen(false);
											},
										}
									)
								}
								disabled={cancellingTogether}
							>
								{cancellingTogether ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Cancelando...
									</>
								) : (
									"Sim, cancelar"
								)}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
