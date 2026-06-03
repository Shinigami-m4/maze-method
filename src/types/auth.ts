import { Session, User } from "@supabase/supabase-js";

export type AuthStatus = "loading" | "unconfigured" | "signed_out" | "signed_in";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthSessionState = {
  isSupabaseConfigured: boolean;
  session: Session | null;
  status: AuthStatus;
  user: User | null;
};

export type CloudAccountSummary = {
  email?: string;
  userId?: string;
  status: AuthStatus;
};

