'use client';

import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useState } from "react";
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";

type Sticker = {
    id: string;
    type: 'image' | 'emoji';
    value: string;
};

interface StickerSheetProps {
  onStickerSelect: (stickerValue: string, stickerType: 'image' | 'emoji') => void;
}

export function StickerSheet({ onStickerSelect }: StickerSheetProps) {
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stickersRef = ref(db, 'stickers');
        const unsubscribe = onValue(stickersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const stickerList: Sticker[] = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                }));
                setStickers(stickerList);
            } else {
                setStickers([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

  return (
    <div className="bg-popover border rounded-lg shadow-lg">
        <h3 className="text-sm font-medium text-center p-2 border-b text-popover-foreground">Elige un Sticker</h3>
        <ScrollArea className="h-48">
            {loading ? (
                 <div className="grid grid-cols-4 gap-4 p-4">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-16" />)}
                 </div>
            ) : stickers.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 p-2">
                    {stickers.map(sticker => (
                        <button
                            key={sticker.id}
                            onClick={() => onStickerSelect(sticker.value, sticker.type)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors duration-200 flex items-center justify-center h-20"
                        >
                           {sticker.type === 'image' ? (
                             <Image src={sticker.value} alt="sticker" width={60} height={60} className="object-contain" />
                           ) : (
                             <span className="text-4xl">{sticker.value}</span>
                           )}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-center text-muted-foreground p-4">No hay stickers disponibles.</p>
            )}
        </ScrollArea>
    </div>
  );
}
