import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { signOutCloudAccount } from "./authService";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { AuthSessionState, AuthStatus } from "../types/auth";

type AuthSessionContextValue = AuthSessionState & {
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(undefined);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? "loading" : "unconfigured");
  const [session, setSession] = useState<AuthSessionState["session"]>(null);

  const refreshSession = useCallback(async () => {
    if (!supabase) {
      setStatus("unconfigured");
      setSession(null);
      return;
    }

    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setStatus(data.session ? "signed_in" : "signed_out");
  }, []);

  useEffect(() => {
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }

    void refreshSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setStatus(nextSession ? "signed_in" : "signed_out");
    });

    return () => data.subscription.unsubscribe();
  }, [refreshSession]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    await signOutCloudAccount();
    await refreshSession();
  }, [refreshSession]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      isSupabaseConfigured,
      refreshSession,
      session,
      signOut,
      status,
      user: session?.user ?? null
    }),
    [refreshSession, session, signOut, status]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider.");
  }

  return context;
}

