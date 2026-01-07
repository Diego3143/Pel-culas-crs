'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

import type { Content, Episode, Comment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Pencil, Lock, Share2, Download, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CommentSection } from '@/components/comments/CommentSection';
import { CommentModal } from '@/components/comments/CommentModal';

export default function WatchPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const contentRef = ref(db, 'content/' + id);

    const unsubscribe = onValue(contentRef, (snapshot) => {
      if (snapshot.exists()) {
        const contentData = { id: snapshot.key, ...snapshot.val() } as Content;

        if (contentData.type === 'series' && contentData.episodes) {
          contentData.episodes = Object.values(contentData.episodes)
            .sort((a, b) => a.episodeNumber - b.episodeNumber);
          
          if (!selectedEpisode) {
            const firstAvailableEpisode = contentData.episodes.find(ep => ep.videoUrl);
            setSelectedEpisode(firstAvailableEpisode || contentData.episodes[0]);
          }
        }
        setContent(contentData);
      } else {
        setContent(null);
      }
      setLoading(false);
    }, (error) => {
        console.error(error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [id, selectedEpisode]);


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Enlace copiado",
      description: "¡El enlace se ha copiado a tu portapapeles!",
    });
  };

  if (loading) {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Skeleton className="aspect-video w-full rounded-lg mb-8" />
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-24 w-full" />
                </div>
             </div>
        </div>
    )
  }

  if (!content) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold">Content not found</h1>
      </div>
    );
  }

  const currentVideoUrl = content.type === 'movie' ? content.videoUrl : selectedEpisode?.videoUrl;

  return (
    <>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden relative mb-8">
        {currentVideoUrl ? (
          <video src={currentVideoUrl} controls autoPlay className="w-full h-full object-contain" key={currentVideoUrl}/>
        ) : (
          <>
            <Image
              src={content.imageUrl}
              alt="Video player placeholder"
              fill
              className="object-cover"
              data-ai-hint="abstract cinema"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <h2 className="text-3xl font-bold text-white text-center p-4">
                {content.type === 'series' ? (selectedEpisode ? 'Episode not yet available' : 'Select an episode to watch') : 'Video not available'}
              </h2>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-extrabold mb-2">{content.title}</h1>
              {selectedEpisode && <h2 className="text-2xl font-bold mb-2 text-muted-foreground">{selectedEpisode.title}</h2>}
            </div>
            {isAdmin && (
              <Button asChild variant="outline">
                <Link href={`/admin/edit/${content.id}`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
            )}
          </div>
          <div className="flex gap-2 my-4">
            {content.genres?.map(genre => (
              <span key={genre} className="text-xs font-semibold px-2 py-1 bg-muted rounded-full text-muted-foreground">{genre}</span>
            ))}
          </div>
          <p className="text-muted-foreground mb-6">{selectedEpisode?.description || content.description}</p>
          
          <Separator className="my-6" />

          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={handleShare} variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
            </Button>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" disabled>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Función no disponible por el momento</p>
                    </TooltipContent>
                </Tooltip>
                 <Tooltip>
                    <TooltipTrigger asChild>
                       <Button variant="outline" onClick={() => user ? setIsCommentModalOpen(true) : toast({ variant: 'destructive', title: 'Debes iniciar sesión para comentar' })}>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Comentarios
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Deja un comentario</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="lg:row-start-1 lg:col-start-3">
            {content.type === 'series' && content.episodes && (
            <Card>
                <CardHeader>
                <CardTitle>Episodes</CardTitle>
                </CardHeader>
                <CardContent>
                <ScrollArea className="h-96">
                    <div className="space-y-4">
                    {content.episodes.map((episode, index) => {
                        const isAvailable = !!episode.videoUrl;
                        return (
                        <div key={episode.id}>
                            <div
                            className={cn(
                                "flex items-start gap-4 p-2 rounded-md",
                                isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-50",
                                selectedEpisode?.id === episode.id ? 'bg-muted' : (isAvailable ? 'hover:bg-muted/50' : '')
                            )}
                            onClick={() => isAvailable && setSelectedEpisode(episode)}
                            >
                            <span className="text-lg font-bold text-muted-foreground mt-1">{episode.episodeNumber}</span>
                            <div className="flex-1">
                                <h3 className="font-semibold flex items-center gap-2">
                                {episode.title}
                                {!isAvailable && <Lock className="h-3 w-3 text-muted-foreground" />}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{episode.description}</p>
                            </div>
                            </div>
                            {index < content.episodes!.length - 1 && <Separator className="mt-4"/>}
                        </div>
                        )
                    })}
                    </div>
                </ScrollArea>
                </CardContent>
            </Card>
            )}
        </div>
      </div>
      <Separator className="my-6" />
      <div className="max-w-4xl">
        <CommentSection contentId={id} />
      </div>
    </div>
     {user && (
        <CommentModal
          isOpen={isCommentModalOpen}
          onClose={() => setIsCommentModalOpen(false)}
          contentId={id}
          user={user}
        />
      )}
    </>
  );
}
