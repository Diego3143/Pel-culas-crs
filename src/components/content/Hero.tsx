import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { Content } from '@/lib/types';
import { PlayCircle } from 'lucide-react';

interface HeroProps {
  content: Content;
}

export function Hero({ content }: HeroProps) {

  return (
    <div className="relative h-[50vh] min-h-[400px] w-full md:h-[calc(100vh-4rem)] md:min-h-[600px]">
      <div className="absolute inset-0">
        <Image
          src={content.imageUrl}
          alt={content.title}
          fill
          className="object-cover"
          priority
          data-ai-hint="movie scene"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex h-full items-end p-4 md:items-center md:p-8 lg:p-12">
        <div className="max-w-md space-y-4 text-white md:max-w-lg">
          <h1 className="text-4xl font-extrabold tracking-tighter md:text-5xl lg:text-6xl">
            {content.title}
          </h1>
          <p className="text-base text-gray-300 md:text-lg">
            {content.description}
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/80">
              <Link href={`/watch/${content.id}`}>
                <PlayCircle className="mr-2 h-6 w-6" /> Play Now
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/watch/${content.id}`}>More Info</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
