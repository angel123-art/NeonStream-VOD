import { useEffect, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { useAppStore } from '@/store/useAppStore';
import { fetchUserProfiles, getSupabaseClient } from '@/services/supabase';
import { restoreActiveProfile } from '@/services/profileStorage';
import { APP_BUILD, BOOT_TIMEOUT_MS, cleanAuthCallbackFromUrl } from '@/services/config';
import { mapSupabaseUser } from '@/types/supabase';
import type { Profile } from '@/types/profile';

/**
 * Bootstraps Supabase auth session and resolves the initial app phase.
 * Replaces initAuth() + resolveBootSession() from js/auth.js + js/boot.js.
 */
export function useAuthBootstrap(): void {
  const bootComplete = useAppStore((s) => s.bootComplete);
  const activeProfile = useAppStore((s) => s.activeProfile);
  const profileGateOpen = useAppStore((s) => s.profileGateOpen);

  const setBootComplete = useAppStore((s) => s.setBootComplete);
  const setBootSessionResolved = useAppStore((s) => s.setBootSessionResolved);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setUserProfiles = useAppStore((s) => s.setUserProfiles);
  const setProfilesLoading = useAppStore((s) => s.setProfilesLoading);
  const setProfileGateView = useAppStore((s) => s.setProfileGateView);
  const activateProfile = useAppStore((s) => s.activateProfile);
  const clearActiveProfile = useAppStore((s) => s.clearActiveProfile);
  const setProfilesLoadError = useAppStore((s) => s.setProfilesLoadError);
  const resetOnSignOut = useAppStore((s) => s.resetOnSignOut);

  const bootTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    console.info(`[NeonStream] Build ${APP_BUILD}`);

    bootTimeoutRef.current = setTimeout(() => {
      if (!useAppStore.getState().bootComplete) {
        console.warn('[Boot] Tiempo de espera agotado — mostrando landing.');
        setBootComplete(true);
      }
    }, BOOT_TIMEOUT_MS);

    const client = getSupabaseClient();
    if (!client) {
      setBootComplete(true);
      return () => {
        if (bootTimeoutRef.current) clearTimeout(bootTimeoutRef.current);
      };
    }

    const finishBoot = () => {
      if (bootTimeoutRef.current) {
        clearTimeout(bootTimeoutRef.current);
        bootTimeoutRef.current = null;
      }
      setBootComplete(true);
    };

    const tryRestoreProfile = (profiles: Profile[], userId: string): boolean => {
      const restored = restoreActiveProfile(profiles, userId);
      if (!restored) return false;

      if (profiles.length > 0 && !profiles.find((p) => p.id === restored.id)) {
        clearActiveProfile();
        return false;
      }

      activateProfile(restored);
      return true;
    };

    const handleAuthenticatedUser = async (user: User) => {
      setCurrentUser(mapSupabaseUser(user));
      cleanAuthCallbackFromUrl();
      useAppStore.getState().closeAuth();

      setProfilesLoading(true);
      setProfilesLoadError(null);

      try {
        const profiles = await fetchUserProfiles(user.id);
        setUserProfiles(profiles);

        if (tryRestoreProfile(profiles, user.id)) {
          finishBoot();
          return;
        }

        clearActiveProfile();
        setProfileGateView(profiles.length === 0 ? 'manage' : 'select');
      } catch (err) {
        console.error('[Boot] Error cargando perfiles:', err);
        setProfilesLoadError('No se pudieron cargar tus perfiles. Intenta de nuevo.');
        setProfileGateView('select');
      } finally {
        setProfilesLoading(false);
        finishBoot();
      }
    };

    const resolveBootSession = async (session: { user: User } | null) => {
      if (useAppStore.getState().bootSessionResolved) return;
      setBootSessionResolved(true);

      if (session?.user) {
        await handleAuthenticatedUser(session.user);
        return;
      }

      finishBoot();
    };

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (!useAppStore.getState().bootSessionResolved) {
          void resolveBootSession(session);
        }
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        void handleAuthenticatedUser(session.user);
        return;
      }

      if (event === 'SIGNED_OUT') {
        resetOnSignOut();
      }
    });

    void client.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.warn('[Supabase Auth] getSession:', error);
      if (!useAppStore.getState().bootSessionResolved) {
        void resolveBootSession(session);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      if (bootTimeoutRef.current) clearTimeout(bootTimeoutRef.current);
    };
  }, [
    activateProfile,
    clearActiveProfile,
    resetOnSignOut,
    setBootComplete,
    setBootSessionResolved,
    setCurrentUser,
    setProfileGateView,
    setProfilesLoadError,
    setProfilesLoading,
    setUserProfiles,
  ]);

  useEffect(() => {
    const state = useAppStore.getState();
    const phase = !bootComplete
      ? 'booting'
      : !state.currentUser
        ? state.authIntent
          ? 'auth'
          : 'landing'
        : !activeProfile || profileGateOpen
          ? 'profiles'
          : 'catalog';

    document.body.classList.toggle('landing-gate-active', phase === 'landing');
    document.body.classList.toggle('auth-gate-active', phase === 'auth');
    document.body.classList.toggle('profile-gate-active', phase === 'profiles' || phase === 'landing');
    document.documentElement.classList.toggle('app-booting', phase === 'booting');
    document.documentElement.classList.toggle('app-ready', phase !== 'booting');
  }, [bootComplete, activeProfile, profileGateOpen]);
}
