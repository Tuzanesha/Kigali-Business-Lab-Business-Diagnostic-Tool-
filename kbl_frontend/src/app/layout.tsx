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
        toastOptions={{

          duration: 3000,


          style: {
            background: '#1168d9', 
            color: '#fff',          
            fontFamily: "'Inter', sans-serif", 
            borderRadius: '0.5rem', 
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 
          },


          success: {
            duration: 2000, 
            iconTheme: {
              primary: '#10b981', 
              secondary: '#fff',   
            },
          },
          

          error: {
            duration: 4000, 
            iconTheme: {
              primary: '#ef4444', 
              secondary: '#fff',   
            },
          },
          

          loading: {
             iconTheme: {
              primary: '#1168d9', 
              secondary: '#e0f2fe', 
            },
          },
        }}
      />
      
        {children}
      </body>
    </html>
  );
}