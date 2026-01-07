'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Logo } from './Logo';
import { Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { ref, get, set } from 'firebase/database';

const SESSION_STORAGE_KEY = 'welcomeModalShown';

export function WelcomeModal() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    const checkAndShowModal = async () => {
      if (user) {
        // For registered users, check the database
        const userWelcomeRef = ref(db, `users/${user.uid}/hasSeenWelcomeModal`);
        const snapshot = await get(userWelcomeRef);
        if (!snapshot.exists() || !snapshot.val()) {
          setIsOpen(true);
        }
      } else {
        // For guest users, check session storage
        const hasBeenShown = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!hasBeenShown) {
          setIsOpen(true);
        }
      }
    };

    checkAndShowModal();

  }, [user, loading]);

  const handleClose = async () => {
    setIsOpen(false);
    if (user) {
      // For registered users, set the flag in the database
      const userWelcomeRef = ref(db, `users/${user.uid}/hasSeenWelcomeModal`);
      await set(userWelcomeRef, true);
    } else {
      // For guest users, set the flag in session storage
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    }
  };

  if (loading || !isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card border-accent/20">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="text-accent h-6 w-6" />
            ¡Bienvenido a Nuestra Temporada Anual!
             <Sparkles className="text-accent h-6 w-6" />
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            En CinePlus, celebramos el contenido con un ciclo anual. Disfruta de los doramas y películas que publicaremos a lo largo del año.
          </DialogDescription>
        </DialogHeader>
        <div className="text-center text-foreground/80 my-4 px-2">
            <p>Nuestra plataforma opera por temporadas. Al final de cada año, el 31 de diciembre, nuestro catálogo se renueva para dar la bienvenida a una nueva selección de contenido exclusivo. ¡Esperamos que disfrutes de la temporada actual!</p>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={handleClose}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
