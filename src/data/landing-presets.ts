/**
 * Pósters TMDB de respaldo (rutas verificadas de js/data-presets.js).
 */
export const LANDING_POSTER_PATHS: string[] = [
  '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
  '/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
  '/qJ2tW6WMUDux911rY7aHmAfpWXS.jpg',
  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  '/or06FN3Dka5tukor1Sv0rxLDikO.jpg',
  '/1g0dhYtq4irTY1GPXvft6kYL0.jpg',
  '/9Gtg2DzBhmwtUPkARYdKoYdN5Id.jpg',
  '/bMaUaPOShotEpLiMvM3SL3ZDY2c.jpg',
  '/tmU7GeZyfCaj7A8BXCyD9z10pM.jpg',
  '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
  '/6oom5QYQ2yQTM8MIKC5JqT3yCj8.jpg',
  '/iu42m7o3ePZ7YlM4U9QAvFtx7M.jpg',
  '/7RyHsO4yDXtBv1zUU3mTpHeQ0d.jpg',
  '/wHa6KOmaoMPL0SmjzZ8Bi6Lj1z.jpg',
  '/8Vt6mWEReuy4OfCG9Yj1zXTQNI.jpg',
  '/vZjdIETFQSUTrsdF29ZjflEpSr.jpg',
];

export const LANDING_GRID_COLS = 4;
export const LANDING_GRID_ROWS = 3;
export const LANDING_GRID_SIZE = LANDING_GRID_COLS * LANDING_GRID_ROWS;

export function fillLandingPosterPaths(
  paths: string[],
  count = LANDING_GRID_SIZE,
): string[] {
  if (paths.length === 0) return [];
  const filled: string[] = [];
  while (filled.length < count) {
    filled.push(...paths);
  }
  return filled.slice(0, count);
}
