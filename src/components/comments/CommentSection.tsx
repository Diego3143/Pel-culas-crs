'use client';
import { useState, useEffect } from 'react';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Comment } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Image from 'next/image';

interface CommentSectionProps {
    contentId: string;
}

export function CommentSection({ contentId }: CommentSectionProps) {
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
                    }))
                    .sort((a, b) => b.timestamp - a.timestamp); // Sort descending
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
                ) : comments.length > 0 ? (
                    <div className="space-y-6">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-4 items-start">
                                <Avatar>
                                    <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                                    <AvatarFallback>{comment.authorName?.[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{comment.authorName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                    {renderContent(comment)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center">No hay comentarios todavía. ¡Sé el primero!</p>
                )}
            </CardContent>
        </Card>
    )
}
