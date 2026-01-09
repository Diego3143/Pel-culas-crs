'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface SuspendedUserModalProps {
  suspendedUntil: number;
}

export function SuspendedUserModal({ suspendedUntil }: SuspendedUserModalProps) {

  const formattedDate = format(new Date(suspendedUntil), "eeee, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" hideCloseButton={true}>
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Cuenta Suspendida
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            Tu cuenta ha sido suspendida temporalmente por un administrador debido a una infracción de los términos de servicio.
          </DialogDescription>
        </DialogHeader>
        <div className="text-center text-foreground/80 my-4 px-2">
            <p>Podrás volver a acceder a tu cuenta el:</p>
            <p className="font-bold text-accent mt-2">{formattedDate}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
