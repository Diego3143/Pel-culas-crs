import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
      Cine<span className="text-accent">Plus</span>
    </Link>
  );
}
