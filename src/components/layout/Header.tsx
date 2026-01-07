'use client';

import { signOut } from 'firebase/auth';
import { LayoutGrid, LogOut, PlusCircle, User as UserIcon, Menu, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from './Logo';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

export function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isWatchPage = pathname.startsWith('/watch/');

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const MobileNav = () => {
    if (isWatchPage) {
      return (
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Go back</span>
        </Button>
      );
    }
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full max-w-xs p-0">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
               <Logo />
            </div>
            <nav className="flex flex-col gap-4 p-4 text-lg font-medium">
              <SheetClose asChild>
                <Link href="/" className="text-foreground/80 hover:text-foreground">Home</Link>
              </SheetClose>
              <SheetClose asChild>
               <Link href="/series" className="text-foreground/80 hover:text-foreground">Series</Link>
              </SheetClose>
              <SheetClose asChild>
                <Link href="/movies" className="text-foreground/80 hover:text-foreground">Movies</Link>
              </SheetClose>
            </nav>
            <div className="mt-auto p-4 border-t">
              {loading ? (
                 <Skeleton className="h-10 w-full" />
              ) : !user ? (
                <div className="flex flex-col gap-2">
                   <SheetClose asChild>
                      <Button variant="outline" asChild><Link href="/login">Login</Link></Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild><Link href="/signup">Sign Up</Link></Button>
                    </SheetClose>
                </div>
              ) : null}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10 items-center">
          <div className="md:hidden">
            <MobileNav />
          </div>
          <div className="hidden md:flex">
            <Logo />
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link
              href="/"
              className="flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 sm:text-sm"
            >
              Home
            </Link>
            <Link
              href="/series"
              className="flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 sm:text-sm"
            >
              Series
            </Link>
            <Link
              href="/movies"
              className="flex items-center text-lg font-medium text-foreground/60 transition-colors hover:text-foreground/80 sm:text-sm"
            >
              Movies
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {loading ? (
              <Skeleton className="h-8 w-8 rounded-full" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.displayName?.[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user.isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <LayoutGrid className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/upload">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span>Upload Content</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
