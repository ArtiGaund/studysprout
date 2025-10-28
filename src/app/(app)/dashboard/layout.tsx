'use client';

import { RevisionSidebarProvider } from "@/lib/providers/revision-sidebar-provider";
import ProtectedLayout from "../protected-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedLayout>
        <RevisionSidebarProvider>
            {children}
        </RevisionSidebarProvider>
        </ProtectedLayout>;
}

