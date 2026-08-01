import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  getAuthRedirectUrl,
  getSupabaseProjectUrl,
  SUPABASE_ANON_KEY,
} from './config';
import type { Profile, ProfileInsert, ProfileRow, ProfileUpdate } from '@/types/profile';
import { mapProfileFromDb } from '@/types/profile';
import type { MyListItem } from '@/types/movie';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = getSupabaseProjectUrl();
  const key = SUPABASE_ANON_KEY.trim();

  if (!url || !key) {
    console.warn('[Supabase] Cliente no inicializado — faltan credenciales en .env');
    return null;
  }

  supabaseClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      experimental: { passkey: true } as Record<string, unknown>,
    },
  });

  return supabaseClient;
}

export function validateSupabaseConfig(): string[] {
  const issues: string[] = [];
  const projectUrl = getSupabaseProjectUrl();

  if (!projectUrl || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl)) {
    issues.push(
      'VITE_SUPABASE_URL debe ser https://TU-PROYECTO.supabase.co (sin /rest/v1/ al final).',
    );
  }

  const key = SUPABASE_ANON_KEY.trim();
  if (!key || key.length < 20) {
    issues.push('VITE_SUPABASE_ANON_KEY está vacía o parece inválida.');
  } else if (!key.startsWith('sb_publishable_') && !key.startsWith('eyJ')) {
    issues.push('La clave debe ser publishable (sb_publishable_...) o anon JWT (eyJ...).');
  }

  return issues;
}

// ── Profiles ────────────────────────────────────────────────────────────────

export async function fetchUserProfiles(userId: string): Promise<Profile[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  const { data, error } = await client
    .from('perfiles')
    .select('id, user_id, nombre, avatar, is_kids, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data as ProfileRow[]).map(mapProfileFromDb);
}

export async function createProfile(payload: ProfileInsert): Promise<Profile> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no disponible');

  const { data, error } = await client
    .from('perfiles')
    .insert(payload)
    .select('id, user_id, nombre, avatar, is_kids, created_at')
    .single();

  if (error) throw error;
  return mapProfileFromDb(data as ProfileRow);
}

export async function updateProfile(
  profileId: string,
  payload: ProfileUpdate,
): Promise<Profile> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no disponible');

  const { data, error } = await client
    .from('perfiles')
    .update(payload)
    .eq('id', profileId)
    .select('id, user_id, nombre, avatar, is_kids, created_at')
    .single();

  if (error) throw error;
  return mapProfileFromDb(data as ProfileRow);
}

export async function deleteProfile(profileId: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no disponible');

  const { error } = await client.from('perfiles').delete().eq('id', profileId);
  if (error) throw error;
}

// ── My List (localStorage bridge — Supabase sync in Phase 2) ────────────────

import { MY_LIST_KEY } from './config';

export function loadMyListFromStorage(): MyListItem[] {
  try {
    return JSON.parse(localStorage.getItem(MY_LIST_KEY) || '[]') as MyListItem[];
  } catch {
    return [];
  }
}

export function saveMyListToStorage(list: MyListItem[]): void {
  localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
}

export function getAuthRedirectTo(): string {
  return getAuthRedirectUrl();
}
