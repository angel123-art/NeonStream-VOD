/**
 * Split script.js and style.css into organized folders.
 * Run once: node tools/split-project.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const JS_DIR = path.join(ROOT, 'js');
const CSS_DIR = path.join(ROOT, 'css');
const BUILD = '20260801-organized';

function readLines(file) {
    return fs.readFileSync(path.join(ROOT, file), 'utf8').split(/\r?\n/);
}

function writeChunk(dir, name, lines, header) {
    const content = [
        header || `/** NeonStream-VOD — ${name} */`,
        ...lines.filter((_, i, arr) => !(i === arr.length - 1 && lines[lines.length - 1] === ''))
    ].join('\n') + '\n';
    fs.writeFileSync(path.join(dir, name), content, 'utf8');
}

function slice(lines, start, end) {
    return lines.slice(start - 1, end);
}

// --- JavaScript splits (1-based line numbers from original script.js) ---
const jsChunks = [
    { file: 'config.js', start: 1, end: 78 },
    { file: 'audit-logger.js', start: 80, end: 337 },
    { file: 'data-presets.js', start: 339, end: 378 },
    { file: 'state.js', start: 380, end: 525 },
    { file: 'boot.js', start: 544, end: 623 },
    { file: 'notifications.js', start: 624, end: 989 },
    { file: 'landing.js', start: 990, end: 1135 },
    { file: 'auth.js', start: 1136, end: 1953 },
    { file: 'profiles.js', start: 1954, end: 2545 },
    { file: 'skeleton-hover.js', start: 2546, end: 2665 },
    { file: 'hero.js', start: 2666, end: 2777 },
    { file: 'my-list.js', start: 2778, end: 2845 },
    { file: 'events.js', start: 2847, end: 3033 },
    { file: 'catalog.js', start: 3034, end: 3583 },
    { file: 'detail-modal.js', start: 3584, end: 3723 },
    { file: 'player.js', start: 3724, end: 3980 },
    { file: 'helpers.js', start: 3981, end: 4058 }
];

const mainJs = `/** NeonStream-VOD — Application bootstrap */
document.addEventListener('DOMContentLoaded', async () => {
    setupAuditLoggerUI();
    setupGlobalImageErrorLogging();
    startAppBoot();
    setupEventListeners();
    setupNavbarScroll();
    setupSearchToggle();
    setupNotifications();
    setupLandingGate();
    setupAuthGate();
    setupProfileGate();
    setupProfilePersistence();
    setupCardHoverTrailers();
    setupHeroVolumeControl();
    await initAuth();
});
`;

// --- CSS splits ---
const cssChunks = [
    { file: 'base.css', start: 1, end: 65 },
    { file: 'navbar.css', start: 66, end: 218 },
    { file: 'notifications.css', start: 219, end: 492 },
    { file: 'layout.css', start: 493, end: 513 },
    { file: 'hero.css', start: 514, end: 754 },
    { file: 'catalog.css', start: 755, end: 1065 },
    { file: 'player.css', start: 1066, end: 1321 },
    { file: 'landing.css', start: 1322, end: 1643 },
    { file: 'auth.css', start: 1644, end: 2004 },
    { file: 'profiles.css', start: 2005, end: 2540 },
    { file: 'skeleton.css', start: 2541, end: 2635 },
    { file: 'modals.css', start: 2636, end: 2910 },
    { file: 'rows-special.css', start: 2911, end: 3145 },
    { file: 'responsive.css', start: 3146, end: 99999 }
];

function run() {
    fs.mkdirSync(JS_DIR, { recursive: true });
    fs.mkdirSync(CSS_DIR, { recursive: true });

    const jsLines = readLines('script.js');
    const cssLines = readLines('style.css');

    if (jsLines.length < 4050) {
        console.warn('Warning: script.js has fewer lines than expected:', jsLines.length);
    }

    jsChunks.forEach(({ file, start, end }) => {
        writeChunk(JS_DIR, file, slice(jsLines, start, end));
        console.log('  js/' + file);
    });

    fs.writeFileSync(path.join(JS_DIR, 'main.js'), mainJs, 'utf8');
    console.log('  js/main.js');

    cssChunks.forEach(({ file, start, end }) => {
        const chunk = slice(cssLines, start, Math.min(end, cssLines.length));
        if (chunk.length === 0) return;
        writeChunk(CSS_DIR, file, chunk);
        console.log('  css/' + file);
    });

    // Update index.html
    const htmlPath = path.join(ROOT, 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf8');

    const cssLinks = cssChunks
        .map(({ file }) => `    <link rel="stylesheet" href="css/${file}?v=${BUILD}">`)
        .join('\n');

    html = html.replace(
        /<link rel="stylesheet" href="style\.css\?v=[^"]+">/,
        cssLinks
    );

    const jsScripts = [
        ...jsChunks.map(({ file }) => `    <script src="js/${file}?v=${BUILD}"></script>`),
        `    <script src="js/main.js?v=${BUILD}"></script>`
    ].join('\n');

    html = html.replace(
        /<script src="script\.js\?v=[^"]+"><\/script>/,
        jsScripts
    );

    fs.writeFileSync(htmlPath, html, 'utf8');
    console.log('\nUpdated index.html');
    console.log('Build tag:', BUILD);
}

run();
