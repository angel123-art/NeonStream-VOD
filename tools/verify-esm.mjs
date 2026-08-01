/**
 * Verifies all ES modules load without import/export errors.
 * Run: node tools/verify-esm.mjs
 */
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

global.window = globalThis;
global.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        textContent: '',
        innerHTML: '',
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        addEventListener: () => {},
        setAttribute: () => {},
        appendChild: () => {},
        style: {},
        dataset: {}
    }),
    body: { classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} }, style: {} },
    documentElement: { classList: { add: () => {}, remove: () => {} } },
    head: { appendChild: () => {} }
};
global.navigator = { userAgent: 'verify-esm' };
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] ?? null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};
global.sessionStorage = { ...global.localStorage, _data: {} };
global.history = { replaceState: () => {} };
global.location = { href: 'http://localhost/', origin: 'http://localhost', pathname: '/', search: '', hash: '' };
global.fetch = async () => ({ ok: true, json: async () => ({ results: [] }), clone: function() { return this; } });
global.supabase = { createClient: () => ({ auth: { onAuthStateChange: () => {}, getSession: async () => ({ data: { session: null } }) } }) };

const mainUrl = pathToFileURL(path.join(root, 'js', 'main.js')).href;

try {
    await import(mainUrl);
    console.log('ESM graph loaded successfully.');
} catch (err) {
    console.error('ESM load failed:', err);
    process.exit(1);
}
