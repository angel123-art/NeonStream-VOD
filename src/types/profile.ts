/** Supabase `perfiles` table and app-level profile model. */

import { DEFAULT_AVATAR_URL } from '@/data/avatar-presets';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  is_kids: boolean;
  created_at?: string;
}

/** Raw row shape from Supabase before normalization. */
export interface ProfileRow {
  id: string;
  user_id: string;
  nombre: string;
  avatar: string | null;
  is_kids: boolean | string | number;
  created_at?: string;
}

export interface ProfileInsert {
  user_id: string;
  nombre: string;
  avatar: string;
  is_kids: boolean;
}

export interface ProfileUpdate {
  nombre?: string;
  avatar?: string;
  is_kids?: boolean;
}

export function mapProfileFromDb(row: ProfileRow): Profile {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.nombre,
    avatar: row.avatar || DEFAULT_AVATAR_URL,
    is_kids: normalizeIsKids(row.is_kids),
    created_at: row.created_at,
  };
}

export function normalizeIsKids(value: boolean | string | number | null | undefined): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }
  return false;
}
