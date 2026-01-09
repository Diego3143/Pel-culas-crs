'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { push, ref, set, serverTimestamp } from 'firebase/database';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { Switch } from '../ui/switch';

const episodeSchema = z.object({
  title: z.string().min(1, 'Episode title is required.'),
  videoUrl: z.string().url('Must be a valid URL.').or(z.literal('')).optional(),
  description: z.string().optional(),
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


export function UploadForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [numEpisodes, setNumEpisodes] = useState(0);

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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'episodes',
  });

  const contentType = form.watch('type');

  const handleNumEpisodesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10) || 0;
    setNumEpisodes(count);
    const currentCount = fields.length;
    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        append({ title: `Episode ${i + 1}`, videoUrl: '', description: `Description for episode ${i+1}` });
      }
    } else if (count < currentCount) {
        remove(Array.from({length: currentCount - count}, (_, i) => count + i));
    }
  };

  async function createNotification(contentId: string, values: z.infer<typeof formSchema>) {
    const notificationRef = push(ref(db, 'notifications'));
    await set(notificationRef, {
      contentId: contentId,
      title: values.title,
      description: values.description,
      imageUrl: values.imageUrl,
      type: values.type,
      createdAt: serverTimestamp(),
    });
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const contentListRef = ref(db, 'content');
        const newContentRef = push(contentListRef);

        const contentData: any = {
            type: values.type,
            title: values.title,
            description: values.description,
            imageUrl: values.imageUrl,
            genres: values.genres.split(',').map(g => g.trim()),
            inEmission: values.inEmission,
            createdAt: serverTimestamp(),
            ...(values.type === 'movie' && { videoUrl: values.videoUrl }),
        };

        await set(newContentRef, contentData);
  
        if (values.type === 'series' && values.episodes) {
            const episodesRef = ref(db, `content/${newContentRef.key}/episodes`);
            const episodeUpdates: { [key: string]: any } = {};
            values.episodes.forEach((episode, index) => {
              const episodeId = index + 1; // Use 1-based index for FB key
              episodeUpdates[episodeId] = {
                ...episode,
                id: episodeId.toString(),
                episodeNumber: index + 1,
              };
            });
            await set(episodesRef, episodeUpdates);
        }

        // Create notification after successful upload
        if (newContentRef.key) {
          await createNotification(newContentRef.key, values);
        }

      toast({
        title: 'Content Uploaded',
        description: `${values.title} has been added and a notification was sent.`,
      });
      router.push('/admin');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            
            <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Uploading...' : 'Upload Content'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
