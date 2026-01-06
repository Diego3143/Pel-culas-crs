'use client';
import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { contentDiscoveryAssistant } from '@/ai/flows/content-discovery-assistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles } from 'lucide-react';

interface DoramaUpdate {
    lastFetchDate: string;
    recommendations: string;
}

export function RecommendedContent() {
  const { user, loading: authLoading } = useAuth();
  const [recommendations, setRecommendations] = useState('');
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const getRecs = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const doramaUpdateRef = ref(db, 'appState/doramaUpdate');

      try {
        const snapshot = await get(doramaUpdateRef);
        const data: DoramaUpdate | null = snapshot.val();

        if (data && data.lastFetchDate === today && data.recommendations) {
          setRecommendations(data.recommendations);
          setIsVisible(true);
        } else if (user) {
          // Add a small random delay to prevent multiple clients from fetching at the exact same time
          await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
          
          // Double-check if another client has fetched the data in the meantime
          const freshSnapshot = await get(doramaUpdateRef);
          const freshData: DoramaUpdate | null = freshSnapshot.val();

          if (freshData && freshData.lastFetchDate === today && freshData.recommendations) {
              setRecommendations(freshData.recommendations);
              setIsVisible(true);
          } else {
              const result = await contentDiscoveryAssistant({});
              const newRecommendations = result.recommendations;
              
              if (newRecommendations) {
                await set(doramaUpdateRef, {
                  lastFetchDate: today,
                  recommendations: newRecommendations,
                });
                setRecommendations(newRecommendations);
                setIsVisible(true);
              } else {
                setIsVisible(false);
              }
          }
        } else {
            // Not logged in and no recent data
            setIsVisible(false);
        }
      } catch (e: any) {
        console.error("AI recommendation fetch failed:", e);
        // Hide component on quota error to prevent repeated calls
        if (e.message && e.message.includes('429')) {
          setIsVisible(false); 
        } else if (recommendations) {
            // If there's an error but we have stale data, show it
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
      } finally {
        setLoading(false);
      }
    };
    
    getRecs();
    
  }, [user, authLoading]);
  
  if (loading) {
     return (
        <section>
          <h2 className="text-2xl font-bold mb-4">Doramas en Emisión</h2>
          <Card className="bg-gradient-to-br from-card to-muted/50 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-accent" />
                <span>Actualización Diaria de K-Dramas</span>
              </CardTitle>
              <CardDescription>Sugerencias de series populares que se están emitiendo ahora.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-4 w-[70%]" />
              </div>
            </CardContent>
          </Card>
        </section>
     );
  }

  if (!isVisible || !recommendations) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Doramas en Emisión</h2>
      <Card className="bg-gradient-to-br from-card to-muted/50 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-accent" />
            <span>Actualización Diaria de K-Dramas</span>
          </CardTitle>
          <CardDescription>Sugerencias de series populares que se están emitiendo ahora.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80 whitespace-pre-line">{recommendations}</p>
        </CardContent>
      </Card>
    </section>
  );
}
