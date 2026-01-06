'use client';

import { Hero } from '@/components/content/Hero';
import { ContentCarousel } from '@/components/content/ContentCarousel';
import { RecommendedContent } from '@/components/content/RecommendedContent';
import { useContent } from '@/hooks/useContent';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { WelcomeModal } from '@/components/layout/WelcomeModal';

export default function Home() {
  const { content: allContent, loading } = useContent();

  const {
    heroContent,
    trendingContent,
    inEmissionContent,
    newReleases,
    popularContent,
  } = useMemo(() => {
    if (!allContent || allContent.length === 0) {
      return {
        heroContent: null,
        trendingContent: [],
        inEmissionContent: [],
        newReleases: [],
        popularContent: [],
      };
    }

    const inEmission = allContent.filter(c => c.inEmission);
    // Exclude inEmission content from other carousels
    const notInEmission = allContent.filter(c => !c.inEmission);

    const hero = inEmission.length > 0 ? inEmission[0] : notInEmission[0] || null;
    
    // Ensure the hero content is not repeated in the carousels
    const remainingContent = notInEmission.filter(c => c.id !== hero?.id);

    return {
      heroContent: hero,
      trendingContent: remainingContent.slice(0, 5),
      inEmissionContent: inEmission,
      newReleases: remainingContent.slice(5, 10),
      popularContent: remainingContent.slice(10, 15),
    };
  }, [allContent]);


  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <Skeleton className="h-[50vh] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-48 w-32" />
            <Skeleton className="h-48 w-32" />
            <Skeleton className="h-48 w-32" />
            <Skeleton className="h-48 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <WelcomeModal />
      {heroContent ? (
        <Hero content={heroContent} />
      ) : (
         <div className="relative h-[50vh] min-h-[400px] w-full md:h-[calc(100vh-4rem)] md:min-h-[600px] flex items-center justify-center bg-background">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tighter md:text-5xl lg:text-6xl">
              Welcome to CinePlus
            </h1>
            <p className="text-base text-gray-300 md:text-lg mt-4">
              Content will appear here once it's added by an administrator.
            </p>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {trendingContent.length > 0 && <ContentCarousel title="Trending Now" content={trendingContent} />}
        {inEmissionContent.length > 0 && <ContentCarousel title="En Emisión" content={inEmissionContent} />}
        {newReleases.length > 0 && <ContentCarousel title="New Releases" content={newReleases} />}
        <RecommendedContent />
        {popularContent.length > 0 && <ContentCarousel title="Popular on CinePlus" content={popularContent} />}
      </div>
    </div>
  );
}
