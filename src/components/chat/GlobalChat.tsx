'use client';
import { useState, useEffect, useRef } from 'react';
import { ref, onValue, push, set, serverTimestamp, query, orderByKey, limitToLast, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Comment as MessageType, UserProfile } from '@/lib/types';
import { Loader2, Send, Smile, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { StickerSheet } from '../comments/StickerSheet';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { UserModerationModal } from '../admin/UserModerationModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';


export function GlobalChat() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const messagesRef = query(ref(db, 'global_chat'), orderByKey(), limitToLast(100));

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList: MessageType[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setMessages(messageList);
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
            const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (viewport) {
                viewport.scrollTop = viewport.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (content: string, type: 'text' | 'sticker' | 'image') => {
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    try {
      const messagesRef = ref(db, 'global_chat');
      const newMessageRef = push(messagesRef);

      const dbType = type === 'image' ? 'image' : (type === 'sticker' ? 'emoji' : 'text');

      await set(newMessageRef, {
        authorId: user.uid,
        authorName: user.displayName,
        authorAvatar: `https://avatar.vercel.sh/${user.email}.png`,
        type: dbType,
        content: content,
        timestamp: serverTimestamp(),
      });
      
      if(type === 'text') setNewMessage('');

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onStickerSelect = (stickerValue: string, stickerType: 'image' | 'emoji') => {
    const typeToSend = stickerType === 'image' ? 'image' : 'sticker';
    handleSendMessage(stickerValue, typeToSend);
  };
  
  const handleAvatarClick = async (authorId: string, authorName: string, authorAvatar: string) => {
    if (isAdmin) {
        try {
            const userRef = ref(db, `users/${authorId}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                setSelectedUser({
                    uid: authorId,
                    displayName: userData.displayName,
                    email: userData.email,
                    isAdmin: userData.roles?.admin === true,
                    suspendedUntil: userData.suspendedUntil
                });
                setIsModerationModalOpen(true);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar al usuario.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo obtener la información del usuario.' });
        }
    } else {
        setSelectedUser({
            uid: authorId,
            displayName: authorName,
            email: 'No disponible',
            isAdmin: false
        });
        setIsProfileModalOpen(true);
    }
  }


  const renderMessageContent = (message: MessageType) => {
    switch (message.type) {
      case 'emoji':
        return <p className="text-5xl">{message.content}</p>;
      case 'image':
        return <Image src={message.content} alt="sticker" width={100} height={100} className="rounded-md object-contain" />;
      case 'text':
      default:
        return <p className="text-foreground/90">{message.content}</p>;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-[calc(100dvh)] w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100dvh)] bg-background">
        <header className="flex items-center justify-between p-2 border-b bg-card">
          <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                  <ArrowLeft />
              </Link>
          </Button>
          <div className="flex flex-col items-center">
              <h1 className="text-xl font-bold">Chat Global</h1>
              <p className="text-xs text-muted-foreground">Comunidad DramaWave</p>
          </div>
          <div className="w-10"></div>
        </header>

        <ScrollArea className="flex-1 p-4 bg-background" ref={scrollAreaRef}>
          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-8 w-48" />
                      </div>
                  </div>
              ))
            ) : messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3 items-start w-full", msg.authorId === user.uid && 'flex-row-reverse')}>
                {msg.authorId !== user.uid && (
                  <button onClick={() => handleAvatarClick(msg.authorId, msg.authorName, msg.authorAvatar)} className="cursor-pointer">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={msg.authorAvatar} alt={msg.authorName} />
                      <AvatarFallback>{msg.authorName?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                )}
                <div className={cn("flex flex-col max-w-[80%]", msg.authorId === user.uid ? 'items-end' : 'items-start')}>
                  <div className={cn("flex items-center gap-2", msg.authorId === user.uid && "flex-row-reverse")}>
                      {msg.authorId !== user.uid && <p className="font-semibold text-sm">{msg.authorName}</p>}
                      <p className="text-xs text-muted-foreground">
                          {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true, locale: es }) : ''}
                      </p>
                  </div>
                  <div className={cn(
                      "mt-1 p-3 rounded-2xl",
                      msg.type === 'text' && (msg.authorId === user.uid ? 'bg-accent text-accent-foreground rounded-br-none' : 'bg-card rounded-bl-none'),
                      msg.type !== 'text' && 'bg-transparent p-0'
                  )}>
                      {renderMessageContent(msg)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <footer className="p-2 border-t bg-card">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(newMessage, 'text'); }} className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" type="button">
                      <Smile className="text-muted-foreground" />
                  </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 mb-2 border-0 bg-transparent shadow-none">
                  <StickerSheet onStickerSelect={onStickerSelect} />
              </PopoverContent>
            </Popover>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              autoComplete="off"
              disabled={isSubmitting}
              className="bg-background focus-visible:ring-offset-0 focus-visible:ring-accent"
            />
            <Button type="submit" size="icon" disabled={isSubmitting || !newMessage.trim()} className="bg-accent hover:bg-accent/80">
              {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
            </Button>
          </form>
        </footer>
      </div>

       {isAdmin && selectedUser && (
            <UserModerationModal 
                isOpen={isModerationModalOpen}
                onClose={() => setIsModerationModalOpen(false)}
                user={selectedUser}
            />
        )}
        
        {!isAdmin && selectedUser && (
            <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Perfil de Usuario</DialogTitle>
                    </DialogHeader>
                     <div className="flex flex-col items-center gap-4 py-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={`https://avatar.vercel.sh/${selectedUser.email}.png`} alt={selectedUser.displayName || 'User'} />
                            <AvatarFallback className="text-3xl">{selectedUser.displayName?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <p className="font-bold text-lg">{selectedUser.displayName}</p>
                    </div>
                </DialogContent>
            </Dialog>
        )}
    </>
  );
}
