import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const index = resolve('dist/index.html');
const notFound = resolve('dist/404.html');

if (!existsSync(index)) {
  console.error('[postbuild] dist/index.html no existe. Ejecuta vite build primero.');
  process.exit(1);
}

copyFileSync(index, notFound);
console.log('[postbuild] dist/404.html creado (copia de index.html)');
