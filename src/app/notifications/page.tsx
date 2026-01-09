'use client';

import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { BellRing } from 'lucide-react';
import type { Notification } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationsPage() {
  const { user, markNotificationsAsRead } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const notifRef = query(ref(db, 'notifications'), orderByChild('createdAt'));
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

        const notifList: Notification[] = Object.keys(data)
          .map((key) => ({
            id: key,
            ...data[key],
          }))
          .filter(notif => notif.createdAt > twentyFourHoursAgo) // Filter for last 24 hours
          .sort((a, b) => b.createdAt - a.createdAt); // Sort descending
        setNotifications(notifList);

        // Mark these notifications as read for the current user
        if (user && notifList.length > 0) {
          const unreadIds = notifList.filter(n => !user.seenNotifications?.[n.id]).map(n => n.id);
          if (unreadIds.length > 0) {
             const updates: {[key: string]: boolean} = {};
             unreadIds.forEach(id => {
                updates[`users/${user.uid}/seenNotifications/${id}`] = true;
             });
             update(ref(db), updates);
          }
        }

      } else {
        setNotifications([]);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error fetching notifications:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-headline font-bold mb-8 flex items-center gap-2">
        <BellRing className="h-8 w-8 text-accent" />
        Novedades
      </h1>
      <div className="space-y-6">
        {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <NotificationCard key={notif.id} notification={notif} />
          ))
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-2xl font-semibold">No hay novedades recientes</h2>
            <p className="text-muted-foreground mt-2">
              Cuando se añada contenido nuevo, aparecerá aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
