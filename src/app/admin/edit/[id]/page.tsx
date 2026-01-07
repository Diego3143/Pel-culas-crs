import { EditForm } from '@/components/admin/EditForm';

export default function EditPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Content</h1>
      <div className="max-w-4xl mx-auto">
        <EditForm contentId={id} />
      </div>
    </div>
  );
}
