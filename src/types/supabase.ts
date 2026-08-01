import type { User, Session, AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js';

export type { User, Session, AuthChangeEvent, SupabaseClient };

/** Minimal user shape stored in global state. */
export interface SupabaseUser {
  id: string;
  email: string | undefined;
  email_confirmed_at: string | undefined;
  created_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
}

export function mapSupabaseUser(user: User): SupabaseUser {
  return {
    id: user.id,
    email: user.email,
    email_confirmed_at: user.email_confirmed_at,
    created_at: user.created_at,
    app_metadata: user.app_metadata ?? {},
    user_metadata: user.user_metadata ?? {},
  };
}

export type AuthMode = 'login' | 'register' | 'forgot';
