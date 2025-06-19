import type { Metadata } from 'next';
import { AppContextProvider } from '@/app/context/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/Header';
import MainLayoutContent from '@/components/MainLayoutContent';
import './globals.css';

export const metadata: Metadata = {
  title: 'School Worksheet Generator',
  description: 'Generate practice problems from worksheet images.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppContextProvider>
          <MainLayoutContent>
            {children}
          </MainLayoutContent>
          <Toaster />
        </AppContextProvider>
      </body>
    </html>
  );
}
