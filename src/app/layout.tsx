import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '../context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from "@/lib/providers/next-theme-provider";
import { UserProvider } from '@/lib/providers/user-provider';
import ReduxProvider from '@/lib/providers/redux-provider';




const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'True Feedback',
  description: 'Real feedback from real people.',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" >
      <AuthProvider>
        <body className={inter.className} >
        <ReduxProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
        </ReduxProvider>
          <Toaster />
        </body>
      </AuthProvider>
    </html>
  );
}
