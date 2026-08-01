import styles from '../AuthGate.module.scss';

function PasskeyIcon() {
  return (
    <svg
      className={styles.passkeyIcon}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 11c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />
      <path d="M16 11V8a4 4 0 0 0-8 0v3" />
      <rect x="3" y="11" width="18" height="10" rx="2" />
    </svg>
  );
}

interface PasskeySectionProps {
  isLogin: boolean;
  isRegister: boolean;
  isForgot: boolean;
  loading: boolean;
  onSignIn: () => void;
  onRegister: () => void;
}

export function PasskeySection({
  isLogin,
  isRegister,
  isForgot,
  loading,
  onSignIn,
  onRegister,
}: PasskeySectionProps) {
  if (isForgot) return null;

  const hint = isRegister
    ? 'Crea tu cuenta y guarda una llave de acceso en este dispositivo con biometría.'
    : 'Usa Face ID, Touch ID, Windows Hello o tu gestor de contraseñas.';

  return (
    <div className={styles.passkeySection}>
      <div className={styles.divider} aria-hidden="true">
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>o</span>
        <span className={styles.dividerLine} />
      </div>

      {isLogin && (
        <button
          type="button"
          className={styles.passkeyBtn}
          disabled={loading}
          onClick={onSignIn}
        >
          <PasskeyIcon />
          Iniciar sesión con llave de acceso
        </button>
      )}

      {isRegister && (
        <button
          type="button"
          className={styles.passkeyBtn}
          disabled={loading}
          onClick={onRegister}
        >
          <PasskeyIcon />
          Registrarse con llave de acceso
        </button>
      )}

      <p className={styles.passkeyHint}>{hint}</p>
    </div>
  );
}
