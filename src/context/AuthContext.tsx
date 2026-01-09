'use client';

import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get, onValue, set, serverTimestamp, update } from 'firebase/database';
import type { ReactNode } from 'react';
import { createContext, useEffect, useState } from 'react';

import { auth, db } from '@/lib/firebase';
import type { UserProfile, Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { SuspendedUserModal } from '@/components/admin/SuspendedUserModal';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  unreadNotifications: number;
  markNotificationsAsRead: (notificationIds: string[]) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  unreadNotifications: 0,
  markNotificationsAsRead: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [suspensionInfo, setSuspensionInfo] = useState<{ suspendedUntil: number } | null>(null);
  const { toast } = useToast();

  const markNotificationsAsRead = async (notificationIds: string[]) => {
    if (!user || notificationIds.length === 0) return;
    const updates: { [key: string]: any } = {};
    notificationIds.forEach(id => {
      updates[`/users/${user.uid}/seenNotifications/${id}`] = true;
    });
    // Use `update` instead of `set` to avoid overwriting the whole db ref
    await update(ref(db), updates);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const userRef = ref(db, 'users/' + firebaseUser.uid);
        
        // Use onValue for real-time updates to user profile (like suspensions)
        const unsubscribeUser = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();

            if (userData.suspendedUntil && userData.suspendedUntil > Date.now()) {
                setSuspensionInfo({ suspendedUntil: userData.suspendedUntil });
                signOut(auth);
                setUser(null);
                setIsAdmin(false);
                setLoading(false);
                return;
            } else {
                 setSuspensionInfo(null);
            }
            
            const profile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || userData.displayName,
              isAdmin: userData.roles?.admin === true,
              seenNotifications: userData.seenNotifications || {},
              suspendedUntil: userData.suspendedUntil,
            };
            setUser(profile);
            setIsAdmin(profile.isAdmin);
          } else {
            const newUserProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              isAdmin: false,
              seenNotifications: {},
            };
            set(userRef, {
                displayName: newUserProfile.displayName,
                email: newUserProfile.email,
                roles: { admin: false },
                hasSeenWelcomeModal: false,
                createdAt: serverTimestamp(),
            });
            setUser(newUserProfile);
            setIsAdmin(false);
          }
          setLoading(false);
        });

        // Detach listener on cleanup
        return () => unsubscribeUser();
      } else {
        setUser(null);
        setIsAdmin(false);
        setUnreadNotifications(0);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [toast]);

  useEffect(() => {
    if (!user) {
        setUnreadNotifications(0);
        return;
    };

    const notifRef = ref(db, 'notifications');
    const userSeenRef = ref(db, `users/${user.uid}/seenNotifications`);

    const unsubscribeNotifs = onValue(notifRef, (snapshot) => {
      const allNotifs: Notification[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        Object.keys(data).forEach(key => {
            if (data[key].createdAt > twentyFourHoursAgo) {
                allNotifs.push({ id: key, ...data[key] });
            }
        });
      }
      
      const unsubscribeSeen = onValue(userSeenRef, (seenSnapshot) => {
        const seenNotifs = seenSnapshot.val() || {};
        const unreadCount = allNotifs.filter(n => !seenNotifs[n.id]).length;
        setUnreadNotifications(unreadCount);
      });

      return () => unsubscribeSeen();
    });

    return () => {
      unsubscribeNotifs();
    };

  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, unreadNotifications, markNotificationsAsRead }}>
      {children}
      {suspensionInfo && <SuspendedUserModal suspendedUntil={suspensionInfo.suspendedUntil} />}
    </AuthContext.Provider>
  );
}
