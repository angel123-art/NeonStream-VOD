import { useCallback, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DEFAULT_AVATAR_URL } from '@/data/avatar-presets';
import { signOutUser, logSupabaseError } from '@/services/auth';
import {
  createProfile,
  deleteProfile as deleteProfileFromDb,
  fetchUserProfiles,
  updateProfile,
} from '@/services/supabase';
import { MAX_PROFILES } from '@/services/config';
import type { Profile } from '@/types/profile';
import { useTaDumSound } from './useTaDumSound';

const PROFILE_SELECT_FADE_MS = 650;

export interface ProfileEditorFormState {
  name: string;
  isKids: boolean;
  avatarUrl: string;
}

interface UseProfileGateReturn {
  isExiting: boolean;
  editorOpen: boolean;
  editingProfileId: string | null;
  editorError: string | null;
  saving: boolean;
  deleting: boolean;
  signingOut: boolean;
  selectProfile: (profile: Profile) => void;
  openManage: () => void;
  closeManage: () => void;
  openEditor: (profileId: string | null) => void;
  closeEditor: () => void;
  saveProfile: (form: ProfileEditorFormState) => Promise<void>;
  deleteProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useProfileGate(): UseProfileGateReturn {
  const currentUser = useAppStore((s) => s.currentUser);
  const userProfiles = useAppStore((s) => s.userProfiles);
  const activeProfile = useAppStore((s) => s.activeProfile);

  const activateProfile = useAppStore((s) => s.activateProfile);
  const setUserProfiles = useAppStore((s) => s.setUserProfiles);
  const setProfileGateView = useAppStore((s) => s.setProfileGateView);
  const setProfilesLoading = useAppStore((s) => s.setProfilesLoading);
  const setProfilesLoadError = useAppStore((s) => s.setProfilesLoadError);
  const resetOnSignOut = useAppStore((s) => s.resetOnSignOut);

  const playTaDum = useTaDumSound();

  const [isExiting, setIsExiting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const reloadProfiles = useCallback(async () => {
    if (!currentUser) return [];
    setProfilesLoading(true);
    setProfilesLoadError(null);
    try {
      const profiles = await fetchUserProfiles(currentUser.id);
      setUserProfiles(profiles);
      return profiles;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar tus perfiles.';
      setProfilesLoadError(message);
      throw err;
    } finally {
      setProfilesLoading(false);
    }
  }, [currentUser, setProfilesLoadError, setProfilesLoading, setUserProfiles]);

  const selectProfile = useCallback(
    (profile: Profile) => {
      if (isExiting) return;

      playTaDum();
      setIsExiting(true);
      setProfileGateView('select');

      window.setTimeout(() => {
        activateProfile(profile);
        setIsExiting(false);
      }, PROFILE_SELECT_FADE_MS);
    },
    [activateProfile, isExiting, playTaDum, setProfileGateView],
  );

  const openManage = useCallback(() => {
    setProfileGateView('manage');
  }, [setProfileGateView]);

  const closeManage = useCallback(() => {
    setProfileGateView('select');
  }, [setProfileGateView]);

  const openEditor = useCallback((profileId: string | null) => {
    setEditingProfileId(profileId);
    setEditorError(null);
    setEditorOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditingProfileId(null);
    setEditorError(null);
    setEditorOpen(false);
  }, []);

  const validateProfileName = useCallback(
    (name: string, excludeId?: string | null): string | null => {
      if (!name.trim()) return 'Introduce un nombre para el perfil.';
      if (name.length > 20) return 'El nombre no puede superar 20 caracteres.';
      const duplicate = userProfiles.some(
        (p) => p.id !== excludeId && p.name.toLowerCase() === name.toLowerCase(),
      );
      if (duplicate) return 'Ya existe un perfil con ese nombre.';
      return null;
    },
    [userProfiles],
  );

  const saveProfile = useCallback(
    async (form: ProfileEditorFormState) => {
      if (!currentUser) {
        setEditorError('Debes iniciar sesión para guardar perfiles.');
        return;
      }

      const name = form.name.trim();
      const validationError = validateProfileName(name, editingProfileId);
      if (validationError) {
        setEditorError(validationError);
        return;
      }

      setSaving(true);
      setEditorError(null);

      try {
        if (editingProfileId) {
          const updated = await updateProfile(editingProfileId, {
            nombre: name,
            avatar: form.avatarUrl,
            is_kids: form.isKids,
          });
          await reloadProfiles();
          if (activeProfile?.id === editingProfileId) {
            activateProfile(updated);
          }
        } else {
          if (userProfiles.length >= MAX_PROFILES) {
            setEditorError(`Máximo ${MAX_PROFILES} perfiles permitidos.`);
            return;
          }
          await createProfile({
            user_id: currentUser.id,
            nombre: name,
            avatar: form.avatarUrl,
            is_kids: form.isKids,
          });
          await reloadProfiles();
        }
        closeEditor();
      } catch (err) {
        logSupabaseError('handleProfileFormSubmit', err as Error, {
          editingProfileId,
          name,
        });
        setEditorError(err instanceof Error ? err.message : 'No se pudo guardar el perfil.');
      } finally {
        setSaving(false);
      }
    },
    [
      activeProfile?.id,
      activateProfile,
      closeEditor,
      currentUser,
      editingProfileId,
      reloadProfiles,
      userProfiles.length,
      validateProfileName,
    ],
  );

  const deleteProfile = useCallback(async () => {
    if (!editingProfileId || !currentUser) return;

    setDeleting(true);
    setEditorError(null);

    try {
      const deleted = userProfiles.find((p) => p.id === editingProfileId);
      await deleteProfileFromDb(editingProfileId);
      const remaining = await reloadProfiles();

      if (activeProfile?.id === deleted?.id) {
        if (remaining.length > 0) {
          activateProfile(remaining[0]);
        } else {
          useAppStore.getState().clearActiveProfile();
        }
      }

      closeEditor();
    } catch (err) {
      logSupabaseError('handleDeleteProfile', err as Error, { editingProfileId });
      setEditorError(err instanceof Error ? err.message : 'No se pudo eliminar el perfil.');
    } finally {
      setDeleting(false);
    }
  }, [
    activeProfile?.id,
    activateProfile,
    closeEditor,
    currentUser,
    editingProfileId,
    reloadProfiles,
    userProfiles,
  ]);

  const signOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOutUser();
    } finally {
      resetOnSignOut();
      setSigningOut(false);
    }
  }, [resetOnSignOut]);

  return {
    isExiting,
    editorOpen,
    editingProfileId,
    editorError,
    saving,
    deleting,
    signingOut,
    selectProfile,
    openManage,
    closeManage,
    openEditor,
    closeEditor,
    saveProfile,
    deleteProfile,
    signOut,
  };
}

export function getEditorInitialState(
  profileId: string | null,
  profiles: Profile[],
): ProfileEditorFormState {
  if (!profileId) {
    return { name: '', isKids: false, avatarUrl: DEFAULT_AVATAR_URL };
  }
  const profile = profiles.find((p) => p.id === profileId);
  return {
    name: profile?.name ?? '',
    isKids: profile?.is_kids ?? false,
    avatarUrl: profile?.avatar ?? DEFAULT_AVATAR_URL,
  };
}