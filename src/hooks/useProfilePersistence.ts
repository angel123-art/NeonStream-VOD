import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { restoreActiveProfile } from '@/services/profileStorage';

/**
 * Restores profile session on pageshow / tab visibility — mirrors setupProfilePersistence().
 */
export function useProfilePersistence(): void {
  const currentUser = useAppStore((s) => s.currentUser);
  const userProfiles = useAppStore((s) => s.userProfiles);
  const profileGateOpen = useAppStore((s) => s.profileGateOpen);
  const activateProfile = useAppStore((s) => s.activateProfile);

  useEffect(() => {
    if (!currentUser) return;

    const tryRestore = () => {
      const state = useAppStore.getState();
      if (!state.currentUser) return false;
      if (state.profileGateOpen) return false;

      const restored = restoreActiveProfile(state.userProfiles, state.currentUser.id);
      if (!restored) return false;

      if (state.userProfiles.length > 0 && !state.userProfiles.find((p) => p.id === restored.id)) {
        useAppStore.getState().clearActiveProfile();
        return false;
      }

      activateProfile(restored);
      return true;
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (tryRestore()) {
        console.info('[Perfil] Restaurado tras pageshow', { persisted: event.persisted });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const phase = useAppStore.getState();
      const onProfileGate = !phase.activeProfile || phase.profileGateOpen;
      if (onProfileGate && tryRestore()) {
        console.info('[Perfil] Restaurado al volver a la pestaña');
      }
    };

    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [activateProfile, currentUser, profileGateOpen, userProfiles]);
}
