import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css'; 
import { cn } from '@/lib/utils';
import { Toaster } from 'react-hot-toast';

const fontRoboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'KBL Business Lab',
  description: 'Business Diagnostic Tool',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=bebas-kai@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontRoboto.variable
        )}
      >
        <Toaster 
          position="top-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{
            top: '1rem',
          }}
          toastOptions={{
            // Default duration for all toasts
            duration: 3000,
            
            // Default style
            style: {
              background: '#fff',
              color: '#012f53',
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              borderRadius: '0.5rem',
              padding: '12px 16px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              maxWidth: 'calc(100vw - 2rem)',
              width: 'auto',
              border: '1px solid #e2e8f0',
            },

            // Success toast styling
            success: {
              duration: 2500,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #10b981',
              },
            },
            
            // Error toast styling
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #ef4444',
              },
            },
            
            // Loading toast styling
            loading: {
              duration: Infinity, // Loading toasts should be manually dismissed
              iconTheme: {
                primary: '#0179d2',
                secondary: '#e0f2fe',
              },
              style: {
                background: '#eff6ff',
                color: '#012f53',
                border: '1px solid #0179d2',
              },
            },
            
            // Promise toast styling (for toast.promise)
            blank: {
              duration: 3000,
            },
          }}
        />
        
        {children}
      </body>
    </html>
  );
}