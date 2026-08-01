import { useAppPhase } from './store/useAppStore';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import { useProfilePersistence } from '@/hooks/useProfilePersistence';
import { AppBootLoader } from '@/components/ui/AppBootLoader';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { LandingGate } from '@/features/landing/LandingGate';
import { AuthGate } from '@/features/auth/AuthGate';
import { ProfileGate } from '@/features/profiles/ProfileGate';
import { MainCatalog } from '@/features/catalog/MainCatalog';
import styles from './App.module.scss';

/**
 * Root orchestrator — declarative replacement for imperative gate show/hide
 * previously spread across boot.js, landing.js, auth.js and profiles.js.
 *
 * Phase machine:
 *   booting  → AppBootLoader (anti-flicker splash)
 *   landing  → LandingGate   (no session)
 *   auth     → AuthGate      (authIntent from landing CTA)
 *   profiles → ProfileGate   (session, no activeProfile)
 *   catalog  → MainCatalog   (session + activeProfile)
 */
export default function App() {
  useAuthBootstrap();
  useProfilePersistence();
  const phase = useAppPhase();

  return (
    <div className={styles.root} data-phase={phase}>
      {phase === 'booting' && <AppBootLoader />}
      {phase === 'landing' && <LandingGate />}
      {phase === 'auth' && <AuthGate />}
      {phase === 'profiles' && <ProfileGate />}
      {phase === 'catalog' && <MainCatalog />}
      <ToastContainer />
    </div>
  );
}
