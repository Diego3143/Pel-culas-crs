'use client';

import Link from 'next/link';
import { Button } from '../ui/button';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function ChatBubble() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <Button asChild size="icon" className="rounded-full w-14 h-14 bg-accent hover:bg-accent/80 shadow-lg">
        <Link href="/chat">
          <MessageSquare className="h-7 w-7" />
          <span className="sr-only">Abrir Chat Global</span>
        </Link>
      </Button>
    </div>
  );
}
