"use client";

/**
 * AuthContext — single source of truth for authentication state.
 *
 * Wrap your root layout with <AuthProvider>.
 * Every component calls useAuth() to get { user, loading }.
 *
 * One Supabase subscription lives here; no component ever creates
 * its own, so every part of the UI updates at the exact same time.
 */

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────

interface AuthState {
  /** The logged-in Supabase user, or null when logged out. */
  user: User | null;
  /**
   * True only on the very first render, before we know the session.
   * Use this to avoid showing a "flash" of the wrong UI.
   */
  loading: boolean;
}

// ─── Context ──────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
});

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Step 1 — resolve the current session once on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    // Step 2 — keep state in sync for every future auth event:
    //   SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, etc.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false); // in case the initial getUser hasn't resolved yet
    });

    // Clean up the listener when the provider unmounts
    return () => subscription.unsubscribe();
  }, []); // runs once — the supabase client is stable

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

/**
 * Read auth state anywhere in the component tree.
 *
 * @example
 *   const { user, loading } = useAuth();
 *   if (loading) return <Spinner />;
 *   if (!user) return <p>Please log in.</p>;
 */
export function useAuth(): AuthState {
  return useContext(AuthContext);
}
