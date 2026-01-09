'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { updateCommentAuthorNames } from '@/lib/update-comments';
import { updateChatMessageAuthorNames } from '@/lib/update-chat-messages';


const profileSchema = z.object({
  displayName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }).max(20, { message: 'El nombre no puede tener más de 20 caracteres.' }),
});

export default function ProfilePage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (user) {
      form.reset({ displayName: user.displayName || '' });
    }
  }, [user, authLoading, router, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !auth.currentUser) return;

    setIsSubmitting(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName: values.displayName });

      // Update Realtime Database user profile
      const userDbRef = ref(db, `users/${user.uid}`);
      await update(userDbRef, { displayName: values.displayName });

      // Update all previous comments and chat messages
      await updateCommentAuthorNames(user.uid, values.displayName);
      await updateChatMessageAuthorNames(user.uid, values.displayName);

      toast({
        title: 'Perfil actualizado',
        description: 'Tu nombre se ha cambiado correctamente.',
      });
      
      setIsEditing(false);

      // Force a refresh of the page/layout to get the new user info in the header
       window.location.reload();

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar',
        description: error.message || 'No se pudo cambiar el nombre.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  if (authLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return null; // Redirect is handled by useEffect
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="max-w-4xl mx-auto overflow-hidden">
            <div className="bg-muted/40 p-8 flex flex-col md:flex-row items-center gap-6">
                 <Avatar className="h-24 w-24 border-4 border-background">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.displayName || 'User'} />
                    <AvatarFallback className="text-3xl">{user.displayName?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">
                            {user.displayName}
                        </h1>
                        {!isEditing && (
                             <Button variant="ghost" size="icon" className="text-accent hover:text-accent/80 hover:bg-accent/10 rounded-full" onClick={() => setIsEditing(true)}>
                                <Pencil className="h-5 w-5"/>
                            </Button>
                        )}
                    </div>
                    <p className="text-muted-foreground mt-1">
                        {user.email}
                    </p>
                     {isAdmin && <p className="text-xs font-bold px-2 py-1 bg-accent rounded-full text-accent-foreground inline-block mt-2">Admin</p>}
                </div>
            </div>
            {isEditing ? (
              <>
                <CardHeader>
                  <CardTitle>Editar Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                       <FormField
                          control={form.control}
                          name="displayName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de Usuario</FormLabel>
                              <FormControl>
                                <Input placeholder="Tu nuevo nombre" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <div className="flex gap-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                             <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                         </div>
                    </form>
                  </Form>
                </CardContent>
              </>
            ) : null}
        </Card>
    </div>
  );
}
