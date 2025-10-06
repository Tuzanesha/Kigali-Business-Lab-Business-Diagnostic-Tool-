import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css'; 
import { cn } from '@/lib/utils';

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
        {children}
      </body>
    </html>
  );
}