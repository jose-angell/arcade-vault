"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionUser } from "@/lib/games";

interface SessionContextValue {
  user: SessionUser | null;
  signIn: (user: SessionUser) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// Sesión simulada solo en memoria: recargar la página la pierde.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  const signIn = useCallback((next: SessionUser) => setUser(next), []);
  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, signIn, signOut }),
    [user, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>");
  }
  return ctx;
}
