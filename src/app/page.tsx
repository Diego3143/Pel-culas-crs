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
    newReleases,
    inEmissionContent,
    popularContent,
  } = useMemo(() => {
    if (!allContent || allContent.length === 0) {
      return {
        heroContent: null,
        newReleases: [],
        inEmissionContent: [],
        popularContent: [],
      };
    }

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    // Filter content based on creation date or existence of createdAt field
    const recentContent = allContent.filter(c => c.createdAt && c.createdAt > twentyFourHoursAgo);
    const olderContent = allContent.filter(c => !c.createdAt || c.createdAt <= twentyFourHoursAgo);

    const inEmission = allContent.filter(c => c.inEmission);
    
    // Determine hero content
    let hero = null;
    if (inEmission.length > 0) {
      hero = inEmission[0];
    } else if (recentContent.length > 0) {
      hero = recentContent[0];
    } else {
      hero = allContent[0] || null;
    }
    
    // Ensure the hero content is not repeated in the carousels if possible
    const remainingOlderContent = olderContent.filter(c => c.id !== hero?.id);

    return {
      heroContent: hero,
      newReleases: recentContent,
      inEmissionContent: inEmission,
      popularContent: remainingOlderContent.slice(0, 15),
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
            <h1 className="text-4xl font-extrabold tracking-tighter md:text-5xl lg:text-6xl font-headline">
              Welcome to DramaWave
            </h1>
            <p className="text-base text-gray-300 md:text-lg mt-4">
              Content will appear here once it's added by an administrator.
            </p>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {newReleases.length > 0 && <ContentCarousel title="New Releases" content={newReleases} />}
        {inEmissionContent.length > 0 && <ContentCarousel title="Doramas" content={inEmissionContent} />}
        {popularContent.length > 0 && <ContentCarousel title="Películas" content={popularContent} />}
        <RecommendedContent />
      </div>
    </div>
  );
}
