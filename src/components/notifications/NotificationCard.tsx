'use client';

import type { Notification, Content } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ref, runTransaction, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';

interface NotificationCardProps {
  notification: Notification;
}

export function NotificationCard({ notification }: NotificationCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<Content | null>(null);

  useEffect(() => {
    if (!notification.contentId) return;
    const contentRef = ref(db, `content/${notification.contentId}`);
    const unsubscribe = onValue(contentRef, (snapshot) => {
        if (snapshot.exists()) {
            setContent({ id: snapshot.key, ...snapshot.val() });
        }
    });
    return () => unsubscribe();
  }, [notification.contentId]);

  const handleLike = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Debes iniciar sesión para dar "Me gusta"' });
      return;
    }
    if (!notification.contentId) return;

    const contentRef = ref(db, `content/${notification.contentId}`);

    await runTransaction(contentRef, (currentContent) => {
      if (currentContent) {
        if (currentContent.likedBy && currentContent.likedBy[user.uid]) {
          // Unlike
          currentContent.likes = (currentContent.likes || 0) - 1;
          delete currentContent.likedBy[user.uid];
        } else {
          // Like
          currentContent.likes = (currentContent.likes || 0) + 1;
          if (!currentContent.likedBy) {
            currentContent.likedBy = {};
          }
          currentContent.likedBy[user.uid] = true;
        }
      }
      return currentContent;
    });
  };

  const hasLiked = user && content?.likedBy?.[user.uid] === true;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-accent/20 transition-shadow duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-1/3 relative min-h-[200px] md:min-h-0">
          <Image
            src={notification.imageUrl}
            alt={notification.title}
            fill
            className="object-cover"
            data-ai-hint="movie poster"
          />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent md:bg-gradient-to-r" />
        </div>
        <div className="md:w-2/3 p-6 flex flex-col">
          <p className="text-sm text-muted-foreground mb-1">
            Nuevo {notification.type === 'movie' ? 'Película' : 'Episodio'} añadido
          </p>
          <h2 className="text-2xl font-bold mb-2">{notification.title}</h2>
          <p className="text-muted-foreground line-clamp-3 mb-4 flex-grow">
            {notification.description}
          </p>
          <div className="flex justify-between items-center mt-auto">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
            </span>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleLike} disabled={!user || !content}>
                    <Heart className={cn("h-5 w-5", hasLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                    <span className="sr-only">Me gusta</span>
                </Button>
                <Button asChild variant="ghost">
                    <Link href={`/watch/${notification.contentId}`}>
                        Ver Ahora <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
