'use client';

import Link from 'next/link';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between py-6 gap-4">
        <div className="flex-shrink-0">
          <Logo />
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <Link href="/series" className="hover:text-foreground">Series</Link>
          <Link href="/movies" className="hover:text-foreground">Movies</Link>
          <Link href="/terms" className="hover:text-foreground">Términos y Condiciones</Link>
        </nav>
        <div className="text-center text-sm text-muted-foreground mt-4 sm:mt-0">
          <p>&copy; {new Date().getFullYear()} DramaWave. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
