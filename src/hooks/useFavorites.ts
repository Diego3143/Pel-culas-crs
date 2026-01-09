'use client';
import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Content } from '@/lib/types';
import { useAuth } from './useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setFavorites([]);
      return;
    }

    setLoading(true);
    const contentRef = ref(db, 'content');
    
    // We fetch all content and then filter by likedBy on the client.
    // This is not super efficient for large datasets, but it's the simplest
    // approach with the current Realtime Database structure.
    // A more scalable solution would involve denormalizing data, like
    // creating a `userFavorites/{userId}` node.
    const contentQuery = query(contentRef, orderByChild('likes'));

    const unsubscribe = onValue(contentQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allContent = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        })) as Content[];
        
        const userFavorites = allContent.filter(item => item.likedBy && item.likedBy[user.uid]);
        setFavorites(userFavorites.reverse()); // Show most liked first
      } else {
        setFavorites([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching favorites:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { favorites, loading };
}
