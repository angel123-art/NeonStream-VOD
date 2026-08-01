export interface AvatarPreset {
  id: string;
  url: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'classic', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png' },
  { id: 'red', url: 'https://ui-avatars.com/api/?name=N&background=E50914&color=fff&size=256&bold=true&format=png' },
  { id: 'blue', url: 'https://ui-avatars.com/api/?name=N&background=0080FF&color=fff&size=256&bold=true&format=png' },
  { id: 'green', url: 'https://ui-avatars.com/api/?name=N&background=46D369&color=fff&size=256&bold=true&format=png' },
  { id: 'purple', url: 'https://ui-avatars.com/api/?name=N&background=7B2CBF&color=fff&size=256&bold=true&format=png' },
  { id: 'orange', url: 'https://ui-avatars.com/api/?name=N&background=F77F00&color=fff&size=256&bold=true&format=png' },
  { id: 'yellow', url: 'https://ui-avatars.com/api/?name=N&background=EEC218&color=141414&size=256&bold=true&format=png' },
  { id: 'pink', url: 'https://ui-avatars.com/api/?name=N&background=E91E8C&color=fff&size=256&bold=true&format=png' },
];

export const TADUM_AUDIO_URL =
  'https://assets.nflxext.com/us/ffe/siteui/common/media/netflix-intro-v2.mp3';

export const DEFAULT_AVATAR_URL = AVATAR_PRESETS[0].url;
