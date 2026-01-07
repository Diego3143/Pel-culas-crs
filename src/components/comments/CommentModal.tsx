'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Filter } from "bad-words";

const filter = new Filter();
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import type { UserProfile } from '@/lib/types';
import { Loader2, Smile } from 'lucide-react';
import { StickerSheet } from './StickerSheet';

const commentSchema = z.object({
  text: z.string().max(500, 'El comentario no puede exceder los 500 caracteres.').optional(),
});

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  user: UserProfile;
}

const badWordsEs = [
  'puto', 'puta', 'cabron', 'cabrona', 'pendejo', 'pendeja', 'mierda', 'joder',
  'coño', 'gilipollas', 'maricon', 'mamon', 'chinga', 'chingar', 'verga',
  'culero', 'culera', 'pito', 'chocha', 'mamahuevo', 'hijueputa' 
];
const filter = new Filter();
filter.addWords(...badWordsEs);


export function CommentModal({ isOpen, onClose, contentId, user }: CommentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStickerSheetOpen, setIsStickerSheetOpen] = useState(false);
  
  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      text: '',
    },
  });

  const sendComment = async (type: 'text' | 'sticker' | 'image', content: string) => {
    setIsSubmitting(true);
    try {
      const commentsRef = ref(db, `comments/${contentId}`);
      const newCommentRef = push(commentsRef);

      // Determine correct type for DB
      const dbType = type === 'image' ? 'image' : (type === 'sticker' ? 'emoji' : 'text');

      await set(newCommentRef, {
        authorId: user.uid,
        authorName: user.displayName,
        authorAvatar: `https://avatar.vercel.sh/${user.email}.png`,
        type: dbType,
        content,
        timestamp: serverTimestamp(),
      });
      
      toast({ title: 'Comentario publicado', description: 'Tu comentario se ha añadido.' });
      form.reset();
      onClose();

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'No se pudo publicar el comentario.' });
    } finally {
        setIsSubmitting(false);
        setIsStickerSheetOpen(false);
    }
  };

  async function onTextSubmit(values: z.infer<typeof commentSchema>) {
    if (!values.text) return;
    const cleanedText = filter.clean(values.text);
    sendComment('text', cleanedText);
  }

  const onStickerSelect = (stickerValue: string, stickerType: 'image' | 'emoji') => {
    const typeToSend = stickerType === 'image' ? 'image' : 'sticker';
    sendComment(typeToSend, stickerValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setIsStickerSheetOpen(false);
      }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir un comentario</DialogTitle>
          <DialogDescription>
            Comparte tu opinión con la comunidad.
          </DialogDescription>
        </DialogHeader>
        
        {isStickerSheetOpen ? (
          <StickerSheet onStickerSelect={onStickerSelect} />
        ) : (
          <Form {...form}>
              <form onSubmit={form.handleSubmit(onTextSubmit)} className="space-y-4">
                  <FormField
                      control={form.control}
                      name="text"
                      render={({ field }) => (
                          <FormItem>
                              <FormLabel>Tu comentario</FormLabel>
                              <FormControl>
                                  <Textarea
                                      placeholder="Escribe algo increíble..."
                                      className="resize-none"
                                      {...field}
                                  />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                      )}
                  />
                  <DialogFooter>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsStickerSheetOpen(true)} disabled={isSubmitting}>
                          <Smile />
                          <span className="sr-only">Abrir stickers</span>
                      </Button>
                      <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                          Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting || !form.watch('text')}>
                          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isSubmitting ? 'Publicando...' : 'Publicar'}
                      </Button>
                  </DialogFooter>
              </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
