"use client";

import { useRequireAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingBlock } from "@/components/ui/spinner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = useRequireAuth();

  if (auth.isLoading || !auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="Verificando sesión..." />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
