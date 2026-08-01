import { useState, type FormEvent } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { normalizeAuthEmail } from '@/services/auth';
import styles from './LandingGate.module.scss';

const NETFLIX_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg';

export function LandingGate() {
  const openAuth = useAppStore((s) => s.openAuth);
  const [email, setEmail] = useState('');

  const handleGetStarted = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const normalized = normalizeAuthEmail(email);
    openAuth('register', normalized);
  };

  return (
    <div className={styles.gate}>
      <header className={styles.header}>
        <img className={styles.logo} src={NETFLIX_LOGO} alt="Netflix" width={167} height={45} />
        <button type="button" className={styles.signInBtn} onClick={() => openAuth('login')}>
          Iniciar sesión
        </button>
      </header>
      <section className={styles.hero}>
        <h1 className={styles.title}>Películas y series ilimitadas y mucho más.</h1>
        <p className={styles.subtitle}>Disfruta donde quieras. Cancela cuando quieras.</p>
        <p className={styles.ctaText}>
          ¿Quieres ver Netflix ya? Ingresa tu correo para crear o reiniciar tu membresía.
        </p>
        <form className={styles.emailForm} onSubmit={handleGetStarted} noValidate>
          <input
            type="email"
            className={styles.emailInput}
            placeholder="Correo electrónico"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className={styles.ctaBtn}>
            Comenzar <span className={styles.arrow} aria-hidden="true">&gt;</span>
          </button>
        </form>
      </section>
    </div>
  );
}
