'use client';
import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

export function useUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const usersRef = query(ref(db, 'users'), orderByChild('displayName'));

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userList = Object.keys(data).map(key => {
            const userData = data[key];
            return {
              uid: key,
              displayName: userData.displayName,
              email: userData.email,
              isAdmin: userData.roles?.admin === true,
              suspendedUntil: userData.suspendedUntil || null,
            };
        }) as UserProfile[];
        setUsers(userList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { users, loading };
}
