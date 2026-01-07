'use client';

import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Content } from '@/lib/types';
import Image from 'next/image';
import { Button } from '../ui/button';
import Link from 'next/link';
import { PlayCircle, X } from 'lucide-react';

interface MoreInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content;
}

export function MoreInfoModal({ isOpen, onClose, content }: MoreInfoModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 border-0 bg-transparent overflow-hidden">
        <div className="relative aspect-video w-full">
            <Image
                src={content.imageUrl}
                alt={content.title}
                fill
                className="object-cover"
                data-ai-hint="movie scene background"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
            <div className="absolute top-4 right-4 z-20">
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="rounded-full bg-black/50 hover:bg-black/70 text-white">
                        <X className="h-6 w-6" />
                    </Button>
                </DialogClose>
            </div>
            <div className="relative z-10 flex h-full items-end p-8">
                <div className="max-w-xl space-y-4 text-white">
                    <DialogTitle asChild>
                        <h1 className="text-4xl font-extrabold tracking-tighter md:text-5xl">
                            {content.title}
                        </h1>
                    </DialogTitle>
                </div>
            </div>
        </div>
        <div className="bg-card p-8 -mt-2">
             <div className="flex gap-4 mb-4">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/80 flex-grow">
                    <Link href={`/watch/${content.id}`}>
                        <PlayCircle className="mr-2 h-6 w-6" /> Play
                    </Link>
                </Button>
            </div>
            <DialogDescription asChild>
                <p className="text-base text-gray-300 md:text-lg">
                    {content.description}
                </p>
            </DialogDescription>
            <div className="flex gap-2 my-4">
                {content.genres?.map(genre => (
                <span key={genre} className="text-xs font-semibold px-2 py-1 bg-muted rounded-full text-muted-foreground">{genre}</span>
                ))}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
