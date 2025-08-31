import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { ErrorBoundary } from '@/components/error-boundaries';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Quiz Battle - Real-time Multiplayer Trivia',
  description: 'Compete in real-time multiplayer quiz battles',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary 
          level="global"
          onError={(error, errorInfo, errorId) => {
            // Report to error tracking service
            console.error('Global Error Boundary:', { error, errorInfo, errorId });
          }}
        >
          <Providers>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              {children}
            </div>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}