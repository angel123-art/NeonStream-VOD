/** NeonStream-VOD — profiles.js */
import {
    KIDS_MOVIE_CERT,
    KIDS_TV_CERT,
    MAX_PROFILES,
    PROFILE_LOCAL_KEY,
    PROFILE_SESSION_KEY
} from './config.js';
import { AVATAR_PRESETS } from './data-presets.js';
import { elements, appState } from './state.js';
import { AuditLogger } from './audit-logger.js';
import { handleSignOut, logSupabaseError } from './auth.js';
import { checkUrlState } from './catalog.js';
import { startNotificationsPolling } from './notifications.js';
import { hideLandingGate } from './landing.js';
import { resetGenreButtons } from './helpers.js';

// ============================================
// Profile Gate — CRUD con Supabase (tabla perfiles)
// ============================================
function mapProfileFromDb(row) {
    return normalizeProfile({
        id: row.id,
        user_id: row.user_id,
        name: row.nombre,
        avatar: row.avatar || AVATAR_PRESETS[0].url,
        is_kids: row.is_kids
    });
}

function normalizeIsKids(value) {
    if (value === true || value === 1) return true;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'true' || normalized === '1';
    }
    return false;
}

function normalizeProfile(profile) {
    if (!profile?.id) return null;
    return {
        ...profile,
        is_kids: normalizeIsKids(profile.is_kids)
    };
}

function isKidsProfile() {
    return appState.currentProfile?.is_kids === true;
}

function getKidsMovieParams() {
    return `${KIDS_MOVIE_CERT}&with_genres=10751,16`;
}

function getKidsTvParams() {
    return `${KIDS_TV_CERT}&with_genres=10751,16`;
}

function applyKidsModeUI() {
    const kids = appState.currentProfile?.is_kids === true;

    elements.logoHome?.classList.toggle('kids-mode', kids);
    elements.netflixKidsLabel?.classList.toggle('hidden', !kids);
    elements.genreFilters?.classList.toggle('kids-mode', kids);

    if (!kids && elements.genreFilters?.classList.contains('kids-mode')) {
        elements.genreFilters.classList.remove('kids-mode');
    }

    if (kids && elements.genreFilters?.querySelector('.genre-btn.active[data-kids-hide="true"]')) {
        resetGenreButtons();
    }
}

async function loadUserProfiles() {
    if (!appState.supabaseClient || !appState.currentUser) {
        appState.userProfiles = [];
        return appState.userProfiles;
    }

    appState.profilesLoading = true;

    const { data, error } = await appState.supabaseClient
        .from('perfiles')
        .select('id, user_id, nombre, avatar, is_kids, created_at')
        .eq('user_id', appState.currentUser.id)
        .order('created_at', { ascending: true });

    appState.profilesLoading = false;

    if (error) {
        logSupabaseError('loadUserProfiles', error, { userId: appState.currentUser.id });
        throw error;
    }

    appState.userProfiles = (data || []).map(mapProfileFromDb);
    return appState.userProfiles;
}

function getProfiles() {
    return appState.userProfiles;
}

function getProfileLocalStorageKey(userId) {
    return `${PROFILE_LOCAL_KEY}_${userId}`;
}

function parseStoredProfile(raw) {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed?.id && parsed?.name) return normalizeProfile(parsed);
    } catch {
        /* perfil corrupto */
    }
    return null;
}

function getActiveProfile() {
    const userId = appState.currentUser?.id;

    const fromSession = parseStoredProfile(sessionStorage.getItem(PROFILE_SESSION_KEY));
    if (fromSession) {
        if (userId && fromSession.user_id && fromSession.user_id !== userId) {
            sessionStorage.removeItem(PROFILE_SESSION_KEY);
        } else {
            const match = appState.userProfiles.find(p => p.id === fromSession.id);
            return normalizeProfile(match || fromSession);
        }
    }

    if (userId) {
        const fromLocal = parseStoredProfile(localStorage.getItem(getProfileLocalStorageKey(userId)));
        if (fromLocal && (!fromLocal.user_id || fromLocal.user_id === userId)) {
            const match = appState.userProfiles.find(p => p.id === fromLocal.id);
            const profile = normalizeProfile(match || fromLocal);
            sessionStorage.setItem(PROFILE_SESSION_KEY, JSON.stringify(profile));
            return profile;
        }
    }

    return null;
}

function setActiveProfile(profile) {
    if (!profile?.id) return;

    const fresh = appState.userProfiles.find(p => p.id === profile.id);
    appState.currentProfile = normalizeProfile(fresh ? { ...fresh, ...profile } : profile);
    const payload = JSON.stringify(appState.currentProfile);
    sessionStorage.setItem(PROFILE_SESSION_KEY, payload);

    const userId = profile.user_id || appState.currentUser?.id;
    if (userId) {
        localStorage.setItem(getProfileLocalStorageKey(userId), payload);
    }

    updateNavbarProfileAvatar(profile);
    applyKidsModeUI();
}

function clearActiveProfile(userId = appState.currentUser?.id) {
    appState.currentProfile = null;
    sessionStorage.removeItem(PROFILE_SESSION_KEY);
    if (userId) {
        localStorage.removeItem(getProfileLocalStorageKey(userId));
    }
    applyKidsModeUI();
}

function isProfileGateVisible() {
    return !elements.profileGate?.classList.contains('hidden');
}

function tryRestoreProfileSession({ reloadCatalog = false } = {}) {
    if (!appState.currentUser) return false;

    const active = getActiveProfile();
    if (!active) return false;

    const fresh = appState.userProfiles.find(p => p.id === active.id);
    if (appState.userProfiles.length > 0 && !fresh) {
        clearActiveProfile(appState.currentUser.id);
        return false;
    }

    const profile = fresh || active;
    setActiveProfile(profile);
    revealApp();
    elements.profileGate?.classList.add('hidden');
    document.body.classList.remove('profile-gate-active');

    if (reloadCatalog) {
        checkUrlState();
    }

    return true;
}

function setupProfilePersistence() {
    window.addEventListener('pageshow', (event) => {
        if (!appState.currentUser) return;
        if (tryRestoreProfileSession()) {
            console.info('[Perfil] Restaurado tras pageshow', { persisted: event.persisted });
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible' || !appState.currentUser) return;
        if (isProfileGateVisible() && tryRestoreProfileSession()) {
            console.info('[Perfil] Restaurado al volver a la pestaña');
        }
    });
}

function setupProfileGate() {
    if (!elements.profileGrid || appState.profileGateInitialized) return;
    appState.profileGateInitialized = true;

    renderAvatarPicker();

    elements.profileGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.profile-item[data-profile-id]');
        if (!btn) return;
        const profile = getProfiles().find(p => p.id === btn.dataset.profileId);
        if (profile) selectProfile(profile);
    });

    elements.profileManageGrid?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.profile-manage-item[data-profile-id]');
        if (editBtn) {
            openProfileEditor(editBtn.dataset.profileId);
            return;
        }
        const addBtn = e.target.closest('.profile-add-item');
        if (addBtn) openProfileEditor(null);
    });

    elements.profileManageBtn?.addEventListener('click', openProfileManage);
    elements.profileDoneBtn?.addEventListener('click', closeProfileManage);
    elements.profileSignoutBtn?.addEventListener('click', handleSignOut);
    elements.profileBtn?.addEventListener('click', () => openProfileGate('select'));
    elements.profileCancelBtn?.addEventListener('click', closeProfileEditor);
    elements.profileDeleteBtn?.addEventListener('click', handleDeleteProfile);
    elements.profileEditorForm?.addEventListener('submit', handleProfileFormSubmit);

    elements.profileAvatarPicker?.addEventListener('click', (e) => {
        const option = e.target.closest('.profile-avatar-option');
        if (!option) return;
        appState.selectedAvatarUrl = option.dataset.avatarUrl;
        updateAvatarPickerSelection();
        if (elements.profileEditorAvatarPreview) {
            elements.profileEditorAvatarPreview.src = appState.selectedAvatarUrl;
        }
    });
}

function showProfileGridError(message) {
    if (elements.profileGrid) {
        elements.profileGrid.innerHTML = `<p class="profile-grid-error">${escapeHtml(message)}</p>`;
    }
}

function renderProfileSelectGrid() {
    if (!elements.profileGrid) return;

    if (appState.profilesLoading) {
        elements.profileGrid.innerHTML = '<p class="profile-grid-loading">Cargando perfiles...</p>';
        return;
    }

    const profiles = getProfiles();

    if (profiles.length === 0) {
        elements.profileGrid.innerHTML = `
            <p class="profile-grid-empty">Aún no tienes perfiles. Pulsa «Administrar perfiles» para crear uno.</p>`;
        return;
    }

    elements.profileGrid.innerHTML = profiles.map(profile => `
        <button type="button" class="profile-item" data-profile-id="${profile.id}" aria-label="Perfil ${escapeHtml(profile.name)}">
            <img class="profile-item-avatar" src="${profile.avatar}" alt="${escapeHtml(profile.name)}" width="132" height="132">
            <span class="profile-item-name">${escapeHtml(profile.name)}</span>
        </button>
    `).join('');
}

function renderProfileManageGrid() {
    if (!elements.profileManageGrid) return;

    if (appState.profilesLoading) {
        elements.profileManageGrid.innerHTML = '<p class="profile-grid-loading">Cargando perfiles...</p>';
        return;
    }

    const profiles = getProfiles();
    let html = profiles.map(profile => `
        <button type="button" class="profile-manage-item" data-profile-id="${profile.id}" aria-label="Editar perfil ${escapeHtml(profile.name)}">
            <img class="profile-item-avatar" src="${profile.avatar}" alt="${escapeHtml(profile.name)}" width="132" height="132">
            <span class="profile-edit-badge" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </span>
            <span class="profile-item-name">${escapeHtml(profile.name)}</span>
        </button>
    `).join('');

    if (profiles.length < MAX_PROFILES) {
        html += `
            <button type="button" class="profile-add-item" aria-label="Añadir perfil">
                <span class="profile-add-tile">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </span>
                <span class="profile-item-name">Añadir perfil</span>
            </button>`;
    }

    elements.profileManageGrid.innerHTML = html;
}

function renderAvatarPicker() {
    if (!elements.profileAvatarPicker) return;

    elements.profileAvatarPicker.innerHTML = AVATAR_PRESETS.map(preset => `
        <button type="button" class="profile-avatar-option" data-avatar-url="${preset.url}" aria-label="Avatar ${preset.id}">
            <img src="${preset.url}" alt="" loading="lazy">
        </button>
    `).join('');
}

function updateAvatarPickerSelection() {
    elements.profileAvatarPicker?.querySelectorAll('.profile-avatar-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.avatarUrl === appState.selectedAvatarUrl);
    });
}

function openProfileManage() {
    renderProfileManageGrid();
    elements.profileSelectView?.classList.add('hidden');
    elements.profileManageView?.classList.remove('hidden');
}

function closeProfileManage() {
    renderProfileSelectGrid();
    elements.profileManageView?.classList.add('hidden');
    elements.profileSelectView?.classList.remove('hidden');
}

function openProfileEditor(profileId) {
    appState.editingProfileId = profileId;
    const isEdit = Boolean(profileId);
    const profile = isEdit ? getProfiles().find(p => p.id === profileId) : null;

    elements.profileEditorTitle.textContent = isEdit ? 'Editar perfil' : 'Añadir perfil';
    elements.profileEditorName.value = profile?.name || '';
    if (elements.profileEditorIsKids) {
        elements.profileEditorIsKids.checked = Boolean(profile?.is_kids);
    }
    appState.selectedAvatarUrl = profile?.avatar || AVATAR_PRESETS[0].url;

    if (elements.profileEditorAvatarPreview) {
        elements.profileEditorAvatarPreview.src = appState.selectedAvatarUrl;
    }

    elements.profileDeleteBtn?.classList.toggle('hidden', !isEdit);
    hideProfileEditorError();
    updateAvatarPickerSelection();

    elements.profileEditor?.classList.remove('hidden');
    elements.profileEditorName?.focus();
}

function closeProfileEditor() {
    appState.editingProfileId = null;
    elements.profileEditor?.classList.add('hidden');
    elements.profileEditorForm?.reset();
    hideProfileEditorError();
}

function showProfileEditorError(message) {
    if (!elements.profileEditorError) return;
    elements.profileEditorError.textContent = message;
    elements.profileEditorError.classList.remove('hidden');
}

function hideProfileEditorError() {
    elements.profileEditorError?.classList.add('hidden');
}

function handleProfileFormSubmit(e) {
    e.preventDefault();
    handleProfileFormSubmitAsync();
}

async function handleProfileFormSubmitAsync() {
    if (!appState.supabaseClient || !appState.currentUser) {
        showProfileEditorError('Debes iniciar sesión para guardar perfiles.');
        return;
    }

    const name = elements.profileEditorName?.value.trim();
    const isKids = Boolean(elements.profileEditorIsKids?.checked);
    if (!name) {
        showProfileEditorError('Introduce un nombre para el perfil.');
        return;
    }
    if (name.length > 20) {
        showProfileEditorError('El nombre no puede superar 20 caracteres.');
        return;
    }

    const profiles = getProfiles();
    const saveBtn = document.getElementById('profile-save-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
    }

    try {
        if (appState.editingProfileId) {
            const duplicate = profiles.some(
                p => p.id !== appState.editingProfileId && p.name.toLowerCase() === name.toLowerCase()
            );
            if (duplicate) {
                showProfileEditorError('Ya existe un perfil con ese nombre.');
                return;
            }

            const { data, error } = await appState.supabaseClient
                .from('perfiles')
                .update({ nombre: name, avatar: appState.selectedAvatarUrl, is_kids: isKids })
                .eq('id', appState.editingProfileId)
                .eq('user_id', appState.currentUser.id)
                .select('id, user_id, nombre, avatar, is_kids, created_at')
                .single();

            if (error) throw error;

            await loadUserProfiles();

            const active = getActiveProfile();
            const updated = mapProfileFromDb(data);
            if (active?.id === appState.editingProfileId) {
                setActiveProfile(updated);
                if (appState.currentView === 'home') {
                    loadHomeRows();
                }
            }

            AuditLogger.success('AUTH', 'Perfil actualizado', {
                profile: AuditLogger.sanitizeProfile(updated)
            });
        } else {
            if (profiles.length >= MAX_PROFILES) {
                showProfileEditorError(`Máximo ${MAX_PROFILES} perfiles permitidos.`);
                return;
            }

            const duplicate = profiles.some(p => p.name.toLowerCase() === name.toLowerCase());
            if (duplicate) {
                showProfileEditorError('Ya existe un perfil con ese nombre.');
                return;
            }

            const { error } = await appState.supabaseClient
                .from('perfiles')
                .insert({
                    user_id: appState.currentUser.id,
                    nombre: name,
                    avatar: appState.selectedAvatarUrl,
                    is_kids: isKids
                });

            if (error) throw error;

            await loadUserProfiles();

            const created = getProfiles().find(p => p.name.toLowerCase() === name.toLowerCase());
            AuditLogger.success('AUTH', 'Perfil creado', {
                profile: AuditLogger.sanitizeProfile(created)
            });
        }

        closeProfileEditor();
        renderProfileManageGrid();
        renderProfileSelectGrid();
    } catch (err) {
        logSupabaseError('handleProfileFormSubmit', err, { editingProfileId: appState.editingProfileId, name });
        showProfileEditorError(err.message || 'No se pudo guardar el perfil.');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar';
        }
    }
}

function handleDeleteProfile() {
    handleDeleteProfileAsync();
}

async function handleDeleteProfileAsync() {
    if (!appState.editingProfileId || !appState.supabaseClient || !appState.currentUser) return;

    const profiles = getProfiles();
    const deleted = profiles.find(p => p.id === appState.editingProfileId);
    if (!deleted) return;

    const deleteBtn = elements.profileDeleteBtn;
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Eliminando...';
    }

    try {
        const { error } = await appState.supabaseClient
            .from('perfiles')
            .delete()
            .eq('id', appState.editingProfileId)
            .eq('user_id', appState.currentUser.id);

        if (error) throw error;

        await loadUserProfiles();

        const active = getActiveProfile();
        if (active?.id === deleted.id) {
            const remaining = getProfiles();
            if (remaining.length > 0) {
                setActiveProfile(remaining[0]);
            } else {
                clearActiveProfile(appState.currentUser.id);
            }
        }

        closeProfileEditor();
        renderProfileManageGrid();
        renderProfileSelectGrid();
    } catch (err) {
        logSupabaseError('handleDeleteProfile', err, { editingProfileId: appState.editingProfileId });
        showProfileEditorError(err.message || 'No se pudo eliminar el perfil.');
    } finally {
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Eliminar perfil';
        }
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function playTaDum() {
    const audio = elements.tadumAudio;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function selectProfile(profile, { reloadCatalog = true } = {}) {
    AuditLogger.success('AUTH', 'Perfil seleccionado', {
        profile: AuditLogger.sanitizeProfile(profile)
    });

    setActiveProfile(profile);
    playTaDum();

    elements.profileGate?.classList.add('fade-out');

    setTimeout(() => {
        elements.profileGate?.classList.add('hidden');
        elements.profileGate?.classList.remove('fade-out');
        closeProfileManage();
        revealApp();
        if (reloadCatalog) checkUrlState();
    }, 650);
}

function revealApp() {
    hideLandingGate();
    document.body.classList.remove('profile-gate-active', 'landing-gate-active', 'auth-gate-active');
    applyKidsModeUI();
    startNotificationsPolling();
}

function openProfileGate(view = 'select') {
    elements.profileGate?.classList.remove('hidden', 'fade-out');
    document.body.classList.add('profile-gate-active');

    renderProfileSelectGrid();

    if (view === 'manage') {
        openProfileManage();
    } else {
        closeProfileManage();
    }
}

function updateNavbarProfileAvatar(profile) {
    const img = elements.profileBtn?.querySelector('img');
    if (img && profile?.avatar) {
        img.src = profile.avatar;
        img.alt = profile.name;
    }
}

export {
    isKidsProfile,
    getKidsMovieParams,
    getKidsTvParams,
    loadUserProfiles,
    getProfiles,
    clearActiveProfile,
    tryRestoreProfileSession,
    setupProfilePersistence,
    setupProfileGate,
    renderProfileSelectGrid,
    selectProfile,
    revealApp,
    openProfileGate,
    closeProfileEditor,
    closeProfileManage,
    escapeHtml
};
