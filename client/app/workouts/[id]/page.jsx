'use client';

import { useParams, useRouter } from 'next/navigation';
import { useWorkout } from '@/hooks/useWorkouts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Zap, ArrowLeft, Share2, MessageSquare, Instagram, ExternalLink } from 'lucide-react';
import { safeFormatDate } from '@/lib/utils/date';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';

export default function WorkoutDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: workout, isLoading } = useWorkout(id);
  
  const isOwner = user?._id && workout && (
    user._id.toString() === (workout.userId?._id?.toString() || workout.userId?.toString() || workout.user?._id?.toString())
  );

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;
  if (!workout) return <div className="p-8 text-center">Treino não encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
       <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
       </Button>

       <div className="grid gap-6 md:grid-cols-3">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
              <Card className="bg-zinc-950/50 border-zinc-800 overflow-hidden">
                  <div className="relative h-64 w-full bg-zinc-900">
                      {workout.photo ? (
                          <Image 
                            src={workout.photo} 
                            alt="Foto do treino" 
                            fill 
                            className="object-cover"
                          />
                      ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                              Sem foto
                          </div>
                      )}
                      <div className="absolute top-4 right-4">
                        {workout.status === 'approved' && <Badge className="bg-green-500 text-black font-bold">Aprovado</Badge>}
                        {workout.status === 'pending' && <Badge className="bg-orange-500 text-black font-bold">Em Análise</Badge>}
                      </div>
                  </div>
                  <CardHeader>
                      <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-3xl font-bold text-white mb-2">{workout.type}</CardTitle>
                            <CardDescription className="flex items-center text-lg">
                                <Calendar className="mr-2 h-4 w-4" />
                                {workout.date ? safeFormatDate(workout.date, "EEEE, d 'de' MMMM 'de' yyyy") : 'Data não disponível'}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end">
                              <span className="text-3xl font-bold text-primary">+{workout.hpointsEarned || 0}</span>
                              <span className="text-xs text-muted-foreground">HPoints</span>
                          </div>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 py-6 border-y border-zinc-800">
                          <div className="text-center border-r border-zinc-800 last:border-0">
                              <div className="flex items-center justify-center text-muted-foreground mb-1">
                                  <MapPin className="h-4 w-4 mr-1" /> Distância
                              </div>
                              <div className="text-2xl font-bold text-white">{workout.distance} km</div>
                          </div>
                          <div className="text-center border-r border-zinc-800 last:border-0">
                              <div className="flex items-center justify-center text-muted-foreground mb-1">
                                  <Clock className="h-4 w-4 mr-1" /> Tempo
                              </div>
                              <div className="text-2xl font-bold text-white">{workout.time}</div>
                          </div>
                          <div className="text-center">
                              <div className="flex items-center justify-center text-muted-foreground mb-1">
                                  <Zap className="h-4 w-4 mr-1" /> Pace
                              </div>
                              <div className="text-2xl font-bold text-white">{workout.pace}/km</div>
                          </div>
                      </div>

                      {workout.description && (
                          <div className="space-y-2">
                              <h3 className="font-bold text-white">Relato do Runner</h3>
                              <p className="text-zinc-400 leading-relaxed">
                                  "{workout.description}"
                              </p>
                          </div>
                      )}

                      {workout.feedback && (
                          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 space-y-2">
                               <h3 className="font-bold text-white flex items-center">
                                  <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                                  Feedback do Coach
                               </h3>
                               <p className="text-zinc-400">
                                  "{workout.feedback}"
                               </p>
                          </div>
                      )}

                      {/* Instagram Story Link - Only visible to owner */}
                      {isOwner && workout.instagramStoryLink && (
                          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-3 rounded-xl">
                             <div className="bg-purple-500/20 p-2 rounded-lg text-purple-500">
                                <Instagram className="w-5 h-5" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="text-purple-500 font-bold text-sm mb-1">Story do Instagram</div>
                                <a 
                                  href={workout.instagramStoryLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 text-xs truncate block flex items-center gap-1"
                                >
                                  {workout.instagramStoryLink}
                                  <ExternalLink className="w-3 h-3 inline" />
                                </a>
                             </div>
                          </div>
                      )}
                  </CardContent>
              </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-4">
              <Card className="bg-zinc-950/50 border-zinc-800">
                  <CardHeader>
                      <CardTitle className="text-lg">Ações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          <Share2 className="mr-2 h-4 w-4" />
                          Compartilhar Resultado
                      </Button>
                      {workout.status === 'pending' && (
                          <Button variant="outline" className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-900">
                              Editar Treino
                          </Button>
                      )}
                  </CardContent>
              </Card>
              
              {/* Map Placeholder */}
              <Card className="bg-zinc-950/50 border-zinc-800 h-64 relative overflow-hidden">
                  <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mb-2 opacity-50" />
                      <span className="text-sm">Mapa do percurso (Strava)</span>
                  </div>
              </Card>
          </div>
       </div>
    </div>
  );
}
