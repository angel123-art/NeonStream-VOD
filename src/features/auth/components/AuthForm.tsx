import { useAppStore } from '@/store/useAppStore';
import { getAuthUiCopy } from '@/types/auth';
import { useAuthForm } from '@/hooks/useAuthForm';
import { PasskeySection } from './PasskeySection';
import styles from '../AuthGate.module.scss';

export function AuthForm() {
  const authMode = useAppStore((s) => s.authMode);

  const {
    email,
    password,
    setEmail,
    setPassword,
    error,
    success,
    loading,
    passkeyLoading,
    passkeyAvailable,
    handleSubmit,
    handleToggleMode,
    handleForgotMode,
    handleReturnToLogin,
    handlePasskeySignIn,
    handlePasskeyRegister,
  } = useAuthForm();

  const ui = getAuthUiCopy(authMode, loading);
  const isLogin = authMode === 'login';
  const isRegister = authMode === 'register';
  const isForgot = authMode === 'forgot';
  const passkeyBusy = passkeyLoading || loading;

  return (
    <>
      <h1 id="auth-gate-title" className={styles.title}>{ui.title}</h1>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.label} htmlFor="auth-email">
          Correo electrónico
        </label>
        <input
          id="auth-email"
          type="email"
          className={styles.input}
          placeholder="nombre@ejemplo.com"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {ui.showPassword && (
          <div className={styles.passwordGroup}>
            <label className={styles.label} htmlFor="auth-password">
              Contraseña
            </label>
            <input
              id="auth-password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              autoComplete={ui.passwordAutocomplete}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {ui.showForgotBtn && (
              <button type="button" className={styles.forgotBtn} onClick={handleForgotMode}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className={styles.success} role="status">
            {success}
          </p>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {ui.submitLabel}
        </button>
      </form>

      {passkeyAvailable && (
        <PasskeySection
          isLogin={isLogin}
          isRegister={isRegister}
          isForgot={isForgot}
          loading={passkeyBusy}
          onSignIn={handlePasskeySignIn}
          onRegister={handlePasskeyRegister}
        />
      )}

      {ui.showForgotBack && (
        <button type="button" className={styles.forgotBackBtn} onClick={handleReturnToLogin}>
          ← Volver a iniciar sesión
        </button>
      )}

      {ui.showToggle && (
        <button type="button" className={styles.toggleBtn} onClick={handleToggleMode}>
          {isLogin ? (
            <>¿Primera vez en Netflix? <span>Regístrate ahora</span></>
          ) : (
            <>¿Ya tienes cuenta? <span>Inicia sesión</span></>
          )}
        </button>
      )}

      <p className={styles.hint}>{ui.hint}</p>
    </>
  );
}
