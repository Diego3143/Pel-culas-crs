import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="font-headline text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
      Drama<span className="text-accent">Wave</span>
    </Link>
  );
}
