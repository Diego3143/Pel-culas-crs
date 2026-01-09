'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ref, onValue, update, push, set, serverTimestamp } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { Separator } from '../ui/separator';
import type { Content, Episode } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Switch } from '../ui/switch';

const episodeSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Episode title is required.'),
  videoUrl: z.string().url('Must be a valid URL.').or(z.literal('')).optional(),
  description: z.string().optional(),
  episodeNumber: z.number().optional(),
});

const formSchema = z.object({
  type: z.enum(['movie', 'series'], { required_error: 'Content type is required.' }),
  title: z.string().min(1, 'Title is required.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  imageUrl: z.string().url('Must be a valid image URL.'),
  genres: z.string().min(1, 'Genres are required (comma-separated).'),
  inEmission: z.boolean().default(false),
  videoUrl: z.string().optional(),
  episodes: z.array(episodeSchema).optional(),
}).refine(data => {
    if (data.type === 'movie') return !!data.videoUrl && data.videoUrl.length > 0;
    return true;
}, { message: "Video URL is required for movies.", path: ["videoUrl"] });

type EditFormProps = {
  contentId: string;
};

export function EditForm({ contentId }: EditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const initialContentRef = useRef<Content | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'movie',
      title: '',
      description: '',
      imageUrl: '',
      genres: '',
      inEmission: false,
      videoUrl: '',
      episodes: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'episodes',
  });

  useEffect(() => {
    const contentRef = ref(db, `content/${contentId}`);
    const unsubscribe = onValue(contentRef, (snapshot) => {
      if (snapshot.exists()) {
        const contentData = snapshot.val() as Content;
        initialContentRef.current = contentData; // Store initial state
        
        form.reset({
          ...contentData,
          genres: contentData.genres?.join(', ') || '',
        });

        if (contentData.type === 'series' && contentData.episodes) {
           const episodesArray = Array.isArray(contentData.episodes)
             ? contentData.episodes.filter(Boolean)
             : Object.values(contentData.episodes);

           const sortedEpisodes = episodesArray.sort((a,b) => a.episodeNumber - b.episodeNumber);
           replace(sortedEpisodes);
        }
      }
      setIsFetching(false);
    });

    return () => unsubscribe();
  }, [contentId, form, replace]);


  const contentType = form.watch('type');

  const handleNumEpisodesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10) || 0;
    
    if (count > fields.length) {
      const newEpisodes = [];
      for (let i = fields.length; i < count; i++) {
        newEpisodes.push({ 
            id: (i + 1).toString(),
            episodeNumber: i + 1,
            title: `Episode ${i + 1}`, 
            videoUrl: '', 
            description: `Description for episode ${i+1}` 
        });
      }
      append(newEpisodes);
    } else if (count < fields.length) {
      const fieldsToRemove = [];
      for (let i = count; i < fields.length; i++) {
          fieldsToRemove.push(i);
      }
      remove(fieldsToRemove);
    }
  };

  async function createNotificationForNewEpisode(contentInfo: z.infer<typeof formSchema>, newEpisode: Episode) {
    const notificationRef = push(ref(db, 'notifications'));
    const description = `¡Nuevo capítulo disponible! Ya puedes ver el capítulo ${newEpisode.episodeNumber}: ${newEpisode.title}.`;
    await set(notificationRef, {
      contentId: contentId,
      title: contentInfo.title,
      description: description,
      imageUrl: contentInfo.imageUrl,
      type: 'series',
      createdAt: serverTimestamp(),
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const contentRef = ref(db, `content/${contentId}`);
        const contentData: any = {
            type: values.type,
            title: values.title,
            description: values.description,
            imageUrl: values.imageUrl,
            genres: values.genres.split(',').map(g => g.trim()),
            inEmission: values.inEmission,
        };

        if (values.type === 'movie') {
            contentData.videoUrl = values.videoUrl;
            contentData.episodes = null;
        } else {
            contentData.videoUrl = null;
            if (values.episodes) {
              const episodeUpdates: { [key: string]: any } = {};
              values.episodes.forEach((episode, index) => {
                const episodeId = (index + 1).toString();
                episodeUpdates[episodeId] = {
                  ...episode,
                  id: episodeId,
                  episodeNumber: index + 1,
                };
              });
              contentData.episodes = episodeUpdates;

              // --- Notification Logic ---
              const initialEpisodes = initialContentRef.current?.episodes ? 
                (Array.isArray(initialContentRef.current.episodes) ? initialContentRef.current.episodes.filter(Boolean) : Object.values(initialContentRef.current.episodes))
                : [];
              
              for (const updatedEpisode of values.episodes) {
                 if (updatedEpisode.videoUrl) {
                    const initialEpisode = initialEpisodes.find(ep => ep.episodeNumber === updatedEpisode.episodeNumber);
                    // If episode is new or didn't have a URL before
                    if (!initialEpisode || !initialEpisode.videoUrl) {
                       await createNotificationForNewEpisode(values, updatedEpisode as Episode);
                    }
                 }
              }
              // --- End Notification Logic ---
            }
        }
        await update(contentRef, contentData);

        toast({
            title: 'Contenido Actualizado',
            description: `${values.title} ha sido actualizado correctamente.`,
        });
        router.push('/admin/content-list');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error al Actualizar',
            description: error.message || 'Ha ocurrido un error desconocido.',
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (isFetching) {
    return (
        <Card>
            <CardHeader><CardTitle>Detalles del Contenido</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles del Contenido</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input placeholder="La Gran Aventura" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Contenido</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'movie') {
                            replace([]);
                        }
                    }} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="movie">Película</SelectItem>
                        <SelectItem value="series">Serie</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <FormField
                control={form.control}
                name="genres"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Géneros</FormLabel>
                    <FormControl><Input placeholder="Ciencia Ficción, Aventura, Comedia" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de la Imagen</FormLabel>
                  <FormControl><Input placeholder="https://example.com/poster.jpg" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl><Textarea placeholder="Un breve resumen del contenido..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inEmission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      En Emisión
                    </FormLabel>
                    <FormDescription>
                      Marcar si este contenido se está emitiendo actualmente.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {contentType === 'movie' && (
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del Vídeo de la Película</FormLabel>
                    <FormControl><Input placeholder="https://example.com/movie.mp4" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {contentType === 'series' && (
              <div className="space-y-4">
                <Separator />
                <h3 className="text-lg font-medium">Episodios de la Serie</h3>
                <FormItem>
                    <FormLabel>Número de Episodios</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="12"
                        value={fields.length}
                        onChange={handleNumEpisodesChange}
                      />
                    </FormControl>
                </FormItem>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-4 border p-4 rounded-md">
                     <FormField
                      control={form.control}
                      name={`episodes.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título del Episodio {index + 1}</FormLabel>
                          <FormControl><Input placeholder={`Episodio ${index + 1}`} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`episodes.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción del Episodio {index + 1}</FormLabel>
                          <FormControl><Textarea placeholder="Resumen del episodio..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`episodes.${index}.videoUrl`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del Episodio {index + 1}</FormLabel>
                          <FormControl><Input placeholder="https://example.com/episode.mp4" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                </div>
                 <FormMessage>{form.formState.errors.episodes?.message}</FormMessage>
              </div>
            )}
            
            <Button type="submit" className="w-full md:w-auto" disabled={isLoading || isFetching}>
              {(isLoading || isFetching) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Actualizando...' : 'Actualizar Contenido'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
