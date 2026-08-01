import {
  BACKDROP_BASE_URL,
  buildTmdbAuth,
  HERO_IMAGE_BASE_URL,
  IMAGE_BASE_URL,
  KIDS_MOVIE_CERT,
  KIDS_TV_CERT,
  LANDING_POSTER_IMAGE_BASE,
  LOGO_BASE_URL,
  normalizeTmdbCredential,
  TMDB_BASE_URL,
  TMDB_CREDENTIAL,
} from './config';
import type {
  Episode,
  MediaDetails,
  MediaItem,
  MediaType,
  Movie,
  MovieDetails,
  TmdbPaginatedResponse,
  TvDetails,
  TvShow,
  Video,
} from '@/types/movie';
import type { CatalogRow } from '@/types/catalog';

export type ImageSize = 'w200' | 'w342' | 'w500' | 'w780' | 'original';

const IMAGE_BASES: Record<ImageSize, string> = {
  w200: 'https://image.tmdb.org/t/p/w200',
  w342: LANDING_POSTER_IMAGE_BASE,
  w500: IMAGE_BASE_URL,
  w780: BACKDROP_BASE_URL,
  original: HERO_IMAGE_BASE_URL,
};

export function buildTmdbImageUrl(
  path: string | null | undefined,
  size: ImageSize = 'w500',
): string | null {
  if (!path) return null;
  return `${IMAGE_BASES[size]}${path}`;
}

export function buildLogoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${LOGO_BASE_URL}${path}`;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('language', 'es-MX');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const headers = buildTmdbAuth(url);
  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'TMDB 401: credencial inválida. Usa API Key v3 (32 caracteres) o Read Access Token v4 (JWT eyJ...) en VITE_TMDB_API_KEY.',
      );
    }
    throw new Error(`TMDB ${response.status}: ${endpoint}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchTrendingMovies(
  window: 'day' | 'week' = 'week',
): Promise<TmdbPaginatedResponse<Movie>> {
  return tmdbFetch<TmdbPaginatedResponse<Movie>>(`/trending/movie/${window}`);
}

export async function fetchTrendingAll(
  window: 'day' | 'week' = 'week',
): Promise<TmdbPaginatedResponse<MediaItem>> {
  return tmdbFetch<TmdbPaginatedResponse<MediaItem>>(`/trending/all/${window}`);
}

export async function fetchMediaDetails(
  id: number,
  type: MediaType,
): Promise<MediaDetails> {
  const append = 'credits,videos,images';
  if (type === 'movie') {
    return tmdbFetch<MovieDetails>(`/movie/${id}`, { append_to_response: append });
  }
  return tmdbFetch<TvDetails>(`/tv/${id}`, { append_to_response: append });
}

export async function fetchSeasonEpisodes(
  tvId: number,
  seasonNumber: number,
): Promise<Episode[]> {
  const data = await tmdbFetch<{ episodes: Episode[] }>(
    `/tv/${tvId}/season/${seasonNumber}`,
  );
  return data.episodes ?? [];
}

/** Filter search results to movies and TV shows with posters. */
export function filterSearchResults(items: MediaItem[]): MediaItem[] {
  return items.filter(
    (item) =>
      (item.media_type === 'movie' || item.media_type === 'tv' || item.custom_type)
      && item.poster_path,
  );
}

export async function searchMulti(
  query: string,
  page = 1,
): Promise<TmdbPaginatedResponse<MediaItem>> {
  return tmdbFetch<TmdbPaginatedResponse<MediaItem>>('/search/multi', {
    query,
    page: String(page),
    include_adult: 'false',
  });
}

export async function discoverMovies(
  page = 1,
  extraParams: Record<string, string> = {},
  isKids = false,
): Promise<TmdbPaginatedResponse<Movie>> {
  const params: Record<string, string> = {
    page: String(page),
    sort_by: 'popularity.desc',
    ...extraParams,
  };
  const kidsSuffix = isKids ? KIDS_MOVIE_CERT.replace(/^&/, '') : '';
  if (isKids) {
    params.certification_country = 'US';
    params['certification.lte'] = 'PG';
    params.with_genres = '10751,16';
  }
  void kidsSuffix;
  return tmdbFetch<TmdbPaginatedResponse<Movie>>('/discover/movie', params);
}

export async function discoverTv(
  page = 1,
  extraParams: Record<string, string> = {},
  isKids = false,
): Promise<TmdbPaginatedResponse<TvShow>> {
  const params: Record<string, string> = {
    page: String(page),
    sort_by: 'popularity.desc',
    ...extraParams,
  };
  if (isKids) {
    params.certification_country = 'US';
    params['certification.lte'] = 'TV-PG';
    params.with_genres = '10751,16';
  }
  void KIDS_TV_CERT;
  return tmdbFetch<TmdbPaginatedResponse<TvShow>>('/discover/tv', params);
}

export function isTmdbConfigured(): boolean {
  return normalizeTmdbCredential(TMDB_CREDENTIAL).length > 0;
}

export async function fetchVideos(
  id: number,
  type: MediaType,
  language = 'es-MX',
): Promise<Video[]> {
  const data = await tmdbFetch<{ results: Video[] }>(`/${type}/${id}/videos`, {
    language,
  });
  return data.results ?? [];
}

export async function fetchTrailerKey(id: number, type: MediaType): Promise<string | null> {
  const mxVideos = await fetchVideos(id, type, 'es-MX');
  let trailer = mxVideos.find((v) => v.type === 'Trailer' && v.site === 'YouTube');

  if (!trailer) {
    const usVideos = await fetchVideos(id, type, 'en-US');
    trailer = usVideos.find((v) => v.type === 'Trailer' && v.site === 'YouTube');
  }

  return trailer?.key ?? null;
}

export async function fetchTitleLogo(id: number, type: MediaType): Promise<string | null> {
  try {
    const data = await tmdbFetch<{ logos: Array<{ file_path: string; iso_639_1: string | null }> }>(
      `/${type}/${id}/images`,
      { include_image_language: 'es,en,null' },
    );
    const logos = data.logos ?? [];
    const logo =
      logos.find((l) => l.iso_639_1 === 'es')
      ?? logos.find((l) => l.iso_639_1 === 'en')
      ?? logos[0];
    return buildLogoUrl(logo?.file_path);
  } catch {
    return null;
  }
}

function tagMediaType<T extends MediaItem>(items: T[], type: MediaType): T[] {
  return items.map((item) => ({
    ...item,
    custom_type: item.custom_type ?? item.media_type ?? type,
  }));
}

function filterWithPoster(items: MediaItem[]): MediaItem[] {
  return items.filter((i) => i.poster_path);
}

function filterWithBackdrop(items: MediaItem[]): MediaItem[] {
  return items.filter((i) => i.backdrop_path || i.poster_path);
}

export interface HomeCatalogResult {
  heroItems: MediaItem[];
  rows: CatalogRow[];
}

export async function fetchAdultHomeCatalog(): Promise<HomeCatalogResult> {
  const [
    trendingDay,
    popularTv,
    actionMovies,
    horrorMovies,
    scifiMovies,
    comedyMovies,
    animes,
    kdramas,
    newMovies,
  ] = await Promise.all([
    tmdbFetch<TmdbPaginatedResponse<MediaItem>>('/trending/all/day'),
    discoverTv(1, {}, false),
    discoverMovies(1, { with_genres: '28,12' }, false),
    discoverMovies(1, { with_genres: '27' }, false),
    discoverMovies(1, { with_genres: '878' }, false),
    discoverMovies(1, { with_genres: '35' }, false),
    discoverTv(1, { with_genres: '16', with_original_language: 'ja' }, false),
    discoverTv(1, { with_origin_country: 'KR' }, false),
    discoverMovies(1, {
      sort_by: 'release_date.desc',
      'primary_release_date.lte': '2026-12-31',
    }, false),
  ]);

  const dayList = filterWithBackdrop(trendingDay.results ?? []);
  const heroItems = dayList.slice(0, 5);
  const trendingWide = dayList.filter((i) => i.backdrop_path).slice(0, 15);
  const top10 = dayList.filter((i) => i.poster_path).slice(0, 10);

  return {
    heroItems,
    rows: [
      { id: 'trending', title: 'Tendencias ahora', variant: 'trending' as const, items: trendingWide },
      { id: 'top10', title: 'Top 10 en Netflix hoy', variant: 'top10' as const, items: top10 },
      { id: 'originals', title: 'Títulos originales de Netflix', variant: 'default' as const, items: tagMediaType((popularTv.results ?? []).slice(0, 18), 'tv') },
      { id: 'action', title: 'Acción y aventura', variant: 'default' as const, items: tagMediaType((actionMovies.results ?? []).slice(0, 18), 'movie') },
      { id: 'comedy', title: 'Comedias', variant: 'default' as const, items: tagMediaType((comedyMovies.results ?? []).slice(0, 18), 'movie') },
      { id: 'horror', title: 'Terror', variant: 'default' as const, items: tagMediaType((horrorMovies.results ?? []).slice(0, 18), 'movie') },
      { id: 'scifi', title: 'Ciencia ficción', variant: 'default' as const, items: tagMediaType((scifiMovies.results ?? []).slice(0, 18), 'movie') },
      { id: 'new', title: 'Novedades', variant: 'default' as const, items: tagMediaType(filterWithPoster(newMovies.results ?? []).slice(0, 18), 'movie') },
      { id: 'anime', title: 'Animes populares', variant: 'default' as const, items: tagMediaType((animes.results ?? []).slice(0, 18), 'tv') },
      { id: 'kdrama', title: 'Doramas coreanos', variant: 'default' as const, items: tagMediaType((kdramas.results ?? []).slice(0, 18), 'tv') },
    ].filter((row) => row.items.length > 0),
  };
}

export async function fetchKidsHomeCatalog(): Promise<HomeCatalogResult> {
  const [
    familyMovies,
    kidsTv,
    animatedMovies,
    animatedTv,
    fantasyMovies,
    fantasyTv,
    newKidsMovies,
  ] = await Promise.all([
    discoverMovies(1, { with_genres: '10751', sort_by: 'popularity.desc' }, true),
    discoverTv(1, { with_genres: '10751', sort_by: 'popularity.desc' }, true),
    discoverMovies(1, { with_genres: '16', sort_by: 'popularity.desc' }, true),
    discoverTv(1, { with_genres: '16', sort_by: 'popularity.desc' }, true),
    discoverMovies(1, { with_genres: '14', sort_by: 'popularity.desc' }, true),
    discoverTv(1, { with_genres: '14', sort_by: 'popularity.desc' }, true),
    discoverMovies(1, {
      sort_by: 'release_date.desc',
      'primary_release_date.lte': '2026-12-31',
    }, true),
  ]);

  const heroPool = filterWithBackdrop(familyMovies.results ?? []);
  const heroItems = tagMediaType(heroPool.slice(0, 5), 'movie');

  return {
    heroItems,
    rows: [
      { id: 'family', title: 'Películas familiares', variant: 'default' as const, items: tagMediaType((familyMovies.results ?? []).slice(0, 18), 'movie') },
      { id: 'kids-tv', title: 'Series de TV infantiles', variant: 'default' as const, items: tagMediaType((kidsTv.results ?? []).slice(0, 18), 'tv') },
      { id: 'animated', title: 'Títulos animados', variant: 'default' as const, items: [
        ...tagMediaType(animatedMovies.results ?? [], 'movie'),
        ...tagMediaType(animatedTv.results ?? [], 'tv'),
      ].slice(0, 18) },
      { id: 'fantasy', title: 'Magia y Fantasía', variant: 'default' as const, items: [
        ...tagMediaType(fantasyMovies.results ?? [], 'movie'),
        ...tagMediaType(fantasyTv.results ?? [], 'tv'),
      ].slice(0, 18) },
      { id: 'new-kids', title: 'Novedades para toda la familia', variant: 'default' as const, items: tagMediaType(filterWithPoster(newKidsMovies.results ?? []).slice(0, 18), 'movie') },
    ].filter((row) => row.items.length > 0),
  };
}

export async function fetchGridCatalog(
  view: 'movies' | 'series' | 'new',
  isKids: boolean,
  page = 1,
  genreId: number | null = null,
): Promise<TmdbPaginatedResponse<MediaItem>> {
  const genreParams: Record<string, string> = {};
  if (genreId != null && genreId > 0) {
    genreParams.with_genres = String(genreId);
  }

  if (view === 'series') {
    const data = await discoverTv(page, genreParams, isKids);
    return { ...data, results: tagMediaType(data.results, 'tv') };
  }

  if (view === 'new') {
    const data = await discoverMovies(page, {
      sort_by: 'release_date.desc',
      'primary_release_date.lte': '2026-12-31',
      ...genreParams,
    }, isKids);
    return { ...data, results: tagMediaType(data.results, 'movie') };
  }

  const data = await discoverMovies(page, genreParams, isKids);
  return { ...data, results: tagMediaType(data.results, 'movie') };
}

