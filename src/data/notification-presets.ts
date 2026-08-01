import type { NotificationTemplate } from '@/types/notification';

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  { title: 'Nueva temporada disponible', description: 'Ya puedes ver todos los episodios de {name}.', backdrop: '/56v2S6BLGUjJIRX2R8ZfcmcZiSy.jpg', mediaId: 66732, mediaType: 'tv' },
  { title: 'Estreno reciente', description: '{name} acaba de llegar a Netflix.', backdrop: '/5a4JdoFwN11OrHuxEp4J4BoGxxP.jpg', mediaId: 361743, mediaType: 'movie' },
  { title: 'Recomendado para ti', description: 'Creemos que te gustará {name}.', backdrop: '/9EnAD2saKzhaK0JrPfe2SRTKe5.jpg', mediaId: 119051, mediaType: 'tv' },
  { title: 'Continúa viendo', description: 'Retoma {name} donde lo dejaste.', backdrop: '/7Y91Y9MXe1a8mULVl2uH7xAOH2.jpg', mediaId: 71912, mediaType: 'tv' },
  { title: 'Nuevo tráiler', description: 'Mira el tráiler oficial de {name}.', backdrop: '/fm6KqXpk3M4HF7uX4U3GZ4WgaNL.jpg', mediaId: 872585, mediaType: 'movie' },
  { title: 'Añadido a tu lista', description: '{name} está listo para reproducir.', backdrop: '/oaGnvB0jWRtePf0UZWRno1lGI6.jpg', mediaId: 93405, mediaType: 'tv' },
  { title: 'Top 10 hoy', description: '{name} es uno de los títulos más vistos.', backdrop: '/tuDGIMPtFj7Xqg0xFHM3d8B3m.jpg', mediaId: 100088, mediaType: 'tv' },
  { title: 'Nuevo episodio', description: 'Un episodio de {name} acaba de publicarse.', backdrop: '/re4oxik8s8Y7t0blYv0p8v5K0j.jpg', mediaId: 71446, mediaType: 'tv' },
];

export const NOTIFICATION_SHOW_NAMES = [
  'Stranger Things',
  'Top Gun: Maverick',
  'Wednesday',
  'The Witcher',
  'Oppenheimer',
  'El juego del calamar',
  'The Last of Us',
  'La casa de papel',
];

export function createSeedNotifications(): import('@/types/notification').AppNotification[] {
  const now = Date.now();
  return [
    {
      id: 'seed-1',
      title: 'Bienvenido de nuevo',
      description: 'Descubre las novedades que llegaron esta semana a Netflix.',
      thumbnail: '/9EnAD2saKzhaK0JrPfe2SRTKe5.jpg',
      createdAt: now - 12 * 60 * 1000,
      read: false,
    },
    {
      id: 'seed-2',
      title: 'Nueva temporada disponible',
      description: 'Stranger Things tiene episodios nuevos listos para ver.',
      thumbnail: '/56v2S6BLGUjJIRX2R8ZfcmcZiSy.jpg',
      createdAt: now - 45 * 60 * 1000,
      read: false,
      mediaId: 66732,
      mediaType: 'tv',
    },
    {
      id: 'seed-3',
      title: 'Continúa viendo',
      description: 'Retoma The Witcher donde lo dejaste.',
      thumbnail: '/7Y91Y9MXe1a8mULVl2uH7xAOH2.jpg',
      createdAt: now - 2 * 60 * 60 * 1000,
      read: true,
      mediaId: 71912,
      mediaType: 'tv',
    },
  ];
}
