import { useEffect, useState, type FormEvent } from 'react';
import { AVATAR_PRESETS } from '@/data/avatar-presets';
import { useAppStore } from '@/store/useAppStore';
import { getEditorInitialState, type ProfileEditorFormState } from '@/hooks/useProfileGate';
import styles from '../ProfileGate.module.scss';

interface ProfileEditorProps {
  profileId: string | null;
  error: string | null;
  saving: boolean;
  deleting: boolean;
  onSave: (form: ProfileEditorFormState) => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

export function ProfileEditor({
  profileId,
  error,
  saving,
  deleting,
  onSave,
  onDelete,
  onCancel,
}: ProfileEditorProps) {
  const userProfiles = useAppStore((s) => s.userProfiles);
  const isEdit = Boolean(profileId);

  const [form, setForm] = useState<ProfileEditorFormState>(() =>
    getEditorInitialState(profileId, userProfiles),
  );

  useEffect(() => {
    setForm(getEditorInitialState(profileId, userProfiles));
  }, [profileId, userProfiles]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void onSave(form);
  };

  return (
    <div
      className={styles.editorOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-editor-title"
    >
      <div className={styles.editorInner}>
        <h2 id="profile-editor-title" className={styles.editorTitle}>
          {isEdit ? 'Editar perfil' : 'Añadir perfil'}
        </h2>

        <form className={styles.editorForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.editorPreview}>
            <img src={form.avatarUrl} alt="" width={120} height={120} />
          </div>

          <label className={styles.editorLabel} htmlFor="profile-editor-name">
            Nombre
          </label>
          <input
            id="profile-editor-name"
            type="text"
            className={styles.editorInput}
            maxLength={20}
            placeholder="Nombre del perfil"
            autoComplete="off"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            autoFocus
          />

          <div className={styles.editorKidsRow}>
            <label className={styles.editorKidsLabel} htmlFor="profile-editor-is-kids">
              <span className={styles.editorKidsText}>¿Perfil para niños?</span>
              <span className={styles.toggle}>
                <input
                  id="profile-editor-is-kids"
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={form.isKids}
                  onChange={(e) => setForm((prev) => ({ ...prev, isKids: e.target.checked }))}
                />
                <span className={styles.toggleTrack} aria-hidden="true" />
              </span>
            </label>
          </div>

          <p className={styles.editorLabel}>Icono del perfil</p>
          <div className={styles.avatarPicker}>
            {AVATAR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={
                  form.avatarUrl === preset.url
                    ? `${styles.avatarOption} ${styles.avatarOptionSelected}`
                    : styles.avatarOption
                }
                aria-label={`Avatar ${preset.id}`}
                aria-pressed={form.avatarUrl === preset.url}
                onClick={() => setForm((prev) => ({ ...prev, avatarUrl: preset.url }))}
              >
                <img src={preset.url} alt="" loading="lazy" />
              </button>
            ))}
          </div>

          {error && (
            <p className={styles.editorError} role="alert">
              {error}
            </p>
          )}

          <div className={styles.editorActions}>
            <button type="submit" className={styles.saveBtn} disabled={saving || deleting}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={saving || deleting}>
              Cancelar
            </button>
            {isEdit && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => void onDelete()}
                disabled={saving || deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar perfil'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
