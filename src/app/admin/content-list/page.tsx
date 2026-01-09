'use client';
import { ContentCard } from '@/components/content/ContentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useContent } from '@/hooks/useContent';
import Link from 'next/link';

export default function ContentListPage() {
  const { content, loading } = useContent();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-headline font-bold mb-8">Manage Content</h1>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
             <div key={i} className="aspect-[2/3]">
                <Skeleton className="w-full h-full" />
            </div>
          ))}
        </div>
      ) : content.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {content.map(item => (
            <div key={item.id} className="aspect-[2/3] relative group">
                <ContentCard content={item} />
                <Link href={`/admin/edit/${item.id}`} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-lg font-bold">Edit</span>
                </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold">No content available</h2>
          <p className="text-muted-foreground mt-2">Upload content to get started.</p>
        </div>
      )}
    </div>
  );
}
