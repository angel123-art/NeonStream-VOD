import type { AuthError } from '@supabase/supabase-js';
import type { AuthMode } from './supabase';

export type AuthErrorContext =
  | 'auth'
  | 'signIn'
  | 'signUp'
  | 'resetPassword'
  | 'passkey'
  | 'signInWithPasskey'
  | 'signUp (passkey flow)'
  | 'registerPasskey';

export interface AuthFormValues {
  email: string;
  password: string;
}

export interface AuthFormSubmitResult {
  success: boolean;
  message?: string;
  switchToLogin?: boolean;
}

export interface AuthUiCopy {
  title: string;
  submitLabel: string;
  hint: string;
  passwordAutocomplete: 'current-password' | 'new-password';
  showPassword: boolean;
  showForgotBtn: boolean;
  showToggle: boolean;
  showForgotBack: boolean;
}

export function getAuthUiCopy(mode: AuthMode, loading: boolean): AuthUiCopy {
  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';

  let submitLabel = 'Iniciar sesión';
  if (isForgot) submitLabel = 'Enviar enlace de recuperación';
  else if (isRegister) submitLabel = 'Registrarse';
  if (loading) submitLabel = 'Procesando...';

  let title = 'Iniciar sesión';
  if (isForgot) title = 'Restablecer contraseña';
  else if (isRegister) title = 'Registrarse';

  let hint = 'Usa el correo electrónico con el que te registraste.';
  if (isForgot) hint = 'Te enviaremos un enlace para restablecer tu contraseña.';
  else if (isRegister) {
    hint = 'Al registrarte aceptas nuestros Términos de uso y Política de privacidad.';
  }

  return {
    title,
    submitLabel,
    hint,
    passwordAutocomplete: isRegister ? 'new-password' : 'current-password',
    showPassword: !isForgot,
    showForgotBtn: isLogin,
    showToggle: !isForgot,
    showForgotBack: isForgot,
  };
}

export type SupabaseAuthError = AuthError | Error | { message?: string; code?: string; name?: string };
