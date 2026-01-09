import { StickerManager } from '@/components/admin/StickerManager';

export default function StickersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-headline font-bold mb-8">Manage Stickers</h1>
      <div className="max-w-4xl mx-auto">
        <StickerManager />
      </div>
    </div>
  );
}
