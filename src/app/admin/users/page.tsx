import { UserManagementTable } from '@/components/admin/UserManagementTable';

export default function UsersPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-headline font-bold mb-8">User Management</h1>
      <div className="max-w-6xl mx-auto">
        <UserManagementTable />
      </div>
    </div>
  );
}
