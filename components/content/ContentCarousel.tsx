import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { Content } from '@/lib/types';
import { ContentCard } from './ContentCard';

interface ContentCarouselProps {
  title: string;
  content: Content[];
}

export function ContentCarousel({ title, content }: ContentCarouselProps) {
  if (!content || content.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {content.map((item) => (
            <CarouselItem key={item.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 pl-4">
               <div className="aspect-[2/3]">
                <ContentCard content={item} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-14 hidden sm:flex" />
        <CarouselNext className="mr-14 hidden sm:flex" />
      </Carousel>
    </section>
  );
}
