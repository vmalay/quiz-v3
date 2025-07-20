import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { trpc } from '@/lib/trpc';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quiz Battle - Real-time Multiplayer Trivia',
  description: 'Compete in real-time multiplayer quiz battles',
};

function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  );
}

export default trpc.withTRPC(RootLayout);