'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const stickerSchema = z.object({
  url: z.string().optional(),
  emoji: z.string().optional(),
}).refine(data => data.url || data.emoji, {
  message: 'Debe proporcionar una URL o un emoji.',
  path: ['url'], // Attach error to one field for display
});

type Sticker = {
    id: string;
    type: 'image' | 'emoji';
    value: string;
};

export function StickerManager() {
  const { toast } = useToast();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [previewUrl, setPreviewUrl] = useState('');

  const form = useForm<z.infer<typeof stickerSchema>>({
    resolver: zodResolver(stickerSchema),
    defaultValues: {
      url: '',
      emoji: '',
    },
  });

  const urlValue = form.watch('url');
  useEffect(() => {
    setPreviewUrl(urlValue || '');
  }, [urlValue]);


  useEffect(() => {
    const stickersRef = ref(db, 'stickers');
    const unsubscribe = onValue(stickersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const stickerList: Sticker[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        }));
        setStickers(stickerList);
      } else {
        setStickers([]);
      }
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, []);

  async function onSubmit(values: z.infer<typeof stickerSchema>) {
    setIsLoading(true);
    try {
        const stickersRef = ref(db, 'stickers');
        const newStickerRef = push(stickersRef);
        
        let stickerData;
        if (values.url) {
            stickerData = { type: 'image', value: values.url };
        } else if (values.emoji) {
            stickerData = { type: 'emoji', value: values.emoji };
        } else {
            throw new Error('No sticker data provided');
        }

        await set(newStickerRef, stickerData);
        toast({ title: 'Sticker Añadido', description: 'El nuevo sticker está disponible.' });
        form.reset();
        setPreviewUrl('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }

  async function deleteSticker(id: string) {
    try {
        await remove(ref(db, `stickers/${id}`));
        toast({ title: 'Sticker Eliminado' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Añadir Nuevo Sticker</CardTitle>
          <CardDescription>Añade una URL de imagen o un emoji.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de la Imagen del Sticker</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/sticker.png" {...field} onChange={(e) => {
                        field.onChange(e);
                        form.setValue('emoji', '');
                      }}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {previewUrl && (
                <div className="flex flex-col items-center">
                  <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
                  <Image src={previewUrl} alt="Sticker preview" width={100} height={100} className="rounded-md object-contain" />
                </div>
              )}
               <div className="relative flex items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-sm">O</span>
                <div className="flex-grow border-t border-muted"></div>
              </div>
              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emoji</FormLabel>
                    <FormControl>
                      <Input placeholder="😀" {...field} maxLength={2} onChange={(e) => {
                        field.onChange(e);
                        form.setValue('url', '');
                        setPreviewUrl('');
                      }} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Añadir Sticker
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Stickers Actuales</CardTitle>
        </CardHeader>
        <CardContent>
            {isFetching ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                    {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="w-24 h-24" />)}
                </div>
            ) : stickers.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                    {stickers.map(sticker => (
                        <div key={sticker.id} className="relative group flex items-center justify-center p-2 border rounded-md h-24">
                           {sticker.type === 'image' ? (
                            <Image src={sticker.value} alt="Sticker" width={80} height={80} className="object-contain" />
                           ) : (
                            <span className="text-5xl">{sticker.value}</span>
                           )}
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <Button variant="destructive" size="icon" className="absolute top-0 right-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el sticker.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteSticker(sticker.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center">No hay stickers. ¡Añade uno para empezar!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
