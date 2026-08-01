import styles from './HeroSkeleton.module.scss';

export function HeroSkeleton() {
  return (
    <section className={styles.hero} aria-label="Cargando destacado" role="status" aria-live="polite">
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.content}>
        <div className={styles.logo} aria-hidden="true" />
        <div className={styles.overview} aria-hidden="true" />
        <div className={styles.overviewShort} aria-hidden="true" />
        <div className={styles.actions} aria-hidden="true">
          <div className={styles.btnPrimary} />
          <div className={styles.btnSecondary} />
        </div>
      </div>
    </section>
  );
}
