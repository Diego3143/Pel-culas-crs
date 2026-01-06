import { UploadForm } from '@/components/admin/UploadForm';

export default function UploadPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Upload New Content</h1>
      <div className="max-w-4xl mx-auto">
        <UploadForm />
      </div>
    </div>
  );
}
