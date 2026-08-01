# NeonStream-VOD

URL activa: https://angel123-art.github.io/NeonStream-VOD/

## Variables de entorno

1. Copia el ejemplo: `cp .env.example .env` (Windows: `copy .env.example .env`)
2. Rellena tus credenciales en `.env` (este archivo **nunca** se sube a Git).

| Variable | Descripción |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (sin `/rest/v1/`) |
| `VITE_SUPABASE_ANON_KEY` | Clave anon (JWT) o publishable de Supabase |
| `VITE_TMDB_API_KEY` | API key de TMDB (v3) |
| `VITE_APP_BUILD` | Opcional — etiqueta en logs de auditoría |

Las lee `js/config.js` vía `import.meta.env` (Vite).

## Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:5173 — Vite carga `.env` automáticamente.

## Build para GitHub Pages

```bash
npm run build
```

Genera `dist/` con `base: /NeonStream-VOD/`. Despliega el contenido de `dist/` (no la raíz del repo).

Para CI/CD, define las mismas variables `VITE_*` como **secrets** del workflow antes del paso `npm run build`.

## Estructura

```
├── .env              # Secretos locales (gitignored)
├── .env.example      # Plantilla documentada (sí en el repo)
├── index.html
├── vite.config.js
├── css/
├── js/               # ES Modules
└── dist/             # Salida de producción (gitignored)
```

## Nota de seguridad

Las claves del cliente (Supabase anon, TMDB) siguen siendo visibles en el bundle del navegador; `.env` evita commitearlas al repositorio. Si alguna vez estuvieron en el historial de Git, conviene rotarlas en Supabase/TMDB.
