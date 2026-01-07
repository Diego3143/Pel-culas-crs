import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { List, PlusCircle, Smile } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Upload new movies and series to the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/upload">
                <PlusCircle className="mr-2 h-4 w-4" />
                Upload Content
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>View & Edit Content</CardTitle>
            <CardDescription>Browse and edit existing content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/content-list">
                <List className="mr-2 h-4 w-4" />
                View Content
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sticker Management</CardTitle>
            <CardDescription>Add or remove stickers for comments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/stickers">
                <Smile className="mr-2 h-4 w-4" />
                Manage Stickers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
