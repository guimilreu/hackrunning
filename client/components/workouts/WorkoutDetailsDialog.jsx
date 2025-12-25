import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, MapPin, Activity, Trophy, Edit2, Save, X, Share2, Heart, MessageSquare, Send, Trash2, Instagram, ExternalLink } from 'lucide-react';
import { formatWorkoutType } from '@/lib/utils/workouts';
import { safeFormatDate } from '@/lib/utils/date';
import { useUpdateWorkout, useToggleLike, useAddComment, useDeleteComment, useShareWorkout } from '@/hooks/useWorkouts';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';

export function WorkoutDetailsDialog({ workout, open, onOpenChange, defaultUser }) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [formData, setFormData] = useState({
    distance: '',
    time: '',
    notes: '',
  });

  const { mutate: updateWorkout, isPending } = useUpdateWorkout();
  const { mutate: toggleLike, isPending: likePending } = useToggleLike();
  const { mutate: addComment, isPending: commentPending } = useAddComment();
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: shareWorkout } = useShareWorkout();

  // Buscar workout atualizado quando o dialog abrir
  const { data: workoutData } = useQuery({
    queryKey: ['workout', workout?._id],
    queryFn: async () => {
      if (!workout?._id) return null;
      const response = await api.get(`/workouts/${workout._id}`);
      return response.data?.data?.workout;
    },
    enabled: !!workout?._id && open,
    refetchOnWindowFocus: false,
  });

  // Usar workout atualizado ou o prop
  const currentWorkout = workoutData || workout;

  useEffect(() => {
    if (currentWorkout) {
      setFormData({
        distance: currentWorkout.distance || '',
        time: currentWorkout.time || '',
        notes: currentWorkout.notes || '',
      });
      setIsEditing(false);
      setCommentText('');
    }
  }, [currentWorkout, open]);

  if (!currentWorkout) return null;

  const isOwner = user?._id === (currentWorkout.userId?._id || currentWorkout.userId) || user?._id === (currentWorkout.user?._id || currentWorkout.user);
  const userIdStr = user?._id?.toString();
  const isLiked = currentWorkout.likes?.some(like => {
    const likeId = like?._id?.toString() || like?.toString();
    return likeId === userIdStr;
  }) || false;
  const likesCount = currentWorkout.likes?.length || 0;
  const comments = currentWorkout.comments || [];

  const handleSave = () => {
    updateWorkout({
      id: currentWorkout._id,
      data: {
        distance: parseFloat(formData.distance),
        time: parseFloat(formData.time),
        notes: formData.notes,
      }
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleLike = () => {
    if (!likePending && !isOwner) {
      toggleLike(currentWorkout._id);
    }
  };

  const handleAddComment = () => {
    if (commentText.trim() && !commentPending) {
      addComment({
        workoutId: currentWorkout._id,
        text: commentText
      }, {
        onSuccess: () => {
          setCommentText('');
        }
      });
    }
  };

  const handleDeleteComment = (commentId) => {
    // Garantir que o ID seja uma string
    const commentIdStr = commentId?.toString() || commentId;
    deleteComment({
      workoutId: currentWorkout._id,
      commentId: commentIdStr
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Confira este treino!',
        text: `Treino de ${currentWorkout.distance}km no Hack Running`,
        url: window.location.origin + '/home'
      }).then(() => {
        shareWorkout({ workoutId: currentWorkout._id, platform: 'native' });
      }).catch((err) => {
        console.log('Erro ao compartilhar:', err);
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + '/home').then(() => {
        shareWorkout({ workoutId: currentWorkout._id, platform: 'link' });
        toast.success('Link copiado para área de transferência!');
      });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
  };

  const formatPace = (secondsPerKm) => {
    if (!secondsPerKm) return '0:00/km';
    const m = Math.floor(secondsPerKm / 60);
    const s = Math.round(secondsPerKm % 60);
    return `${m}'${s < 10 ? '0' : ''}${s}"/km`;
  };

  // Recalculate pace for preview if editing
  const currentPace = isEditing && formData.distance > 0 && formData.time > 0
    ? formData.time / formData.distance
    : currentWorkout.pace;

  const displayUser = currentWorkout.user || defaultUser || (isOwner ? user : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-white/10 p-0 gap-0 max-h-[90vh] overflow-y-auto">
        
        {/* Header Image / Map Placeholder */}
        <div className="relative h-48 sm:h-64 bg-zinc-900 w-full">
          {currentWorkout.photo?.url || (typeof currentWorkout.photo === 'string' && currentWorkout.photo) ? (
            <img 
              src={currentWorkout.photo.url || currentWorkout.photo} 
              alt="Treino" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <div className="text-center opacity-20">
                <Activity className="w-16 h-16 mx-auto mb-2" />
                <span className="text-sm font-bold uppercase tracking-widest">Sem Foto</span>
              </div>
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <Badge className="bg-black/60 backdrop-blur-md text-white border-0 px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-black/70">
              {formatWorkoutType(currentWorkout.workoutType || currentWorkout.type)}
            </Badge>
          </div>

          <DialogHeader className="absolute top-4 right-4 z-10">
             <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full bg-black/40 hover:bg-black/60 text-white border-0 w-8 h-8">
                <X className="w-4 h-4" />
             </Button>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* User Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-zinc-800">
                <AvatarImage src={displayUser?.photo} />
                <AvatarFallback className="bg-zinc-800 font-bold text-zinc-400">
                  {displayUser?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                {isOwner ? (
                  <h3 className="font-bold text-white text-lg leading-none mb-1">
                    {displayUser?.name || user?.name || 'Runner'}
                    <span className="text-zinc-500 text-xs font-normal ml-2">(Você)</span>
                  </h3>
                ) : (
                  <Link 
                    href={`/runner/${currentWorkout.userId?._id || currentWorkout.userId || currentWorkout.user?._id}`}
                    className="font-bold text-white text-lg leading-none mb-1 hover:text-primary transition-colors block"
                  >
                    {displayUser?.name || 'Runner'}
                  </Link>
                )}
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wide">
                  <Calendar className="w-3 h-3" />
                  {safeFormatDate(currentWorkout.date, "dd 'de' MMMM 'às' HH:mm")}
                </div>
              </div>
            </div>

            {isOwner && !isEditing && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white"
              >
                <Edit2 className="w-3 h-3 mr-2" />
                Editar
              </Button>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 bg-white/5 rounded-2xl p-4 border border-white/5">
            <div className="text-center border-r border-white/5 last:border-0">
              <div className="text-xs text-zinc-500 font-bold uppercase mb-1">Distância</div>
              {isEditing ? (
                 <div className="flex items-baseline justify-center gap-1">
                   <Input 
                      type="number" 
                      value={formData.distance} 
                      onChange={(e) => setFormData({...formData, distance: e.target.value})}
                      className="h-8 w-20 text-center bg-black/20 border-white/10 p-1"
                   />
                   <span className="text-xs text-zinc-500">km</span>
                 </div>
              ) : (
                <div className="text-2xl font-bold text-white tracking-tight">
                  {currentWorkout.distance} <span className="text-sm text-zinc-500 font-normal">km</span>
                </div>
              )}
            </div>
            
            <div className="text-center border-r border-white/5 last:border-0">
               <div className="text-xs text-zinc-500 font-bold uppercase mb-1">Tempo</div>
               {isEditing ? (
                 <div className="flex items-baseline justify-center gap-1">
                   <Input 
                      type="number" 
                      value={formData.time} 
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="h-8 w-20 text-center bg-black/20 border-white/10 p-1"
                   />
                   <span className="text-xs text-zinc-500">s</span>
                 </div>
              ) : (
                <div className="text-2xl font-bold text-white tracking-tight">
                  {formatDuration(currentWorkout.time)}
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-xs text-zinc-500 font-bold uppercase mb-1">Pace Médio</div>
              <div className="text-2xl font-bold text-white tracking-tight">
                {formatPace(currentPace)}
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs font-bold uppercase">Notas do Treino</Label>
            {isEditing ? (
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-black/20 border-white/10 text-white min-h-[100px]"
                placeholder="Como foi o treino?"
              />
            ) : (
              <div className="text-zinc-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5 min-h-[80px]">
                {currentWorkout.notes || currentWorkout.description || <span className="text-zinc-600 italic">Sem notas.</span>}
              </div>
            )}
          </div>

          {/* HPoints Awarded */}
          {currentWorkout.hpoints?.points > 0 && (
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl">
               <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500">
                  <Trophy className="w-5 h-5" />
               </div>
               <div>
                  <div className="text-yellow-500 font-bold">+{currentWorkout.hpoints.points} HPoints</div>
                  <div className="text-xs text-yellow-500/70">Conquistados neste treino</div>
               </div>
            </div>
          )}

          {/* Instagram Story Link - Only visible to owner */}
          {isOwner && currentWorkout.instagramStoryLink && (
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-3 rounded-xl">
               <div className="bg-purple-500/20 p-2 rounded-lg text-purple-500">
                  <Instagram className="w-5 h-5" />
               </div>
               <div className="flex-1 min-w-0">
                  <div className="text-purple-500 font-bold text-sm mb-1">Story do Instagram</div>
                  <a 
                    href={currentWorkout.instagramStoryLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-xs truncate block flex items-center gap-1"
                  >
                    {currentWorkout.instagramStoryLink}
                    <ExternalLink className="w-3 h-3 inline" />
                  </a>
               </div>
            </div>
          )}

          {/* Actions Footer */}
          <div className="space-y-4 pt-2">
             {isEditing ? (
               <div className="flex w-full gap-3">
                 <Button variant="outline" className="flex-1 border-white/10 text-zinc-400" onClick={() => setIsEditing(false)}>
                   Cancelar
                 </Button>
                 <Button className="flex-1 bg-primary text-black font-bold hover:bg-primary/90" onClick={handleSave} disabled={isPending}>
                   {isPending ? 'Salvando...' : 'Salvar Alterações'}
                 </Button>
               </div>
             ) : (
               <>
                 <div className="flex w-full gap-2">
                    {!isOwner && (
                      <Button 
                        variant="ghost" 
                        className={`flex-1 gap-2 transition-all ${
                          isLiked 
                            ? 'text-red-500 bg-red-500/10' 
                            : 'text-zinc-400 hover:text-red-500 hover:bg-red-500/10'
                        }`}
                        onClick={handleLike}
                        disabled={likePending}
                      >
                        <Heart className={`w-5 h-5 transition-all ${isLiked ? 'fill-current' : ''}`} />
                        {isLiked ? 'Curtido' : 'Curtir'}
                        {likesCount > 0 && ` (${likesCount})`}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      className={`${isOwner ? 'flex-1' : 'flex-1'} text-zinc-400 hover:text-white hover:bg-white/5 gap-2`}
                      onClick={handleShare}
                    >
                      <Share2 className="w-5 h-5" />
                      Compartilhar
                    </Button>
                 </div>

                 {/* Comments Section */}
                 <Separator className="bg-white/10" />
                 
                 <div className="space-y-4">
                   <h4 className="text-sm font-bold text-white flex items-center gap-2">
                     <MessageSquare className="w-4 h-4" />
                     Comentários ({comments.length})
                   </h4>

                   {/* Comments List */}
                   <ScrollArea className="max-h-[200px] pr-4">
                     <div className="space-y-3">
                       {comments.length === 0 ? (
                         <p className="text-xs text-zinc-500 italic text-center py-4">
                           Nenhum comentário ainda. Seja o primeiro!
                         </p>
                       ) : (
                         comments.map((comment) => {
                           const commentUserId = comment.userId?._id?.toString() || comment.userId?.toString();
                           const currentUserId = user?._id?.toString();
                           const isCommentAuthor = commentUserId === currentUserId;
                           return (
                             <div key={comment._id} className="flex gap-3 bg-white/5 rounded-lg p-3">
                               <Avatar className="h-8 w-8 border border-white/10">
                                 <AvatarImage src={comment.userId?.photo} />
                                 <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                                   {comment.userId?.name?.[0] || 'U'}
                                 </AvatarFallback>
                               </Avatar>
                               <div className="flex-1 min-w-0">
                                 <div className="flex items-center justify-between gap-2">
                                   {isCommentAuthor ? (
                                     <p className="text-xs font-bold text-white">
                                       {comment.userId?.name || 'Usuário'}
                                     </p>
                                   ) : (
                                     <Link 
                                       href={`/runner/${comment.userId?._id || comment.userId}`}
                                       className="text-xs font-bold text-white hover:text-primary transition-colors"
                                     >
                                       {comment.userId?.name || 'Usuário'}
                                     </Link>
                                   )}
                                   <div className="flex items-center gap-2">
                                     <span className="text-[10px] text-zinc-500">
                                       {safeFormatDate(comment.createdAt, "dd/MM 'às' HH:mm")}
                                     </span>
                                     {isCommentAuthor && (
                                       <Button
                                         variant="ghost"
                                         size="icon"
                                         className="h-6 w-6 text-zinc-500 hover:text-red-500"
                                         onClick={() => handleDeleteComment(comment._id)}
                                       >
                                         <Trash2 className="w-3 h-3" />
                                       </Button>
                                     )}
                                   </div>
                                 </div>
                                 <p className="text-xs text-zinc-300 leading-relaxed mt-1">
                                   {comment.text}
                                 </p>
                               </div>
                             </div>
                           );
                         })
                       )}
                     </div>
                   </ScrollArea>

                   {/* Add Comment */}
                   <div className="flex gap-2">
                     <Textarea
                       value={commentText}
                       onChange={(e) => setCommentText(e.target.value)}
                       placeholder="Adicione um comentário..."
                       className="bg-black/20 border-white/10 text-white text-sm min-h-[60px] resize-none"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && !e.shiftKey) {
                           e.preventDefault();
                           handleAddComment();
                         }
                       }}
                     />
                     <Button
                       className="bg-primary text-black font-bold hover:bg-primary/90 self-end"
                       onClick={handleAddComment}
                       disabled={!commentText.trim() || commentPending}
                     >
                       <Send className="w-4 h-4" />
                     </Button>
                   </div>
                 </div>
               </>
             )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
