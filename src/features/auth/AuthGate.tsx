import { useAppStore } from '@/store/useAppStore';
import { AuthForm } from './components/AuthForm';
import styles from './AuthGate.module.scss';

const NETFLIX_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg';

export function AuthGate() {
  const closeAuth = useAppStore((s) => s.closeAuth);

  return (
    <div className={styles.gate} role="dialog" aria-modal="true" aria-labelledby="auth-gate-title">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.logoBtn}
          onClick={closeAuth}
          aria-label="Volver al inicio"
        >
          <img className={styles.headerLogo} src={NETFLIX_LOGO} alt="Netflix" width={167} height={45} />
        </button>
      </header>

      <div className={styles.inner}>
        <AuthForm />

        <button type="button" className={styles.backLink} onClick={closeAuth}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
