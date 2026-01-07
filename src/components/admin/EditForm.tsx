'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ref, onValue, update } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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

  const numEpisodes = fields.length;

  useEffect(() => {
    const contentRef = ref(db, `content/${contentId}`);
    const unsubscribe = onValue(contentRef, (snapshot) => {
      if (snapshot.exists()) {
        const contentData = snapshot.val() as Content;
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
    const currentValues = form.getValues('episodes') || [];
    
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
            contentData.episodes = null; // Remove episodes if switching to movie
        } else {
            contentData.videoUrl = null; // Remove videoUrl if switching to series
            if (values.episodes) {
              const episodeUpdates: { [key: string]: any } = {};
              values.episodes.forEach((episode, index) => {
                const episodeId = (index + 1).toString(); // Use 1-based index for FB key
                episodeUpdates[episodeId] = {
                  ...episode,
                  id: episodeId,
                  episodeNumber: index + 1,
                };
              });
              contentData.episodes = episodeUpdates;
            }
        }
        await update(contentRef, contentData);

        toast({
            title: 'Content Updated',
            description: `${values.title} has been successfully updated.`,
        });
        router.push('/admin/content-list');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'An unknown error occurred.',
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (isFetching) {
    return (
        <Card>
            <CardHeader><CardTitle>Content Details</CardTitle></CardHeader>
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
        <CardTitle>Content Details</CardTitle>
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
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="The Great Adventure" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={(value) => {
                        field.onChange(value);
                        if (value === 'movie') {
                            replace([]);
                        }
                    }} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select content type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="movie">Movie</SelectItem>
                        <SelectItem value="series">Series</SelectItem>
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
                    <FormLabel>Genres</FormLabel>
                    <FormControl><Input placeholder="Sci-Fi, Adventure, Comedy" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="A brief summary of the content..." {...field} /></FormControl>
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
                    <FormLabel>Movie Video URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/movie.mp4" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {contentType === 'series' && (
              <div className="space-y-4">
                <Separator />
                <h3 className="text-lg font-medium">Series Episodes</h3>
                <FormItem>
                    <FormLabel>Number of Episodes</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min="0"
                        placeholder="12"
                        value={numEpisodes}
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
                          <FormLabel>Episode {index + 1} Title</FormLabel>
                          <FormControl><Input placeholder={`Episode ${index + 1}`} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`episodes.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Episode {index + 1} Description</FormLabel>
                          <FormControl><Textarea placeholder="Episode summary..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`episodes.${index}.videoUrl`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Episode {index + 1} URL</FormLabel>
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
              {isLoading ? 'Updating...' : 'Update Content'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
