import { PROFILE_LOCAL_KEY, PROFILE_SESSION_KEY } from '@/services/config';
import type { Profile } from '@/types/profile';
import { normalizeIsKids } from '@/types/profile';

function getProfileLocalStorageKey(userId: string): string {
  return `${PROFILE_LOCAL_KEY}_${userId}`;
}

function normalizeStoredProfile(profile: Profile | null): Profile | null {
  if (!profile?.id) return null;
  return { ...profile, is_kids: normalizeIsKids(profile.is_kids) };
}

function parseStoredProfile(raw: string | null): Profile | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Profile;
    if (parsed?.id && parsed?.name) return normalizeStoredProfile(parsed);
  } catch {
    /* perfil corrupto */
  }
  return null;
}

/** Persist active profile to session + local storage (mirrors profiles.js). */
export function persistActiveProfile(profile: Profile, userId: string): void {
  const normalized = normalizeStoredProfile(profile);
  if (!normalized) return;

  const payload = JSON.stringify(normalized);
  sessionStorage.setItem(PROFILE_SESSION_KEY, payload);
  localStorage.setItem(getProfileLocalStorageKey(userId), payload);
}

export function clearProfileStorage(userId?: string): void {
  sessionStorage.removeItem(PROFILE_SESSION_KEY);
  if (userId) {
    localStorage.removeItem(getProfileLocalStorageKey(userId));
  }
}

/**
 * Restore active profile from session/local storage.
 * Returns null if stored profile no longer exists in the user's profile list.
 */
export function restoreActiveProfile(
  userProfiles: Profile[],
  userId: string,
): Profile | null {
  const fromSession = parseStoredProfile(sessionStorage.getItem(PROFILE_SESSION_KEY));
  if (fromSession) {
    if (fromSession.user_id && fromSession.user_id !== userId) {
      sessionStorage.removeItem(PROFILE_SESSION_KEY);
    } else {
      const match = userProfiles.find((p) => p.id === fromSession.id);
      return normalizeStoredProfile(match ?? fromSession);
    }
  }

  const fromLocal = parseStoredProfile(
    localStorage.getItem(getProfileLocalStorageKey(userId)),
  );
  if (fromLocal && (!fromLocal.user_id || fromLocal.user_id === userId)) {
    const match = userProfiles.find((p) => p.id === fromLocal.id);
    const profile = normalizeStoredProfile(match ?? fromLocal);
    if (profile) {
      sessionStorage.setItem(PROFILE_SESSION_KEY, JSON.stringify(profile));
    }
    return profile;
  }

  return null;
}

export function resolveProfileForActivation(
  profile: Profile,
  userProfiles: Profile[],
): Profile {
  const fresh = userProfiles.find((p) => p.id === profile.id);
  return normalizeStoredProfile(fresh ? { ...fresh, ...profile } : profile)!;
}
