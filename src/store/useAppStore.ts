import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AppStore, AppStoreState } from '@/types/app';
import type { AuthMode } from '@/types/supabase';
import type { Profile } from '@/types/profile';
import type { SupabaseUser } from '@/types/supabase';
import type { CatalogView, MyListItem, MediaDetails, MediaItem, MediaType } from '@/types';
import type { PushToastInput } from '@/types/toast';
import { DEFAULT_TOAST_DURATION_MS } from '@/types/toast';
import { loadMyListFromStorage, saveMyListToStorage } from '@/services/supabase';
import {
  clearProfileStorage,
  persistActiveProfile,
  resolveProfileForActivation,
} from '@/services/profileStorage';

const initialState: AppStoreState = {
  bootComplete: false,
  bootSessionResolved: false,

  currentUser: null,
  authMode: 'login',
  authIntent: false,
  authPrefillEmail: '',

  userProfiles: [],
  activeProfile: null,
  profilesLoading: false,
  profileGateView: 'select',
  profileGateOpen: false,
  profilesLoadError: null,

  catalogView: 'home',
  searchQuery: '',
  searchOpen: false,
  selectedGenreId: null,

  detailOpen: false,
  detailMedia: null,

  playerOpen: false,
  playerMedia: null,
  playerSeason: 1,
  playerEpisode: 1,
  playerServer: '1',

  trailerOpen: false,
  trailerTarget: null,

  mediaCache: {},

  myList: loadMyListFromStorage(),

  notifications: [],
  notificationsPanelOpen: false,

  toasts: [],
};

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setBootComplete: (complete) => set({ bootComplete: complete }, false, 'setBootComplete'),
      setBootSessionResolved: (resolved) =>
        set({ bootSessionResolved: resolved }, false, 'setBootSessionResolved'),

      setCurrentUser: (user: SupabaseUser | null) =>
        set({ currentUser: user }, false, 'setCurrentUser'),

      setAuthMode: (mode: AuthMode) => set({ authMode: mode }, false, 'setAuthMode'),

      openAuth: (mode: AuthMode = 'login', email = '') =>
        set(
          { authIntent: true, authMode: mode, authPrefillEmail: email.trim() },
          false,
          'openAuth',
        ),

      closeAuth: () =>
        set({ authIntent: false, authMode: 'login', authPrefillEmail: '' }, false, 'closeAuth'),

      clearAuthPrefillEmail: () =>
        set({ authPrefillEmail: '' }, false, 'clearAuthPrefillEmail'),

      setUserProfiles: (profiles: Profile[]) =>
        set({ userProfiles: profiles }, false, 'setUserProfiles'),

      setActiveProfile: (profile: Profile | null) =>
        set({ activeProfile: profile }, false, 'setActiveProfile'),

      activateProfile: (profile: Profile) => {
        const userId = get().currentUser?.id;
        const resolved = resolveProfileForActivation(profile, get().userProfiles);
        if (userId) persistActiveProfile(resolved, userId);
        set(
          {
            activeProfile: resolved,
            profileGateOpen: false,
            profileGateView: 'select',
          },
          false,
          'activateProfile',
        );
      },

      clearActiveProfile: () => {
        const userId = get().currentUser?.id;
        clearProfileStorage(userId);
        set({ activeProfile: null }, false, 'clearActiveProfile');
      },

      setProfilesLoading: (loading: boolean) =>
        set({ profilesLoading: loading }, false, 'setProfilesLoading'),

      setProfileGateView: (view) => set({ profileGateView: view }, false, 'setProfileGateView'),

      openProfileGate: (view: 'select' | 'manage' = 'select') =>
        set({ profileGateOpen: true, profileGateView: view }, false, 'openProfileGate'),

      setProfilesLoadError: (error) =>
        set({ profilesLoadError: error }, false, 'setProfilesLoadError'),

      setCatalogView: (view: CatalogView) =>
        set({ catalogView: view, selectedGenreId: null }, false, 'setCatalogView'),

      setSelectedGenreId: (genreId: number | null) =>
        set({ selectedGenreId: genreId }, false, 'setSelectedGenreId'),

      setSearchQuery: (query: string) => set({ searchQuery: query }, false, 'setSearchQuery'),

      setSearchOpen: (open: boolean) => set({ searchOpen: open }, false, 'setSearchOpen'),

      submitSearch: (query: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        set(
          {
            searchQuery: trimmed,
            catalogView: 'search',
            detailOpen: false,
            detailMedia: null,
            playerOpen: false,
            playerMedia: null,
          },
          false,
          'submitSearch',
        );
      },

      clearSearch: () =>
        set({ searchQuery: '', searchOpen: false, catalogView: 'home', selectedGenreId: null }, false, 'clearSearch'),

      openDetailModal: (media: MediaItem) =>
        set({ detailOpen: true, detailMedia: media }, false, 'openDetailModal'),

      closeDetailModal: () =>
        set({ detailOpen: false, detailMedia: null }, false, 'closeDetailModal'),

      cacheMedia: (details: MediaDetails) =>
        set(
          (state) => ({
            mediaCache: { ...state.mediaCache, [details.id]: details },
          }),
          false,
          'cacheMedia',
        ),

      openPlayer: (media, options) => {
        const season = options?.season ?? 1;
        const episode = options?.episode ?? 1;
        set(
          {
            playerOpen: true,
            playerMedia: media,
            playerSeason: season,
            playerEpisode: episode,
            playerServer: '1',
            detailOpen: false,
            detailMedia: null,
          },
          false,
          'openPlayer',
        );
      },

      closePlayer: () =>
        set(
          {
            playerOpen: false,
            playerMedia: null,
            playerSeason: 1,
            playerEpisode: 1,
            playerServer: '1',
          },
          false,
          'closePlayer',
        ),

      setPlayerSeason: (season: number) =>
        set({ playerSeason: season, playerEpisode: 1 }, false, 'setPlayerSeason'),

      setPlayerEpisode: (episode: number) =>
        set({ playerEpisode: episode }, false, 'setPlayerEpisode'),

      setPlayerServer: (server) => set({ playerServer: server }, false, 'setPlayerServer'),

      openTrailerModal: (id: number, type: MediaType) =>
        set({ trailerOpen: true, trailerTarget: { id, type } }, false, 'openTrailerModal'),

      closeTrailerModal: () =>
        set({ trailerOpen: false, trailerTarget: null }, false, 'closeTrailerModal'),

      setMyList: (list: MyListItem[]) => {
        saveMyListToStorage(list);
        set({ myList: list }, false, 'setMyList');
      },

      toggleMyListItem: (item: MyListItem) => {
        const list = [...get().myList];
        const idx = list.findIndex((i) => i.id === item.id && i.type === item.type);
        const wasInList = idx >= 0;
        if (wasInList) {
          list.splice(idx, 1);
        } else {
          list.unshift(item);
        }
        saveMyListToStorage(list);
        set({ myList: list }, false, 'toggleMyListItem');
        get().pushToast({
          variant: 'success',
          message: wasInList
            ? `"${item.title}" eliminado de Mi Lista`
            : `"${item.title}" agregado a Mi Lista`,
        });
      },

      setNotifications: (notifications) =>
        set({ notifications }, false, 'setNotifications'),

      setNotificationsPanelOpen: (open) =>
        set({ notificationsPanelOpen: open }, false, 'setNotificationsPanelOpen'),

      toggleNotificationsPanel: () => {
        const open = !get().notificationsPanelOpen;
        if (open) {
          get().markAllNotificationsRead();
          set({ notificationsPanelOpen: true, searchOpen: false }, false, 'toggleNotificationsPanel');
        } else {
          set({ notificationsPanelOpen: false }, false, 'toggleNotificationsPanel');
        }
      },

      closeNotificationsPanel: () =>
        set({ notificationsPanelOpen: false }, false, 'closeNotificationsPanel'),

      markAllNotificationsRead: () =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
          }),
          false,
          'markAllNotificationsRead',
        ),

      markNotificationRead: (id: string) =>
        set(
          (state) => ({
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n,
            ),
          }),
          false,
          'markNotificationRead',
        ),

      prependNotification: (notification) =>
        set(
          (state) => ({
            notifications: [notification, ...state.notifications].slice(0, 15),
          }),
          false,
          'prependNotification',
        ),

      pushToast: (input: PushToastInput) => {
        const id = input.id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const toast = {
          id,
          message: input.message,
          title: input.title,
          variant: input.variant ?? 'info',
          durationMs: input.durationMs ?? DEFAULT_TOAST_DURATION_MS,
        };
        set(
          (state) => ({ toasts: [...state.toasts, toast].slice(-5) }),
          false,
          'pushToast',
        );
        return id;
      },

      dismissToast: (id: string) =>
        set(
          (state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }),
          false,
          'dismissToast',
        ),

      resetOnSignOut: () => {
        const userId = get().currentUser?.id;
        if (userId) clearProfileStorage(userId);
        set(
          {
            currentUser: null,
            authIntent: false,
            authMode: 'login',
            authPrefillEmail: '',
            userProfiles: [],
            activeProfile: null,
            profileGateView: 'select',
            profileGateOpen: false,
            profilesLoadError: null,
            catalogView: 'home',
            searchQuery: '',
            searchOpen: false,
            selectedGenreId: null,
            detailOpen: false,
            detailMedia: null,
            playerOpen: false,
            playerMedia: null,
            playerSeason: 1,
            playerEpisode: 1,
            playerServer: '1',
            trailerOpen: false,
            trailerTarget: null,
            mediaCache: {},
            notifications: [],
            notificationsPanelOpen: false,
            toasts: [],
          },
          false,
          'resetOnSignOut',
        );
      },
    }),
    { name: 'NeonStreamStore' },
  ),
);

/** Selector hooks — avoid re-renders on unrelated state changes. */
export const useAppPhase = () => useAppStore((s) => {
  if (!s.bootComplete) return 'booting' as const;
  if (!s.currentUser) return s.authIntent ? ('auth' as const) : ('landing' as const);
  if (!s.activeProfile || s.profileGateOpen) return 'profiles' as const;
  return 'catalog' as const;
});

export const useCurrentUser = () => useAppStore((s) => s.currentUser);
export const useActiveProfile = () => useAppStore((s) => s.activeProfile);
export const useMyList = () => useAppStore((s) => s.myList);
export const useIsKidsProfile = () => useAppStore((s) => s.activeProfile?.is_kids === true);
