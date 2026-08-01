/** NeonStream-VOD — data-presets.js */
const NOTIFICATION_TEMPLATES = [
    { title: 'Nueva temporada disponible', description: 'Ya puedes ver todos los episodios de {name}.', backdrop: '/56v2S6BLGUjJIRX2R8ZfcmcZiSy.jpg', mediaId: 66732, mediaType: 'tv' },
    { title: 'Estreno reciente', description: '{name} acaba de llegar a Netflix.', backdrop: '/5a4JdoFwN11OrHuxEp4J4BoGxxP.jpg', mediaId: 361743, mediaType: 'movie' },
    { title: 'Recomendado para ti', description: 'Creemos que te gustará {name}.', backdrop: '/9EnAD2saKzhaK0JrPfe2SRTKe5.jpg', mediaId: 119051, mediaType: 'tv' },
    { title: 'Continúa viendo', description: 'Retoma {name} donde lo dejaste.', backdrop: '/7Y91Y9MXe1a8mULVl2uH7xAOH2.jpg', mediaId: 71912, mediaType: 'tv' },
    { title: 'Nuevo tráiler', description: 'Mira el tráiler oficial de {name}.', backdrop: '/fm6KqXpk3M4HF7uX4U3GZ4WgaNL.jpg', mediaId: 872585, mediaType: 'movie' },
    { title: 'Añadido a tu lista', description: '{name} está listo para reproducir.', backdrop: '/oaGnvB0jWRtePf0UZWRno1lGI6.jpg', mediaId: 93405, mediaType: 'tv' },
    { title: 'Top 10 hoy', description: '{name} es uno de los títulos más vistos.', backdrop: '/tuDGIMPtFj7Xqg0xFHM3d8B3m.jpg', mediaId: 100088, mediaType: 'tv' },
    { title: 'Nuevo episodio', description: 'Un episodio de {name} acaba de publicarse.', backdrop: '/re4oxik8s8Y7t0blYv0p8v5K0j.jpg', mediaId: 71446, mediaType: 'tv' }
];

const NOTIFICATION_SHOW_NAMES = [
    'Stranger Things', 'Top Gun: Maverick', 'Wednesday', 'The Witcher', 'Oppenheimer',
    'El juego del calamar', 'The Last of Us', 'La casa de papel'
];

const AVATAR_PRESETS = [
    { id: 'classic', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png' },
    { id: 'red', url: 'https://ui-avatars.com/api/?name=N&background=E50914&color=fff&size=256&bold=true&format=png' },
    { id: 'blue', url: 'https://ui-avatars.com/api/?name=N&background=0080FF&color=fff&size=256&bold=true&format=png' },
    { id: 'green', url: 'https://ui-avatars.com/api/?name=N&background=46D369&color=fff&size=256&bold=true&format=png' },
    { id: 'purple', url: 'https://ui-avatars.com/api/?name=N&background=7B2CBF&color=fff&size=256&bold=true&format=png' },
    { id: 'orange', url: 'https://ui-avatars.com/api/?name=N&background=F77F00&color=fff&size=256&bold=true&format=png' },
    { id: 'yellow', url: 'https://ui-avatars.com/api/?name=N&background=EEC218&color=141414&size=256&bold=true&format=png' },
    { id: 'pink', url: 'https://ui-avatars.com/api/?name=N&background=E91E8C&color=fff&size=256&bold=true&format=png' }
];

const LANDING_POSTER_PATHS = [
    '/9PFonBhy6cDF7WUVSJSUvyV6X5.jpg', '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg', '/dDlEmu3Z0PzFmnjscLAl6NhPOiw.jpg',
    '/7vjaCdMw15FEfCq7JPUj5HVTWas.jpg', '/reEMJA1Jsc773Xg7XGZM6oW9x7.jpg', '/ggFHVNu6YYI5L9pCfOacjizxPF.jpg',
    '/jcM9Xyz8bVFd4FkZRXDY4W3f8o.jpg', '/pIkRyDNIklXJqPkwWr99sP8U8S.jpg', '/1g0dhYtq4irTY1GPXvft6kYL0.jpg',
    '/8Gxv8gSFCU0XGDykEGv7zR1nGlS.jpg', '/z2y0htqdHDgXVKOMX08Kk5Xlux.jpg', '/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg',
    '/yYrvN5BCTaMk8J0QCsOSoEdAhB.jpg', '/6oom5QYQ2yQTM8MIKC5JqT3yCj8.jpg', '/4Y1WNKd88jxA3OL7Q98cGR1h2fA.jpg',
    '/qJ2tW6WMUDux911rY7aHmAfpWXS.jpg', '/b9GkDweFm078TGOWWE8XLO4VPpn.jpg', '/iu42m7o3ePZ7YlM4U9QAvFtx7M.jpg',
    '/8Vt6mWEReuy4OfCG9Yj1zXTQNI.jpg', '/vZjdIETFQSUTrsdF29ZjflEpSr.jpg', '/9Gtg2DzBhmwtUPkARYdKoYdN5Id.jpg',
    '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', '/eU1i6eHXlzMOlIxkEhJfa5tDM8.jpg', '/or06FN3Dka5tukor1Sv0rxLDikO.jpg',
    '/7RyHsO4yDXtBv1zUU3mTpHeQ0d.jpg', '/2CAL2433ZvIh0SbFiFiPEAEA33.jpg', '/wHa6KOmaoMPL0SmjzZ8Bi6Lj1z.jpg',
    '/bMaUaPOShotEpLiMvM3SL3ZDY2c.jpg', '/tuomAz9d7bytprQ0GcjJ9p2PnXL.jpg', '/7Y91Y9MXe1a8mULVl2uH7xAOH2.jpg',
    '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', '/sKvkd1lBr7SKHw1cDas8QHPqiao.jpg', '/tmU7GeZyfCaj7A8BXCyD9z10pM.jpg'
];

export {
    NOTIFICATION_TEMPLATES,
    NOTIFICATION_SHOW_NAMES,
    AVATAR_PRESETS,
    LANDING_POSTER_PATHS
};
