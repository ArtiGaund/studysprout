/**
 * @provider AuthProvider
 * @description Client-side wrapper for NextAuth session management. 
 * Configured to maintain session synchronization across window focuses 
 * and periodically refresh the session every 5 minutes.
 */
'use client';

import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider
    refetchOnWindowFocus={true} // Re-validates session when user returns to the tab
    refetchInterval={5 * 60}  // 5-minute background refresh (300 seconds)
    >
      {children}
    </SessionProvider>
  );
}