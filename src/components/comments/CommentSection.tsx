'use client';
import { useState, useEffect, useMemo } from 'react';
import { ref, onValue, query, orderByChild, remove, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Comment, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';
import { Button } from '../ui/button';
import { CornerDownRight, MessageCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { UserModerationModal } from '../admin/UserModerationModal';

interface CommentSectionProps {
    contentId: string;
    onReply: (comment: Comment) => void;
}

const CommentItem = ({ comment, allComments, contentId, onReply, isReply = false }: { comment: Comment, allComments: Comment[], contentId: string, onReply: (comment: Comment) => void, isReply?: boolean }) => {
    const { user, isAdmin } = useAuth();
    const { toast } = useToast();
    const [repliesVisible, setRepliesVisible] = useState(false);
    const [isModerationModalOpen, setIsModerationModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const hasReplies = comment.replies && comment.replies.length > 0;
    
    const renderContent = (comment: Comment) => {
        switch (comment.type) {
            case 'emoji':
                return <p className="text-5xl">{comment.content}</p>;
            case 'image':
                return <Image src={comment.content} alt="sticker" width={100} height={100} className="rounded-md object-contain mt-2" />;
            case 'text':
            default:
                return <p className="text-foreground/80 mt-1 whitespace-pre-wrap">{comment.content}</p>;
        }
    }
    
    const handleDelete = async () => {
        try {
            const commentRef = ref(db, `comments/${contentId}/${comment.id}`);
            await remove(commentRef);

            const repliesToDelete = allComments.filter(c => c.parentId === comment.id);
            for (const reply of repliesToDelete) {
                const replyRef = ref(db, `comments/${contentId}/${reply.id}`);
                await remove(replyRef);
                const nestedReplies = allComments.filter(c => c.parentId === reply.id);
                 for (const nestedReply of nestedReplies) {
                     const nestedReplyRef = ref(db, `comments/${contentId}/${nestedReply.id}`);
                     await remove(nestedReplyRef);
                 }
            }

            toast({
                title: "Comentario eliminado",
                description: "El comentario y sus respuestas han sido eliminados."
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo eliminar el comentario."
            });
        }
    };

    const handleAvatarClick = async () => {
        if (!isAdmin) return;

        try {
            const userRef = ref(db, `users/${comment.authorId}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                setSelectedUser({
                    uid: comment.authorId,
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
    }
    
    return (
      <>
        <div className="flex gap-4 items-start">
            <button onClick={handleAvatarClick} disabled={!isAdmin} className={isAdmin ? 'cursor-pointer' : 'cursor-default'}>
                <Avatar>
                    <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                    <AvatarFallback>{comment.authorName?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
            </button>
            <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold max-w-48 truncate" title={comment.authorName}>{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: es })}
                    </p>
                </div>
                {renderContent(comment)}
                 <div className="mt-1 -ml-3 flex items-center">
                    {user && (
                      <>
                        {hasReplies ? (
                           <Button variant="ghost" size="sm" onClick={() => setRepliesVisible(!repliesVisible)}>
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {repliesVisible ? 'Ocultar' : `Ver ${comment.replies!.length} ${comment.replies!.length > 1 ? 'respuestas' : 'respuesta'}`}
                           </Button>
                        ) : !isReply && ( 
                           <Button variant="ghost" size="sm" onClick={() => onReply(comment)}>
                                <CornerDownRight className="h-4 w-4 mr-1" />
                                Responder
                            </Button>
                        )}
                         {isReply && (
                            <Button variant="ghost" size="sm" onClick={() => onReply(comment)}>
                                <CornerDownRight className="h-4 w-4 mr-1" />
                                Responder
                            </Button>
                        )}
                      </>
                    )}
                    {isAdmin && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Eliminar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este comentario?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará el comentario y todas sus respuestas de forma permanente.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80">Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        </div>
         {hasReplies && repliesVisible && (
            <div className="pl-8 pt-4 border-l-2 border-border ml-5 mt-4 space-y-4">
                {comment.replies!.map(reply => (
                    <CommentItem key={reply.id} comment={reply} allComments={allComments} contentId={contentId} onReply={onReply} isReply={true}/>
                ))}
            </div>
        )}
        {selectedUser && (
            <UserModerationModal 
                isOpen={isModerationModalOpen}
                onClose={() => setIsModerationModalOpen(false)}
                user={selectedUser}
            />
        )}
      </>
    )
};


export function CommentSection({ contentId, onReply }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!contentId) return;

        const commentsRef = query(ref(db, `comments/${contentId}`), orderByChild('timestamp'));
        
        const unsubscribe = onValue(commentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const commentsList: Comment[] = Object.keys(data)
                    .map(key => ({
                        id: key,
                        ...data[key]
                    }));
                setComments(commentsList);
            } else {
                setComments([]);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching comments:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [contentId]);

    const nestedComments = useMemo(() => {
        const commentMap: { [key: string]: Comment } = {};
        comments.forEach(comment => {
            comment.replies = [];
            commentMap[comment.id] = comment;
        });

        const nested: Comment[] = [];
        comments.forEach(comment => {
            if (comment.parentId && commentMap[comment.parentId]) {
                commentMap[comment.parentId].replies?.push(comment);
                commentMap[comment.parentId].replies?.sort((a,b) => a.timestamp - b.timestamp);
            } else {
                nested.push(comment);
            }
        });
        
        return nested.sort((a, b) => b.timestamp - a.timestamp);
    }, [comments]);


    return (
        <Card>
            <CardHeader>
                <CardTitle>Comentarios</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-6 w-3/4" />
                            </div>
                        </div>
                         <div className="flex gap-4 items-start">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-6 w-1/2" />
                            </div>
                        </div>
                    </div>
                ) : nestedComments.length > 0 ? (
                    <div className="space-y-6">
                        {nestedComments.map(comment => (
                            <CommentItem key={comment.id} comment={comment} allComments={comments} contentId={contentId} onReply={onReply} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center">No hay comentarios todavía. ¡Sé el primero!</p>
                )}
            </CardContent>
        </Card>
    )
}
