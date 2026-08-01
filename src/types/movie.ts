/** TMDB media types shared across catalog, hero, detail modal and player. */

export type MediaType = 'movie' | 'tv';

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
}

export interface SpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

export interface Movie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  adult?: boolean;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  status?: string;
  media_type?: 'movie';
  custom_type?: MediaType;
}

export interface TvShow {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  media_type?: 'tv';
  custom_type?: MediaType;
}

export type MediaItem = Movie | TvShow;

export interface MovieDetails extends Movie {
  belongs_to_collection?: { id: number; name: string; poster_path: string | null; backdrop_path: string | null } | null;
  budget?: number;
  revenue?: number;
  production_companies?: ProductionCompany[];
  spoken_languages?: SpokenLanguage[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  images?: { logos: Array<{ file_path: string; width: number; height: number }> };
}

export interface TvDetails extends TvShow {
  created_by?: Array<{ id: number; name: string; profile_path: string | null }>;
  episode_run_time?: number[];
  seasons?: Season[];
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  videos?: { results: Video[] };
  images?: { logos: Array<{ file_path: string; width: number; height: number }> };
}

export type MediaDetails = MovieDetails | TvDetails;

export interface Season {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date?: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  air_date: string;
  runtime?: number;
}

export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface MyListItem {
  id: number;
  type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date: string;
}

export function getMediaTitle(item: MediaItem): string {
  return 'title' in item ? item.title : item.name;
}

export function getMediaReleaseDate(item: MediaItem): string {
  return 'release_date' in item ? item.release_date : item.first_air_date;
}

export function resolveMediaType(item: MediaItem): MediaType {
  if (item.custom_type) return item.custom_type;
  if (item.media_type === 'tv') return 'tv';
  return 'movie';
}
