'use client';

import { UserProvider } from "@/lib/providers/user-provider";
import React from "react";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <UserProvider>
            {children}
        </UserProvider>
    )
}
