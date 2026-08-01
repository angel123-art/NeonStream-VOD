import type { AuthMode } from './supabase';
import type { Profile } from './profile';
import type { SupabaseUser } from './supabase';
import type { MediaDetails, MediaItem, MediaType, MyListItem } from './movie';
import type { PushToastInput, Toast } from './toast';
import type { AppNotification } from './notification';

/** High-level navigation phases — replaces imperative gate show/hide. */
export type AppPhase = 'booting' | 'landing' | 'auth' | 'profiles' | 'catalog';

export type CatalogView = 'home' | 'series' | 'movies' | 'new' | 'mylist' | 'search';

export type PlayerServerId = '1' | '2' | '3';

export interface TrailerTarget {
  id: number;
  type: MediaType;
}

export interface AppStoreState {
  // Boot
  bootComplete: boolean;
  bootSessionResolved: boolean;

  // Auth
  currentUser: SupabaseUser | null;
  authMode: AuthMode;
  authIntent: boolean;
  authPrefillEmail: string;

  // Profiles
  userProfiles: Profile[];
  activeProfile: Profile | null;
  profilesLoading: boolean;
  profileGateView: 'select' | 'manage';
  profileGateOpen: boolean;
  profilesLoadError: string | null;

  // Catalog
  catalogView: CatalogView;
  searchQuery: string;
  searchOpen: boolean;
  selectedGenreId: number | null;

  // Detail modal
  detailOpen: boolean;
  detailMedia: MediaItem | null;

  // Player
  playerOpen: boolean;
  playerMedia: MediaItem | MediaDetails | null;
  playerSeason: number;
  playerEpisode: number;
  playerServer: PlayerServerId;

  // Trailer modal
  trailerOpen: boolean;
  trailerTarget: TrailerTarget | null;

  // Media cache — avoids re-fetching between detail and player
  mediaCache: Record<number, MediaDetails>;

  // My List — local first, Supabase sync via services layer
  myList: MyListItem[];

  // UI — Netflix-style notification panel (future phase)
  notifications: AppNotification[];
  notificationsPanelOpen: boolean;

  // Toast feedback — ephemeral action alerts
  toasts: Toast[];
}

export interface AppStoreActions {
  setBootComplete: (complete: boolean) => void;
  setBootSessionResolved: (resolved: boolean) => void;

  setCurrentUser: (user: SupabaseUser | null) => void;
  setAuthMode: (mode: AuthMode) => void;
  openAuth: (mode?: AuthMode, email?: string) => void;
  closeAuth: () => void;
  clearAuthPrefillEmail: () => void;

  setUserProfiles: (profiles: Profile[]) => void;
  setActiveProfile: (profile: Profile | null) => void;
  activateProfile: (profile: Profile) => void;
  clearActiveProfile: () => void;
  setProfilesLoading: (loading: boolean) => void;
  setProfileGateView: (view: 'select' | 'manage') => void;
  openProfileGate: (view?: 'select' | 'manage') => void;
  setProfilesLoadError: (error: string | null) => void;

  setCatalogView: (view: CatalogView) => void;
  setSelectedGenreId: (genreId: number | null) => void;
  setSearchQuery: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  submitSearch: (query: string) => void;
  clearSearch: () => void;

  openDetailModal: (media: MediaItem) => void;
  closeDetailModal: () => void;
  cacheMedia: (details: MediaDetails) => void;

  openPlayer: (
    media: MediaItem | MediaDetails,
    options?: { season?: number; episode?: number },
  ) => void;
  closePlayer: () => void;
  setPlayerSeason: (season: number) => void;
  setPlayerEpisode: (episode: number) => void;
  setPlayerServer: (server: PlayerServerId) => void;

  openTrailerModal: (id: number, type: MediaType) => void;
  closeTrailerModal: () => void;

  setMyList: (list: MyListItem[]) => void;
  toggleMyListItem: (item: MyListItem) => void;

  setNotifications: (notifications: AppNotification[]) => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  toggleNotificationsPanel: () => void;
  closeNotificationsPanel: () => void;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  prependNotification: (notification: AppNotification) => void;

  pushToast: (input: PushToastInput) => string;
  dismissToast: (id: string) => void;

  /** Full reset on sign-out — mirrors onUserSignedOut(). */
  resetOnSignOut: () => void;
}

export type AppStore = AppStoreState & AppStoreActions;

/** Derives which top-level screen to render. */
export function selectAppPhase(state: AppStoreState): AppPhase {
  if (!state.bootComplete) return 'booting';
  if (!state.currentUser) return state.authIntent ? 'auth' : 'landing';
  if (!state.activeProfile || state.profileGateOpen) return 'profiles';
  return 'catalog';
}

export function selectIsKidsProfile(state: AppStoreState): boolean {
  return state.activeProfile?.is_kids === true;
}
