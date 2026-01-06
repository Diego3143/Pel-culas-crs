'use client';
import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import type { Content } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  content: Content;
}

export function ContentCard({ content }: ContentCardProps) {
  return (
    <Link href={`/watch/${content.id}`} className="group relative block w-full h-full overflow-hidden rounded-md shadow-lg">
      <Image
        src={content.imageUrl}
        alt={content.title}
        width={400}
        height={600}
        className="object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-110"
        data-ai-hint="movie poster"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out flex flex-col justify-end p-4">
        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
            <h3 className="text-white text-lg font-bold">{content.title}</h3>
            <div className="flex items-center mt-2">
                <PlayCircle className="text-white h-8 w-8" />
            </div>
        </div>
      </div>
    </Link>
  );
}
