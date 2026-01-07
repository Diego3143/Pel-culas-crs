'use client';
import { ContentCard } from '@/components/content/ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useContent } from '@/hooks/useContent';

export default function SeriesPage() {
  const { content: series, loading } = useContent('series');

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Series</h1>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3]">
              <Skeleton className="w-full h-full" />
            </div>
          ))}
        </div>
      ) : series.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {series.map(s => (
            <div key={s.id} className="aspect-[2/3]">
              <ContentCard content={s} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold">No series available</h2>
          <p className="text-muted-foreground mt-2">Check back later for new content!</p>
        </div>
      )}
    </div>
  );
}
