'use client';

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Header } from '@/components/layout/Header';
import { Toaster } from '@/components/ui/toaster';
import { Footer } from '@/components/layout/Footer';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { usePathname } from 'next/navigation';

// Metadata can not be exported from a client component.
// We can keep it here, but it won't be used.
// For a real app, we would move this to a server component wrapper
// or handle it in page.tsx files.
// export const metadata: Metadata = {
//   title: 'DramaWave',
//   description: 'Your streaming destination',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isChatPage = pathname === '/chat';

  return (
    <html lang="en" className="dark">
      <head>
        <title>DramaWave</title>
        <meta name="description" content="Your streaming destination" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Permanent+Marker&display=swap" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <AuthProvider>
          {!isChatPage && <Header />}
          <main className="flex-grow">{children}</main>
          {!isChatPage && <Footer />}
          {!isChatPage && <ChatBubble />}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
