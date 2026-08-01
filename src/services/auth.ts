import type { AuthResponse, Session, User } from '@supabase/supabase-js';
import {
  getAuthRedirectUrl,
  getPasswordResetRedirectUrl,
  getSupabaseProjectUrl,
  SUPABASE_ANON_KEY,
} from './config';
import { getSupabaseClient } from './supabase';
import type { AuthErrorContext, SupabaseAuthError } from '@/types/auth';

// ── Email normalization ─────────────────────────────────────────────────────

export function normalizeAuthEmail(input: string): string {
  const value = input.trim();
  if (!value) return '';
  return value.toLowerCase();
}

// ── Error mapping ───────────────────────────────────────────────────────────

function getSupabaseKeyType(): string {
  const key = SUPABASE_ANON_KEY.trim();
  if (key.startsWith('sb_publishable_')) return 'publishable';
  if (key.startsWith('eyJ')) return 'anon-jwt';
  return 'desconocido';
}

export function logSupabaseError(context: string, err: SupabaseAuthError, extra: Record<string, unknown> = {}): void {
  console.group(`[Supabase] Error — ${context}`);
  console.error('Mensaje:', err?.message || err);
  console.error('Código:', 'code' in err ? err.code : undefined);
  console.error('URL configurada:', getSupabaseProjectUrl());
  console.error('Tipo de clave:', getSupabaseKeyType());
  if (Object.keys(extra).length) console.error('Contexto extra:', extra);
  console.error('Objeto completo:', err);
  console.groupEnd();
}

export function getAuthErrorMessage(err: SupabaseAuthError, context: AuthErrorContext = 'auth'): string {
  const msg = err?.message || String(err);
  logSupabaseError(context, err);

  if (/failed to fetch|networkerror|network request failed|load failed|err_name_not_resolved|enotfound|getaddrinfo/i.test(msg)) {
    return [
      'Error de red: no se pudo contactar Supabase.',
      `URL actual: ${getSupabaseProjectUrl()}`,
      'Revisa en Supabase Dashboard → Settings → API que la Project URL sea exactamente esa.',
      'Si usas sb_publishable_ y sigue fallando, prueba con la clave anon (JWT eyJ...) de Legacy API Keys.',
      `Detalle: ${msg}`,
    ].join(' ');
  }

  if (/invalid api key|invalid jwt|unauthorized/i.test(msg)) {
    return 'Clave API inválida. Copia la Publishable key o la anon key (JWT) desde Supabase → Settings → API Keys.';
  }

  if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
  if (/email not confirmed/i.test(msg)) return 'Confirma tu correo antes de iniciar sesión.';
  if (/user already registered|already been registered/i.test(msg)) {
    return 'Este correo ya está registrado. Inicia sesión.';
  }
  if (/signup is disabled/i.test(msg)) return 'El registro está deshabilitado en Supabase Auth.';
  if (/rate limit|too many requests/i.test(msg)) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  if (/email.*invalid|invalid email/i.test(msg)) return 'Introduce un correo electrónico válido.';

  return msg || 'Error de autenticación desconocido.';
}

export function getPasskeyErrorMessage(err: SupabaseAuthError): string {
  const msg = err?.message || String(err);
  const code = 'code' in err ? String(err.code) : '';

  if ('name' in err && err.name === 'NotAllowedError') {
    return 'Operación cancelada. Puedes intentarlo de nuevo cuando quieras.';
  }
  if (/not allowed|cancel/i.test(msg)) {
    return 'Operación cancelada. Puedes intentarlo de nuevo cuando quieras.';
  }
  if (/passkey_disabled/i.test(code) || /passkey_disabled/i.test(msg)) {
    return 'Las llaves de acceso no están habilitadas en Supabase para este dominio.';
  }
  if (/webauthn_credential_not_found/i.test(code) || /webauthn_credential_not_found/i.test(msg)) {
    return 'No hay una llave de acceso registrada. Crea tu cuenta y regístrala primero.';
  }
  if (/webauthn_credential_exists/i.test(code) || /webauthn_credential_exists/i.test(msg)) {
    return 'Esta llave de acceso ya está registrada en tu cuenta.';
  }
  if (/too_many_passkeys/i.test(code) || /too_many_passkeys/i.test(msg)) {
    return 'Has alcanzado el límite de llaves de acceso permitidas.';
  }
  if (/webauthn_verification_failed/i.test(code) || /webauthn_verification_failed/i.test(msg)) {
    return 'No se pudo verificar la llave de acceso. Inténtalo de nuevo.';
  }

  return getAuthErrorMessage(err, 'passkey');
}

// ── Passkey helpers ─────────────────────────────────────────────────────────

interface PasskeyAuth {
  signInWithPasskey?: () => Promise<AuthResponse>;
  registerPasskey?: () => Promise<{ data: { id?: string } | null; error: SupabaseAuthError | null }>;
}

export function isPasskeySupported(): boolean {
  return (
    window.isSecureContext
    && typeof window.PublicKeyCredential !== 'undefined'
    && typeof navigator?.credentials?.create === 'function'
    && typeof navigator?.credentials?.get === 'function'
  );
}

export function isPasskeyAvailable(): boolean {
  const client = getSupabaseClient();
  if (!client || !isPasskeySupported()) return false;
  const auth = client.auth as typeof client.auth & PasskeyAuth;
  return typeof auth.signInWithPasskey === 'function' && typeof auth.registerPasskey === 'function';
}

// ── Auth operations ─────────────────────────────────────────────────────────

export async function signInWithPassword(email: string, password: string): Promise<{ user: User; session: Session }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    logSupabaseError('signInWithPassword', error, { email });
    throw error;
  }
  if (!data.user || !data.session) throw new Error('Respuesta de inicio de sesión incompleta.');
  return { user: data.user, session: data.session };
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ user: User | null; session: Session | null; needsEmailConfirmation: boolean }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');

  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    logSupabaseError('signUp', error, { email });
    throw error;
  }

  return {
    user: data.user,
    session: data.session,
    needsEmailConfirmation: !data.session,
  };
}

export async function resetPasswordForEmail(email: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');

  const redirectTo = getPasswordResetRedirectUrl();
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    logSupabaseError('resetPasswordForEmail', error, { email });
    throw error;
  }
}

export async function signInWithPasskey(): Promise<User> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  if (!isPasskeyAvailable()) {
    throw new Error('Tu navegador o este entorno no admite llaves de acceso.');
  }

  const auth = client.auth as typeof client.auth & PasskeyAuth;
  const { data, error } = await auth.signInWithPasskey!();

  if (error) {
    logSupabaseError('signInWithPasskey', error);
    throw error;
  }
  if (!data.user) throw new Error('No se pudo obtener el usuario tras Passkey.');
  return data.user;
}

export async function registerWithPasskey(
  email: string,
  password: string,
): Promise<{ needsEmailConfirmation: boolean; passkeyRegistered: boolean }> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no está configurado.');
  if (!isPasskeyAvailable()) {
    throw new Error('Tu navegador o este entorno no admite llaves de acceso.');
  }

  const redirectTo = getAuthRedirectUrl();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    logSupabaseError('signUp (passkey flow)', error, { email });
    throw error;
  }

  if (!data.session) {
    return { needsEmailConfirmation: true, passkeyRegistered: false };
  }

  const auth = client.auth as typeof client.auth & PasskeyAuth;
  const { error: passkeyError } = await auth.registerPasskey!();

  if (passkeyError) {
    logSupabaseError('registerPasskey', passkeyError, { email });
    throw passkeyError;
  }

  return { needsEmailConfirmation: false, passkeyRegistered: true };
}

export async function signOutUser(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.auth.signOut();
  if (error) logSupabaseError('signOut', error);
}

export function getSupabaseConfigError(): string | null {
  const client = getSupabaseClient();
  if (!client) {
    return 'No se pudo inicializar Supabase. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.';
  }
  return null;
}
