'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export function ContentDialog({ open, onOpenChange, content, onSave, isPending }) {
  const [formData, setFormData] = useState({
    type: 'article',
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    category: '',
    tags: []
  });

  useEffect(() => {
    if (content) {
      setFormData({
        type: content.type || 'article',
        title: content.title || '',
        description: content.description || '',
        content: content.content || '',
        videoUrl: content.videoUrl || '',
        category: content.category || '',
        tags: content.tags || []
      });
    } else {
      setFormData({
        type: 'article',
        title: '',
        description: '',
        content: '',
        videoUrl: '',
        category: '',
        tags: []
      });
    }
  }, [content, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{content ? 'Editar Conteúdo' : 'Novo Conteúdo'}</DialogTitle>
          <DialogDescription>
            {content ? 'Atualize as informações do conteúdo' : 'Preencha os dados do novo conteúdo'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white"
              disabled={isPending}
            >
              <option value="article">Artigo</option>
              <option value="class">Aula</option>
              <option value="video">Vídeo</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          {formData.type === 'video' && (
            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL do Vídeo</Label>
              <Input
                id="videoUrl"
                type="url"
                value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                placeholder="https://..."
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
          )}
          {formData.type !== 'video' && (
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="bg-zinc-950 border-zinc-800 min-h-[200px]"
                disabled={isPending}
              />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({
                  ...formData,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                })}
                placeholder="nutrição, treino, dicas"
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
