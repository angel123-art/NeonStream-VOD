import styles from './AppBootLoader.module.scss';

const NETFLIX_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg';

export function AppBootLoader() {
  return (
    <div className={styles.loader} role="status" aria-live="polite" aria-label="Cargando Netflix">
      <img className={styles.logo} src={NETFLIX_LOGO} alt="Netflix" width={167} height={45} />
      <div className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
