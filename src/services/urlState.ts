import type { CatalogView, PlayerServerId } from '@/types/app';
import type { AppStoreState } from '@/types/app';
import type { MediaType } from '@/types/movie';
import { resolveMediaType } from '@/types/movie';

const VALID_VIEWS: CatalogView[] = ['home', 'series', 'movies', 'new', 'mylist', 'search'];

export interface ParsedUrlState {
  catalogView: CatalogView;
  searchQuery: string;
  detailId: number | null;
  detailType: MediaType | null;
  playerId: number | null;
  playerType: MediaType | null;
  playerSeason: number;
  playerEpisode: number;
  genreId: number | null;
}

function parseMediaType(value: string | null): MediaType | null {
  if (value === 'movie' || value === 'tv') return value;
  return null;
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export function parseUrlState(params: URLSearchParams): ParsedUrlState {
  const viewParam = params.get('view');
  const catalogView = VALID_VIEWS.includes(viewParam as CatalogView)
    ? (viewParam as CatalogView)
    : 'home';

  const legacyPlayerId = params.get('id');
  const legacyPlayerType = parseMediaType(params.get('type'));

  const detailIdRaw = params.get('detail') ?? null;
  const detailType = parseMediaType(params.get('dtype'));

  return {
    catalogView,
    searchQuery: params.get('q')?.trim() ?? '',
    detailId: detailIdRaw ? parsePositiveInt(detailIdRaw, 0) || null : null,
    detailType,
    playerId: legacyPlayerId ? parsePositiveInt(legacyPlayerId, 0) || null : null,
    playerType: legacyPlayerType,
    playerSeason: parsePositiveInt(params.get('sea'), 1),
    playerEpisode: parsePositiveInt(params.get('epi'), 1),
    genreId: params.get('genre') ? parsePositiveInt(params.get('genre'), 0) || null : null,
  };
}

export function hasDeepLinkState(parsed: ParsedUrlState): boolean {
  return (
    parsed.catalogView !== 'home'
    || parsed.searchQuery.length > 0
    || parsed.detailId != null
    || parsed.playerId != null
    || parsed.genreId != null
  );
}

export function buildUrlSearchParams(state: AppStoreState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.playerOpen && state.playerMedia) {
    const type = resolveMediaType(state.playerMedia);
    params.set('id', String(state.playerMedia.id));
    params.set('type', type);
    if (type === 'tv') {
      params.set('sea', String(state.playerSeason));
      params.set('epi', String(state.playerEpisode));
    }
    return params;
  }

  if (state.catalogView !== 'home') {
    params.set('view', state.catalogView);
  }

  if (state.catalogView === 'search' && state.searchQuery.trim()) {
    params.set('q', state.searchQuery.trim());
  }

  if (
    (state.catalogView === 'movies' || state.catalogView === 'series')
    && state.selectedGenreId != null
    && state.selectedGenreId > 0
  ) {
    params.set('genre', String(state.selectedGenreId));
  }

  if (state.detailOpen && state.detailMedia) {
    const type = resolveMediaType(state.detailMedia);
    params.set('detail', String(state.detailMedia.id));
    params.set('dtype', type);
  }

  return params;
}

export function urlParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  return a.toString() === b.toString();
}

export function writeUrlFromState(state: AppStoreState, replace = false): void {
  const params = buildUrlSearchParams(state);
  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;

  if (nextUrl === `${window.location.pathname}${window.location.search}`) return;

  if (replace) {
    window.history.replaceState(null, '', nextUrl);
  } else {
    window.history.pushState(null, '', nextUrl);
  }
}

/** Subset of store fields that affect the URL bar. */
export type UrlSyncSlice = Pick<
  AppStoreState,
  | 'catalogView'
  | 'searchQuery'
  | 'detailOpen'
  | 'detailMedia'
  | 'playerOpen'
  | 'playerMedia'
  | 'playerSeason'
  | 'playerEpisode'
  | 'playerServer'
  | 'selectedGenreId'
>;

export function selectUrlSyncSlice(state: AppStoreState): UrlSyncSlice {
  return {
    catalogView: state.catalogView,
    searchQuery: state.searchQuery,
    detailOpen: state.detailOpen,
    detailMedia: state.detailMedia,
    playerOpen: state.playerOpen,
    playerMedia: state.playerMedia,
    playerSeason: state.playerSeason,
    playerEpisode: state.playerEpisode,
    playerServer: state.playerServer as PlayerServerId,
    selectedGenreId: state.selectedGenreId,
  };
}
