import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, LoaderCircle } from "lucide-react";
import { authService } from "@/services/authService";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Route guard that verifies backend session before rendering children.
 * Redirects to /login if unauthenticated.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const [, setLocation] = useLocation();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const user = await authService.verify();
      if (cancelled) return;
      if (user) {
        setAuthenticated(true);
      } else {
        setLocation("/login");
      }
      setChecking(false);
    }
    check();
    return () => { cancelled = true; };
  }, [setLocation]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f9f5] text-[#153a2f] gap-4">
        <div className="relative">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#173f34] text-[#bceecb] shadow-lg">
            <ShieldCheck size={30} />
          </div>
          <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-white shadow-md">
            <LoaderCircle size={16} className="animate-spin text-[#173f34]" />
          </div>
        </div>
        <p className="text-sm font-medium text-[#4b695b]">Memverifikasi sesi Anda…</p>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
