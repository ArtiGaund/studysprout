import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '../context/AuthProvider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from "@/lib/providers/next-theme-provider";
import { UserProvider } from '@/lib/providers/user-provider';
import ReduxProvider from '@/lib/providers/redux-provider';
import { ModalProvider } from '@/context/ModalProvider';
// import { ThemeProvider } from "next-themes"



const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "StudySprout",
  description: "Note taking app",
  icons: {
    icon: "/public/images/tab_logo.png", 
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
         <script
          dangerouslySetInnerHTML={{
            __html: `
              if (!document.documentElement.classList.contains("dark")) {
                document.documentElement.classList.add("dark");
              }
            `,
          }}
        />
      </head>
      <AuthProvider>
        <ModalProvider>
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
        </ModalProvider>
      </AuthProvider>
    </html>
  );
}
