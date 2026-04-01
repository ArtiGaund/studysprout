/** 
 * ROOT LAYOUT (Studysprout)
 * -------------------------
 * This is the entry point of the React component tree.
 * It initialize all Global Context Providers required for:
 * - Authentication (NextAuth)
 * - State Management (Redux)
 * - Real-time Communication (Socket.io)
 * - UI/Theming (Dark Mode & Radix UI) 
 */


import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Context & State Providers
import AuthProvider from '../context/AuthProvider';
import { ThemeProvider } from "@/lib/providers/next-theme-provider";
import ReduxProvider from '@/lib/providers/redux-provider';
import { ModalProvider } from '@/context/ModalProvider';
import { SocketProvider } from '@/lib/providers/socket-provider';

// UI Components
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "StudySprout",
  description: "Note taking app",
  icons: {
    icon: "/images/tab_logo.png", 
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* INLINE SCRIPT: Prevents "Flicker of Unstyled Content" (FOUC) by enforcing dark mode
        before the page paints. */}
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
      {/* PROVIDER HIERARCHY:
        1. AuthProvider: Top level for session management.
        2. ModalProvider: Controls global UI overlays.
        3. ReduxProvider: Global application state.
        4. ThemeProvider: Handles Dark/light mode switching.
        5. SocketProvider: Maintains persistent Websocket connection.
      */}
      <AuthProvider>
        <ModalProvider>
        <body className={inter.className} >
        <ReduxProvider>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <SocketProvider>
            {children}
          </SocketProvider>
        </ThemeProvider>
        </ReduxProvider>
          <Toaster />
        </body>
        </ModalProvider>
      </AuthProvider>
    </html>
  );
}
