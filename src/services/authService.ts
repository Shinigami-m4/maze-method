import { AuthCredentials } from "../types/auth";
import { getSupabaseClient } from "./supabaseClient";

function requireSupabaseClient() {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured. Add Expo public Supabase environment variables to enable cloud auth.");
  }

  return client;
}

export async function signInWithEmail({ email, password }: AuthCredentials) {
  const client = requireSupabaseClient();
  return client.auth.signInWithPassword({
    email: email.trim(),
    password
  });
}

export async function signUpWithEmail({ email, password }: AuthCredentials) {
  const client = requireSupabaseClient();
  return client.auth.signUp({
    email: email.trim(),
    password
  });
}

export async function signOutCloudAccount() {
  const client = requireSupabaseClient();
  return client.auth.signOut();
}

export async function requestPasswordResetEmail(email: string) {
  const client = requireSupabaseClient();
  return client.auth.resetPasswordForEmail(email.trim());
}

