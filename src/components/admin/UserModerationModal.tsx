'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Loader2, ShieldOff, UserCheck, Shield, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';

interface UserModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export function UserModerationModal({ isOpen, onClose, user }: UserModerationModalProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // An admin cannot modify another admin or themselves
  const canModify = currentUser?.isAdmin && !user.isAdmin && currentUser.uid !== user.uid;
  const canModifyRoles = canModify; // Specific check for role modification

  const handleSuspension = async (durationDays: number) => {
    if (!canModify) return;
    setIsSubmitting(true);
    try {
      const suspensionEndDate = Date.now() + durationDays * 24 * 60 * 60 * 1000;
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, { suspendedUntil: suspensionEndDate });

      toast({
        title: 'Usuario Suspendido',
        description: `${user.displayName} ha sido suspendido por ${durationDays} día(s).`,
      });
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo suspender al usuario.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveSuspension = async () => {
    if (!canModify) return;
    setIsSubmitting(true);
    try {
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, { suspendedUntil: null });
      toast({ title: 'Suspensión Eliminada', description: `Se ha levantado la suspensión para ${user.displayName}.` });
      onClose();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la suspensión.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleToggleAdmin = async () => {
    if (!canModifyRoles) return;
    setIsSubmitting(true);
    try {
        const userRef = ref(db, `users/${user.uid}/roles`);
        await update(userRef, { admin: !user.isAdmin });
        toast({
            title: `Rol de ${user.isAdmin ? 'Admin' : 'Usuario'} asignado`,
            description: `${user.displayName} ahora es ${user.isAdmin ? 'usuario' : 'administrador'}.`
        });
        onClose();
    } catch (error:any) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cambiar el rol del usuario.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const isSuspended = user.suspendedUntil && user.suspendedUntil > Date.now();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Moderar Usuario</DialogTitle>
           {!canModify && currentUser?.uid !== user.uid && (
                <DialogDescription className="text-yellow-500 font-semibold">
                    No puedes modificar a otro administrador.
                </DialogDescription>
            )}
             {currentUser?.uid === user.uid && (
                 <DialogDescription className="text-yellow-500 font-semibold">
                    No puedes modificarte a ti mismo.
                </DialogDescription>
             )}
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-20 w-20">
                <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.displayName || 'User'} />
                <AvatarFallback className="text-3xl">{user.displayName?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center">
                <p className="font-bold text-lg">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                 {isSuspended && (
                    <p className="text-sm text-destructive mt-2 font-semibold">
                        Suspendido hasta: {format(new Date(user.suspendedUntil!), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </p>
                )}
            </div>
        </div>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            {isSuspended ? (
                 <Button onClick={handleRemoveSuspension} disabled={isSubmitting || !canModify} variant="outline">
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <UserCheck className="mr-2"/>}
                    Quitar Suspensión
                 </Button>
            ) : (
              <>
                <Button onClick={() => handleSuspension(1)} disabled={isSubmitting || !canModify} variant="destructive">
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <ShieldOff className="mr-2"/>}
                    Suspender 1 Día
                </Button>
                 <Button onClick={() => handleSuspension(7)} disabled={isSubmitting || !canModify} variant="destructive">
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <ShieldOff className="mr-2"/>}
                    Suspender 7 Días
                </Button>
              </>
            )}

            {user.isAdmin ? (
                <Button onClick={handleToggleAdmin} disabled={isSubmitting || !canModifyRoles} variant="secondary">
                     {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <ShieldCheck className="mr-2"/>}
                    Quitar Rol de Admin
                </Button>
            ) : (
                 <Button onClick={handleToggleAdmin} disabled={isSubmitting || !canModifyRoles} variant="secondary">
                    {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <Shield className="mr-2"/>}
                    Asignar Rol de Admin
                </Button>
            )}


             <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancelar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
