import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  getAuthErrorMessage,
  getPasskeyErrorMessage,
  getSupabaseConfigError,
  isPasskeyAvailable,
  normalizeAuthEmail,
  registerWithPasskey,
  resetPasswordForEmail,
  signInWithPasskey,
  signInWithPassword,
  signUpWithPassword,
} from '@/services/auth';
import { validateSupabaseConfig } from '@/services/supabase';
import type { SupabaseAuthError } from '@/types/auth';

interface UseAuthFormReturn {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  error: string | null;
  success: string | null;
  loading: boolean;
  passkeyLoading: boolean;
  passkeyAvailable: boolean;
  clearMessages: () => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  handleToggleMode: () => void;
  handleForgotMode: () => void;
  handleReturnToLogin: () => void;
  handlePasskeySignIn: () => Promise<void>;
  handlePasskeyRegister: () => Promise<void>;
}

export function useAuthForm(): UseAuthFormReturn {
  const authMode = useAppStore((s) => s.authMode);
  const authPrefillEmail = useAppStore((s) => s.authPrefillEmail);
  const setAuthMode = useAppStore((s) => s.setAuthMode);
  const clearAuthPrefillEmail = useAppStore((s) => s.clearAuthPrefillEmail);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyAvailable, setPasskeyAvailable] = useState(false);

  const prefillAppliedRef = useRef(false);

  useEffect(() => {
    setPasskeyAvailable(isPasskeyAvailable());
  }, []);

  useEffect(() => {
    if (authPrefillEmail && !prefillAppliedRef.current) {
      setEmail(authPrefillEmail);
      prefillAppliedRef.current = true;
      clearAuthPrefillEmail();
    }
  }, [authPrefillEmail, clearAuthPrefillEmail]);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [authMode]);

  useEffect(() => {
    const configError = getSupabaseConfigError();
    if (configError) {
      setError(configError);
      return;
    }
    const issues = validateSupabaseConfig();
    if (issues.length) setError(issues.join(' '));
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const validateEmail = useCallback((normalized: string, requiredMessage: string): boolean => {
    if (!normalized) {
      setError(requiredMessage);
      return false;
    }
    if (!normalized.includes('@')) {
      setError('Introduce un correo electrónico válido.');
      return false;
    }
    return true;
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      clearMessages();

      const configError = getSupabaseConfigError();
      if (configError) {
        setError(configError);
        return;
      }

      const normalizedEmail = normalizeAuthEmail(email);
      if (!normalizedEmail) {
        setError('Introduce tu correo electrónico.');
        return;
      }

      if (authMode === 'forgot') {
        if (!validateEmail(normalizedEmail, 'Introduce tu correo electrónico.')) return;

        setLoading(true);
        try {
          await resetPasswordForEmail(normalizedEmail);
          setSuccess('Te enviamos un enlace de recuperación a tu correo. Revisa tu bandeja de entrada.');
        } catch (err) {
          setError(getAuthErrorMessage(err as SupabaseAuthError, 'resetPassword'));
        } finally {
          setLoading(false);
        }
        return;
      }

      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }

      setLoading(true);
      try {
        if (authMode === 'register') {
          if (!validateEmail(normalizedEmail, 'Para registrarte debes usar un correo electrónico válido.')) {
            setLoading(false);
            return;
          }

          const result = await signUpWithPassword(normalizedEmail, password);
          if (result.needsEmailConfirmation) {
            setSuccess('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
            setAuthMode('login');
          } else {
            setSuccess('¡Cuenta creada! Cargando tus perfiles...');
          }
        } else {
          if (!validateEmail(normalizedEmail, 'Introduce un correo electrónico válido.')) {
            setLoading(false);
            return;
          }
          await signInWithPassword(normalizedEmail, password);
        }
      } catch (err) {
        setError(
          getAuthErrorMessage(
            err as SupabaseAuthError,
            authMode === 'register' ? 'signUp' : 'signIn',
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [authMode, clearMessages, email, password, setAuthMode, validateEmail],
  );

  const handleToggleMode = useCallback(() => {
    if (authMode === 'forgot') return;
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    clearMessages();
  }, [authMode, clearMessages, setAuthMode]);

  const handleForgotMode = useCallback(() => {
    setAuthMode('forgot');
    clearMessages();
  }, [clearMessages, setAuthMode]);

  const handleReturnToLogin = useCallback(() => {
    setAuthMode('login');
    clearMessages();
  }, [clearMessages, setAuthMode]);

  const handlePasskeySignIn = useCallback(async () => {
    clearMessages();
    const configError = getSupabaseConfigError();
    if (configError) {
      setError(configError);
      return;
    }
    if (!passkeyAvailable) {
      setError('Tu navegador o este entorno no admite llaves de acceso. Usa HTTPS y un navegador compatible.');
      return;
    }

    setPasskeyLoading(true);
    try {
      await signInWithPasskey();
      setSuccess('Sesión iniciada con llave de acceso.');
    } catch (err) {
      setError(getPasskeyErrorMessage(err as SupabaseAuthError));
    } finally {
      setPasskeyLoading(false);
    }
  }, [clearMessages, passkeyAvailable]);

  const handlePasskeyRegister = useCallback(async () => {
    clearMessages();
    const configError = getSupabaseConfigError();
    if (configError) {
      setError(configError);
      return;
    }
    if (!passkeyAvailable) {
      setError('Tu navegador o este entorno no admite llaves de acceso. Usa HTTPS y un navegador compatible.');
      return;
    }

    const normalizedEmail = normalizeAuthEmail(email);
    if (!normalizedEmail) {
      setError('Introduce tu correo electrónico para crear la cuenta.');
      return;
    }
    if (!normalizedEmail.includes('@')) {
      setError('Introduce un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres para registrar tu cuenta.');
      return;
    }

    setPasskeyLoading(true);
    try {
      const result = await registerWithPasskey(normalizedEmail, password);
      if (result.needsEmailConfirmation) {
        setSuccess(
          'Confirma tu correo electrónico. Después podrás registrar una llave de acceso al iniciar sesión.',
        );
        setAuthMode('login');
      } else if (result.passkeyRegistered) {
        setSuccess('¡Cuenta creada y llave de acceso registrada! Cargando tus perfiles...');
      }
    } catch (err) {
      setError(getPasskeyErrorMessage(err as SupabaseAuthError));
    } finally {
      setPasskeyLoading(false);
    }
  }, [clearMessages, email, passkeyAvailable, password, setAuthMode]);

  return {
    email,
    password,
    setEmail,
    setPassword,
    error,
    success,
    loading,
    passkeyLoading,
    passkeyAvailable,
    clearMessages,
    handleSubmit,
    handleToggleMode,
    handleForgotMode,
    handleReturnToLogin,
    handlePasskeySignIn,
    handlePasskeyRegister,
  };
}
