"use client";

import { useState, useMemo, useEffect } from "react";
import { useTrainingPlan } from "@/hooks/useWorkouts";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Calendar as CalendarIcon,
	Clock,
	MapPin,
	CheckCircle,
	XCircle,
	AlertCircle,
	Play,
	ChevronRight,
	ChevronLeft,
	Dumbbell,
	List as ListIcon,
	CalendarDays,
	GripHorizontal,
	ArrowRight,
	Eye,
	Info,
} from "lucide-react";
import { safeFormatDate } from "@/lib/utils/date";
import { formatWorkoutType } from "@/lib/utils/workouts";
import {
	isPast,
	isToday,
	startOfWeek,
	endOfWeek,
	eachDayOfInterval,
	isSameDay,
	addWeeks,
	subWeeks,
	format,
	startOfMonth,
	endOfMonth,
	addMonths,
	subMonths,
	isSameMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateWorkoutDialog } from "@/components/workouts/CreateWorkoutDialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PaceDisplay, WorkoutPaceDisplay, WorkoutStepsDisplay } from "@/components/training/PaceDisplay";
import { CompleteMissingDataDialog } from "@/components/onboarding/CompleteMissingDataDialog";
import api from "@/lib/api";

export default function TrainingPlanPage() {
	const searchParams = useSearchParams();
	const { data: plan, isLoading, error } = useTrainingPlan();
	const workouts = useMemo(() => plan?.workouts || [], [plan]);
	const [createWorkoutOpen, setCreateWorkoutOpen] = useState(false);
	const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
	const [viewMode, setViewMode] = useState("week"); // 'week', 'month'
	const [currentDate, setCurrentDate] = useState(new Date());
	const [missingDataDialogOpen, setMissingDataDialogOpen] = useState(false);

	// State for the selected day detailed view (dialog or expanded section)
	const [viewDayDetails, setViewDayDetails] = useState(null);

	// Abrir dialog automaticamente se vier workoutId na URL
	useEffect(() => {
		const workoutId = searchParams.get('workout');
		if (workoutId && workouts.length > 0) {
			const workout = workouts.find(w => w._id === workoutId);
			if (workout) {
				setViewDayDetails(new Date(workout.date));
			}
		}
	}, [searchParams, workouts]);

	// Verificar dados faltantes quando não tiver planilha (sempre executar quando não tem planilha)
	// Executar mesmo se houver erro (404 não é erro real, apenas não tem planilha)
	const shouldCheckMissingData = (!plan && !isLoading) || (error?.response?.status === 404);
	const { data: missingData, isLoading: isLoadingMissingData, error: missingDataError } = useQuery({
		queryKey: ['trainingPlan', 'missingData'],
		queryFn: async () => {
			try {
				const response = await api.get('/training-plans/check-missing-data');
				return response.data?.data || null;
			} catch (error) {
				console.error('Erro ao verificar dados faltantes:', error);
				// Retornar objeto vazio para não quebrar a lógica
				return { hasAllData: false, missingFields: [], currentData: {} };
			}
		},
		enabled: Boolean(shouldCheckMissingData), // Sempre verificar quando não tem planilha
		retry: false,
		staleTime: 30000 // Cache por 30 segundos
	});

	const getStatus = (workout) => {
		if (workout.completed)
			return {
				label: "Concluído",
				color: "bg-green-500/10 text-green-500 border-green-500/20",
				icon: CheckCircle,
			};
		const workoutDate = new Date(workout.date);
		const isMissed = isPast(workoutDate) && !isToday(workoutDate) && !workout.completed;
		if (isMissed) return { label: "Perdido", color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle };
		if (isToday(workoutDate))
			return { label: "Hoje", color: "bg-primary/10 text-primary border-primary/20", icon: Play };
		if (isPast(workoutDate))
			return {
				label: "Pendente",
				color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
				icon: AlertCircle,
			};
		return { label: "Futuro", color: "bg-white/5 text-zinc-400 border-white/5", icon: CalendarIcon };
	};

	const formatTime = (seconds) => {
		if (!seconds) return "N/A";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) return `${hours}h${minutes}min`;
		return `${minutes}min`;
	};

	// Calendar Logic
	const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
	const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
	const monthStart = startOfMonth(currentDate);
	const monthEnd = endOfMonth(currentDate);
	const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
	const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

	const displayDays =
		viewMode === "week"
			? eachDayOfInterval({ start: weekStart, end: weekEnd })
			: eachDayOfInterval({ start: calendarStart, end: calendarEnd });

	const getWorkoutsForDay = (day) => {
		return workouts.filter((w) => isSameDay(new Date(w.date), day));
	};

	const navigateDate = (direction) => {
		if (viewMode === "week") {
			setCurrentDate((prev) => (direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)));
		} else {
			setCurrentDate((prev) => (direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)));
		}
	};

	const container = {
		hidden: { opacity: 0 },
		show: { opacity: 1, transition: { staggerChildren: 0.05 } },
	};

	const item = {
		hidden: { opacity: 0, y: 10 },
		show: { opacity: 1, y: 0 },
	};

	if (isLoading) {
		return <div className="p-8 text-center text-zinc-400 animate-pulse">Carregando plano de treino...</div>;
	}

	// Se não tem planilha, verificar dados faltantes
	if (!plan) {
		// Se ainda está carregando os dados faltantes, mostrar loading mas com botão
		const hasMissingData = missingData && !missingData.hasAllData;
		const hasAllData = missingData && missingData.hasAllData;
		const hasAnyMissingFields = missingData && missingData.missingFields && missingData.missingFields.length > 0;
		
		// Se está carregando, mostrar loading mas permitir clicar no botão mesmo assim
		if (isLoadingMissingData && shouldCheckMissingData) {
			return (
				<div className="space-y-8 pb-10">
					<div className="flex justify-between items-end">
						<div>
							<h1 className="text-4xl font-bold tracking-tighter text-white">Minha Planilha</h1>
							<p className="text-zinc-400 mt-2">Verificando seus dados...</p>
						</div>
					</div>
					<div className="glass-card rounded-3xl p-12 text-center border-primary/20 flex flex-col items-center">
						<div className="animate-pulse mb-6">
							<AlertCircle className="w-16 h-16 text-primary" />
						</div>
						<h3 className="text-xl font-bold text-white mb-2">Aguarde...</h3>
						<p className="text-zinc-400 max-w-md mx-auto mb-6">
							Estamos verificando seus dados para gerar sua planilha personalizada.
						</p>
					</div>
				</div>
			);
		}
		
		return (
			<div className="space-y-8 pb-10">
				<div className="flex justify-between items-end">
					<div>
						<h1 className="text-4xl font-bold tracking-tighter text-white">Minha Planilha</h1>
						<p className="text-zinc-400 mt-2">
							{hasMissingData ? 'Complete seus dados para gerar sua planilha' : hasAllData ? 'Gere sua planilha agora' : 'Nenhuma planilha ativa.'}
						</p>
					</div>
				</div>
				
				{hasMissingData ? (
					<div className="glass-card rounded-3xl p-12 text-center border-primary/20 flex flex-col items-center">
						<AlertCircle className="w-16 h-16 text-primary mb-6" />
						<h3 className="text-xl font-bold text-white mb-2">Complete seus dados</h3>
						<p className="text-zinc-400 max-w-md mx-auto mb-6">
							Para gerarmos sua planilha personalizada, precisamos de algumas informações adicionais. 
							Clique no botão abaixo para completar seus dados.
						</p>
						<Button
							onClick={() => setMissingDataDialogOpen(true)}
							className="bg-primary text-black font-bold h-12 px-8"
						>
							Completar Dados e Gerar Planilha
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</div>
				) : hasAllData ? (
					<div className="glass-card rounded-3xl p-12 text-center border-primary/20 flex flex-col items-center">
						<AlertCircle className="w-16 h-16 text-primary mb-6" />
						<h3 className="text-xl font-bold text-white mb-2">Dados completos!</h3>
						<p className="text-zinc-400 max-w-md mx-auto mb-6">
							Você já preencheu todos os dados necessários. Clique no botão abaixo para gerar sua planilha agora.
						</p>
						<Button
							onClick={() => setMissingDataDialogOpen(true)}
							className="bg-primary text-black font-bold h-12 px-8"
						>
							Gerar Minha Planilha
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</div>
				) : (
					<div className="glass-card rounded-3xl p-12 text-center border-dashed border-white/10 flex flex-col items-center">
						<Dumbbell className="w-16 h-16 text-zinc-600 mb-6" />
						<h3 className="text-xl font-bold text-white mb-2">Sem treinos por enquanto</h3>
						<p className="text-zinc-400 max-w-md mx-auto mb-6">
							Você ainda não possui uma planilha de treino ativa. 
							{hasAnyMissingFields ? ' Complete seus dados para gerar sua planilha personalizada.' : ' Complete seus dados ou converse com seu treinador para criar seu plano.'}
						</p>
						<Button
							onClick={() => setMissingDataDialogOpen(true)}
							className="bg-primary text-black font-bold h-12 px-8"
						>
							{hasAnyMissingFields ? 'Completar Dados e Gerar Planilha' : 'Verificar Dados e Gerar Planilha'}
							<ArrowRight className="ml-2 h-5 w-5" />
						</Button>
					</div>
				)}

				<CompleteMissingDataDialog
					open={missingDataDialogOpen}
					onOpenChange={setMissingDataDialogOpen}
					missingData={missingData}
				/>
			</div>
		);
	}

	// Se há erro mas não é 404, mostrar erro
	if (error) {
		return (
			<div className="space-y-8 pb-10">
				<div className="flex justify-between items-end">
					<div>
						<h1 className="text-4xl font-bold tracking-tighter text-white">Minha Planilha</h1>
						<p className="text-zinc-400 mt-2">Erro ao carregar planilha</p>
					</div>
				</div>
				<div className="glass-card rounded-3xl p-12 text-center border-dashed border-white/10 flex flex-col items-center">
					<AlertCircle className="w-16 h-16 text-red-500 mb-6" />
					<h3 className="text-xl font-bold text-white mb-2">Erro ao carregar</h3>
					<p className="text-zinc-400 max-w-md mx-auto">
						Ocorreu um erro ao carregar sua planilha. Tente novamente mais tarde.
					</p>
				</div>
			</div>
		);
	}

	// Workouts for list view: show all workouts for the current view period
	const visibleWorkouts = workouts
		.filter((w) => {
			const d = new Date(w.date);
			if (viewMode === "week") return d >= weekStart && d <= weekEnd;
			return d >= monthStart && d <= monthEnd;
		})
		.sort((a, b) => new Date(a.date) - new Date(b.date));

	const DayDetailsDialog = () => {
		if (!viewDayDetails) return null;
		const dayWorkouts = getWorkoutsForDay(viewDayDetails);

		return (
			<Dialog open={!!viewDayDetails} onOpenChange={() => setViewDayDetails(null)}>
				<DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold flex items-center gap-2">
							<CalendarIcon className="w-5 h-5 text-primary" />
							{format(viewDayDetails, "EEEE, d 'de' MMMM", { locale: ptBR })}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 mt-4">
						{dayWorkouts.length === 0 ? (
							<div className="text-center py-8 text-zinc-500">Nenhum treino agendado para este dia.</div>
						) : (
							dayWorkouts.map((workout) => {
								const status = getStatus(workout);
								const isWorkoutToday = isToday(new Date(workout.date));

								return (
									<div key={workout._id} className="bg-white/5 rounded-xl p-4 border border-white/5">
										<div className="flex justify-between items-start mb-3">
											<div>
												<h3 className="text-lg font-bold text-white mb-1">
													{formatWorkoutType(workout.type || workout.workoutType)}
												</h3>
												<Badge
													variant="outline"
													className={`${status.color} border-0 px-2 py-0.5 text-[10px] font-bold uppercase`}
												>
													{status.label}
												</Badge>
											</div>
										</div>

										{workout.description && (
											<p className="text-zinc-400 text-sm mb-4 leading-relaxed">
												{workout.description}
											</p>
										)}

										{workout.objective && (
											<div className="mb-4">
												<Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
													{workout.objective}
												</Badge>
											</div>
										)}

										{workout.steps && workout.steps.length > 0 && (
											<div className="mb-4">
												<WorkoutStepsDisplay workout={workout} />
											</div>
										)}

										<div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500 mb-4">
											{workout.distance > 0 && (
												<span className="flex items-center bg-zinc-900/50 px-2 py-1 rounded-md">
													<MapPin className="h-3.5 w-3.5 mr-1.5 text-primary" />
													{workout.distance}km
												</span>
											)}
											{(workout.time || workout.estimatedTime || workout.duration_min) && (
												<span className="flex items-center bg-zinc-900/50 px-2 py-1 rounded-md">
													<Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
													{workout.duration_min ? `${workout.duration_min} min` : formatTime(workout.time || workout.estimatedTime)}
												</span>
											)}
											{workout.pace_range && (
												<WorkoutPaceDisplay workout={workout} />
											)}
										</div>

										{!workout.completed &&
											(isToday(new Date(workout.date)) || isPast(new Date(workout.date))) && (
												<Button
													className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
													onClick={() => {
														setSelectedWorkoutId(workout._id);
														setCreateWorkoutOpen(true);
														setViewDayDetails(null);
													}}
												>
													<Play className="w-4 h-4 mr-2 fill-current" />
													Registrar Resultado
												</Button>
											)}
									</div>
								);
							})
						)}
					</div>
				</DialogContent>
			</Dialog>
		);
	};

	return (
		<div className="space-y-8 pb-10">
			{/* Header */}
			<div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
				<div>
					<div className="flex items-center gap-2 mb-3">
						<Badge
							variant="outline"
							className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px] font-bold"
						>
							{plan.level === "beginner" || plan.level?.startsWith("iniciante")
								? "Iniciante"
								: plan.level === "intermediate" || plan.level === "intermediario"
								? "Intermediário"
								: "Avançado"}
						</Badge>
						<Badge
							variant="outline"
							className="bg-white/5 text-zinc-400 border-white/10 uppercase tracking-widest text-[10px] font-bold"
						>
							{plan.objective === "performance"
								? "Performance"
								: plan.objective === "weight_loss" || plan.objective === "emagrecimento"
								? "Emagrecimento"
								: plan.objective === "health" || plan.objective === "saude_longevidade"
								? "Saúde"
								: "Geral"}
						</Badge>
					</div>
					<h1 className="text-4xl font-bold tracking-tighter text-white">Minha Planilha</h1>
				</div>

				{/* Controls */}
				<div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
					<div className="bg-zinc-900/50 p-1 rounded-lg border border-white/5 flex items-center self-start">
						<ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v)}>
							<ToggleGroupItem
								value="week"
								aria-label="Semana"
								className="data-[state=on]:bg-white/10 data-[state=on]:text-white text-zinc-400 hover:text-white transition-colors"
							>
								<CalendarDays className="h-4 w-4 mr-2" />
								Semana
							</ToggleGroupItem>
							<ToggleGroupItem
								value="month"
								aria-label="Mês"
								className="data-[state=on]:bg-white/10 data-[state=on]:text-white text-zinc-400 hover:text-white transition-colors"
							>
								<GripHorizontal className="h-4 w-4 mr-2" />
								Mês
							</ToggleGroupItem>
						</ToggleGroup>
					</div>

					<div className="flex items-center bg-zinc-900/50 rounded-lg p-1 border border-white/5 flex-1 sm:flex-none justify-between sm:justify-start">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigateDate("prev")}
							className="hover:bg-white/10 text-zinc-400 hover:text-white rounded-md"
						>
							<ChevronLeft className="w-5 h-5" />
						</Button>
						<div className="px-4 text-sm font-bold text-white min-w-[140px] text-center uppercase tracking-wide">
							{viewMode === "week"
								? `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(weekEnd, "d MMM", {
										locale: ptBR,
								  })}`
								: format(currentDate, "MMMM yyyy", { locale: ptBR })}
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => navigateDate("next")}
							className="hover:bg-white/10 text-zinc-400 hover:text-white rounded-md"
						>
							<ChevronRight className="w-5 h-5" />
						</Button>
					</div>
				</div>
			</div>

			{/* Exibir ritmos calculados se disponíveis */}
			{plan.paces && Object.keys(plan.paces).length > 0 && (
				<PaceDisplay paces={plan.paces} />
			)}

			{/* Calendar Grid */}
			<div className="glass-card rounded-3xl p-4 sm:p-6 border-white/5 overflow-hidden">
				{/* Days Header */}
				<div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
					{["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
						<div key={day} className="text-center text-[10px] sm:text-xs font-bold uppercase text-zinc-500 py-2">
							{day}
						</div>
					))}
				</div>

				<div
					className={cn(
						"grid gap-1 sm:gap-2 transition-all",
						viewMode === "month" ? "grid-cols-7 auto-rows-[70px] sm:auto-rows-[100px]" : "grid-cols-7"
					)}
				>
					{displayDays.map((day, i) => {
						const dayWorkouts = getWorkoutsForDay(day);
						const hasWorkout = dayWorkouts.length > 0;
						const isDayToday = isToday(day);
						const isCurrentMonth = isSameMonth(day, currentDate);

						// Styles based on view mode
						const containerClass =
							viewMode === "month"
								? cn(
										"flex flex-col p-1 sm:p-2 rounded-lg sm:rounded-xl border transition-all relative overflow-hidden group cursor-pointer hover:border-primary/50",
										!isCurrentMonth && "opacity-30 bg-zinc-950/30 border-transparent",
										isDayToday
											? "bg-primary/5 border-primary/30"
											: "bg-white/5 border-white/5 hover:bg-white/10"
								  )
								: cn(
										"flex flex-col items-center p-1 sm:p-3 rounded-xl sm:rounded-2xl border transition-all relative overflow-hidden group min-h-[90px] sm:min-h-[120px] cursor-pointer hover:border-primary/50",
										isDayToday
											? "bg-primary/20 border-primary/30"
											: "bg-white/5 border-white/5 hover:bg-white/10"
								  );

						return (
							<div key={i} className={containerClass} onClick={() => setViewDayDetails(day)}>
								<div
									className={cn(
										"flex items-center justify-between w-full mb-1 sm:mb-2",
										viewMode === "week" && "flex-col gap-0.5 sm:gap-1"
									)}
								>
									<span
										className={cn("text-xs sm:text-sm font-bold", isDayToday ? "text-primary" : "text-white")}
									>
										{format(day, "d")}
									</span>
									{hasWorkout && viewMode === "month" && (
										<div className="hidden sm:block h-1.5 w-1.5 rounded-full bg-primary" />
									)}
								</div>

								{hasWorkout ? (
									<>
										{/* Desktop/Tablet View - Full Details */}
										<div
											className={cn(
												"hidden sm:flex flex-col gap-1 w-full mt-auto",
												viewMode === "month" && "overflow-y-auto custom-scrollbar"
											)}
										>
											{dayWorkouts.map((w, idx) => {
												const status = getStatus(w);
												return (
													<div
														key={idx}
														className={cn(
															"w-full text-[10px] font-bold py-1 px-2 rounded-md truncate text-center transition-transform hover:scale-105",
															w.completed
																? "bg-green-500/20 text-green-500"
																: isPast(new Date(w.date)) && !isToday(new Date(w.date))
																? "bg-red-500/20 text-red-500"
																: isDayToday
																? "bg-primary text-black"
																: "bg-blue-500/20 text-blue-400"
														)}
													>
														{formatWorkoutType(w.type || w.workoutType)}
													</div>
												);
											})}
										</div>

										{/* Mobile View - Dots Indicator */}
										<div className={cn(
											"flex sm:hidden flex-wrap justify-center gap-1 w-full mt-auto",
											viewMode === "month" ? "content-end" : "items-center"
										)}>
											{dayWorkouts.map((w, idx) => {
												let dotClass = "bg-blue-400";
												if (w.completed) dotClass = "bg-green-500";
												else if (isPast(new Date(w.date)) && !isToday(new Date(w.date))) dotClass = "bg-red-500";
												else if (isDayToday) dotClass = "bg-primary";

												return (
													<div 
														key={idx} 
														className={cn("h-1.5 w-1.5 rounded-full", dotClass)} 
													/>
												);
											})}
										</div>
									</>
								) : (
									viewMode === "week" && <div className="mt-auto h-1 w-8 rounded-full bg-white/5" />
								)}

								{/* Hover Overlay Text for Interaction */}
								<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
									<Eye className="w-6 h-6 text-white" />
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Detailed List */}
			<div className="space-y-4">
				<h2 className="text-xl font-bold text-white flex items-center gap-2">
					<ListIcon className="text-primary w-5 h-5" />
					Visão Geral do Período
				</h2>

				{visibleWorkouts.length === 0 ? (
					<div className="text-center py-12">
						<p className="text-zinc-500">Nenhum treino encontrado para este período.</p>
					</div>
				) : (
					<motion.div
						key={`${viewMode}-${currentDate.toISOString()}`} // Force re-render animation on view change
						variants={container}
						initial="hidden"
						animate="show"
						className="grid gap-4 md:grid-cols-2 lg:grid-cols-1"
					>
						{visibleWorkouts.map((workout) => {
							const status = getStatus(workout);
							const isWorkoutToday = isToday(new Date(workout.date));

							return (
								<motion.div variants={item} key={workout._id}>
									<div
										className={cn(
											"glass-card rounded-3xl p-6 transition-all duration-300 border group hover:border-primary/30 cursor-pointer",
											isWorkoutToday
												? "bg-zinc-900/80 border-primary/40 shadow-[0_0_30px_rgba(238,255,0,0.05)]"
												: "border-white/5"
										)}
										onClick={() => setViewDayDetails(new Date(workout.date))}
									>
										<div className="flex flex-col md:flex-row items-start md:items-center gap-6">
											{/* Date */}
											<div
												className={cn(
													"flex flex-col items-center justify-center rounded-2xl p-4 min-w-[80px] border backdrop-blur-md",
													isWorkoutToday
														? "bg-primary text-black border-primary"
														: "bg-white/5 border-white/5 text-zinc-400"
												)}
											>
												<span className="text-2xl font-bold tracking-tighter">
													{safeFormatDate(workout.date, "dd")}
												</span>
												<span className="text-[10px] uppercase font-bold tracking-wider">
													{safeFormatDate(workout.date, "MMM")}
												</span>
											</div>

											{/* Info */}
											<div className="flex-1 min-w-0">
												<div className="flex flex-wrap items-center gap-3 mb-2">
													<h3
														className={cn(
															"font-bold text-xl truncate",
															isWorkoutToday ? "text-white" : "text-zinc-200"
														)}
													>
														{formatWorkoutType(workout.type || workout.workoutType)}
													</h3>
													<Badge
														variant="outline"
														className={`${status.color} border-0 px-2 py-0.5 text-[10px] font-bold uppercase`}
													>
														{status.label}
													</Badge>
												</div>
												{workout.description && (
													<p className="text-zinc-400 text-sm mb-3 line-clamp-2 leading-relaxed">
														{workout.description}
													</p>
												)}
												{workout.objective && (
													<div className="mb-3">
														<Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
															{workout.objective}
														</Badge>
													</div>
												)}
												<div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500">
													{workout.distance > 0 && (
														<span className="flex items-center bg-white/5 px-2 py-1 rounded-md">
															<MapPin className="h-3.5 w-3.5 mr-1.5 text-primary" />
															{workout.distance}km
														</span>
													)}
													{(workout.time || workout.estimatedTime || workout.duration_min) && (
														<span className="flex items-center bg-white/5 px-2 py-1 rounded-md">
															<Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
															{workout.duration_min ? `${workout.duration_min} min` : formatTime(workout.time || workout.estimatedTime)}
														</span>
													)}
													{workout.pace_range && (
														<WorkoutPaceDisplay workout={workout} />
													)}
												</div>
											</div>

											{/* Action */}
											<div className="w-full md:w-auto flex justify-end mt-4 md:mt-0">
												<Button
													variant="ghost"
													size="sm"
													className="text-zinc-400 hover:text-white"
												>
													Ver detalhes
													<ChevronRight className="w-4 h-4 ml-1" />
												</Button>
											</div>
										</div>
									</div>
								</motion.div>
							);
						})}
					</motion.div>
				)}
			</div>

			<CreateWorkoutDialog
				open={createWorkoutOpen}
				onOpenChange={(open) => {
					setCreateWorkoutOpen(open);
					if (!open) setSelectedWorkoutId(null);
				}}
				planId={plan?._id}
				workoutId={selectedWorkoutId}
			/>

			<DayDetailsDialog />

			{/* Dialog para completar dados faltantes */}
			<CompleteMissingDataDialog
				open={missingDataDialogOpen}
				onOpenChange={setMissingDataDialogOpen}
				missingData={missingData}
			/>
		</div>
	);
}
