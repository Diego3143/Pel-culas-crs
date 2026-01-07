'use client';
import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Content } from '@/lib/types';

export function useContent(contentType?: 'movie' | 'series') {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const contentRef = ref(db, 'content');
    
    let contentQuery;
    if (contentType) {
      contentQuery = query(contentRef, orderByChild('type'), equalTo(contentType));
    } else {
      contentQuery = contentRef;
    }

    const unsubscribe = onValue(contentQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const contentList = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
        })) as Content[];
        setContent(contentList);
      } else {
        setContent([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching content:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [contentType]);

  return { content, loading };
}
