/** NeonStream-VOD — audit-logger.js */
import {
    APP_BUILD,
    AUDIT_LOG_STORAGE_KEY,
    AUDIT_LOG_MAX_ENTRIES
} from './config.js';
import { elements } from './state.js';

// ============================================
// AuditLogger — auditoría centralizada
// ============================================
const AuditLogger = {
    entries: [],
    _fetchPatched: false,
    _imageErrorCache: new Set(),

    init() {
        this.loadFromStorage();
        this.installFetchInterceptor();
        this.info('SYSTEM', 'AuditLogger inicializado', {
            build: APP_BUILD,
            origin: window.location.origin,
            userAgent: navigator.userAgent
        });
    },

    formatTimestamp(date = new Date()) {
        const pad = (n, len = 2) => String(n).padStart(len, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
    },

    log(level, category, message, data = null) {
        const entry = {
            timestamp: this.formatTimestamp(),
            level,
            category,
            message
        };

        if (data != null && typeof data === 'object' && Object.keys(data).length > 0) {
            entry.data = data;
        }

        this.entries.push(entry);
        if (this.entries.length > AUDIT_LOG_MAX_ENTRIES) {
            this.entries = this.entries.slice(-AUDIT_LOG_MAX_ENTRIES);
        }

        this.persist();

        const consoleMethod = level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'info';
        console[consoleMethod](`[Audit ${level}/${category}]`, message, entry.data || '');

        return entry;
    },

    info(category, message, data) { return this.log('INFO', category, message, data); },
    warn(category, message, data) { return this.log('WARN', category, message, data); },
    error(category, message, data) { return this.log('ERROR', category, message, data); },
    success(category, message, data) { return this.log('SUCCESS', category, message, data); },

    persist() {
        try {
            localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(this.entries));
        } catch (err) {
            console.warn('[AuditLogger] No se pudo persistir en localStorage:', err);
        }
    },

    loadFromStorage() {
        try {
            const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                this.entries = parsed.slice(-AUDIT_LOG_MAX_ENTRIES);
            }
        } catch {
            this.entries = [];
        }
    },

    clear() {
        this.entries = [];
        localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
        this.info('SYSTEM', 'Registro de auditoría limpiado');
    },

    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        const blocked = new Set([
            'password', 'token', 'access_token', 'refresh_token', 'secret',
            'apikey', 'authorization', 'anon_key', 'service_role'
        ]);
        const out = Array.isArray(obj) ? [] : {};

        for (const [key, value] of Object.entries(obj)) {
            if (blocked.has(key.toLowerCase())) continue;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                out[key] = this.sanitizeObject(value);
            } else {
                out[key] = value;
            }
        }

        return out;
    },

    sanitizeUser(user) {
        if (!user) return null;
        return this.sanitizeObject({
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            email_confirmed_at: user.email_confirmed_at,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata
        });
    },

    sanitizeProfile(profile) {
        if (!profile) return null;
        return this.sanitizeObject({
            id: profile.id,
            user_id: profile.user_id,
            name: profile.name,
            is_kids: Boolean(profile.is_kids),
            avatar: profile.avatar
        });
    },

    sanitizeTmdbUrl(url) {
        return String(url).replace(/api_key=[^&]+/gi, 'api_key=[REDACTED]');
    },

    logImageFailure(img, source = 'unknown') {
        const url = img?.currentSrc || img?.src || '';
        if (!url || url.startsWith('data:') || url.includes('Netflix-avatar.png')) return;
        if (this._imageErrorCache.has(url)) return;

        this._imageErrorCache.add(url);
        setTimeout(() => this._imageErrorCache.delete(url), 60000);

        this.warn('UI', 'Fallo de carga de imagen', this.sanitizeObject({
            url,
            source,
            className: img?.className || '',
            alt: img?.alt || ''
        }));
    },

    installFetchInterceptor() {
        if (this._fetchPatched || typeof window.fetch !== 'function') return;
        this._fetchPatched = true;

        const nativeFetch = window.fetch.bind(window);

        window.fetch = async (input, init) => {
            const url = typeof input === 'string'
                ? input
                : (input instanceof Request ? input.url : String(input));
            const isTmdb = url.includes('api.themoviedb.org');
            const safeUrl = this.sanitizeTmdbUrl(url);

            try {
                const response = await nativeFetch(input, init);

                if (isTmdb) {
                    if (!response.ok) {
                        this.error('TMDB', `Petición TMDB fallida HTTP ${response.status}`, {
                            url: safeUrl,
                            status: response.status,
                            statusText: response.statusText
                        });
                    } else {
                        try {
                            const clone = response.clone();
                            const data = await clone.json();
                            if (typeof data?.status_code === 'number' && data.status_code >= 400) {
                                this.error('TMDB', data.status_message || 'Error en respuesta TMDB', {
                                    url: safeUrl,
                                    status_code: data.status_code
                                });
                            }
                        } catch {
                            /* respuesta no JSON */
                        }
                    }
                }

                return response;
            } catch (err) {
                if (isTmdb) {
                    this.error('TMDB', `Error de red en petición TMDB: ${err?.message || err}`, {
                        url: safeUrl,
                        errorName: err?.name
                    });
                }
                throw err;
            }
        };
    },

    formatLogFile() {
        const lines = [
            '================================================================================',
            ' NEONSTREAM-VOD — AUDIT LOG',
            ` Generado: ${this.formatTimestamp()}`,
            ` Total entradas: ${this.entries.length}`,
            ` Build: ${APP_BUILD}`,
            '================================================================================',
            ''
        ];

        this.entries.forEach((entry) => {
            lines.push('--------------------------------------------------------------------------------');
            lines.push(`[${entry.timestamp}] | LEVEL: ${entry.level} | CATEGORY: ${entry.category}`);
            lines.push(`Mensaje: ${entry.message}`);
            if (entry.data !== undefined) {
                lines.push('Datos JSON:');
                lines.push(JSON.stringify(entry.data, null, 2));
            }
            lines.push('');
        });

        return `${lines.join('\n')}\n`;
    },

    downloadLogs() {
        const content = this.formatLogFile();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.href = URL.createObjectURL(blob);
        link.download = `neonstream-audit-${stamp}.log`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
        this.success('SYSTEM', 'Archivo .log descargado', { entries: this.entries.length });
    }
};

window.downloadLogs = () => AuditLogger.downloadLogs();
window.clearAuditLogs = () => AuditLogger.clear();

function setupAuditLoggerUI() {
    elements.auditLogBtn?.addEventListener('click', () => AuditLogger.downloadLogs());

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            AuditLogger.downloadLogs();
        }
    });
}

function setupGlobalImageErrorLogging() {
    document.addEventListener('error', (e) => {
        if (e.target?.tagName !== 'IMG') return;
        AuditLogger.logImageFailure(e.target, 'global-capture');
    }, true);
}

AuditLogger.init();

export { AuditLogger, setupAuditLoggerUI, setupGlobalImageErrorLogging };
