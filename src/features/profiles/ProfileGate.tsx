import { useAppStore } from '@/store/useAppStore';
import { useProfileGate } from '@/hooks/useProfileGate';
import { ProfileSelectView } from './components/ProfileSelectView';
import { ProfileManageView } from './components/ProfileManageView';
import { ProfileEditor } from './components/ProfileEditor';
import styles from './ProfileGate.module.scss';

export function ProfileGate() {
  const profileGateView = useAppStore((s) => s.profileGateView);

  const {
    isExiting,
    editorOpen,
    editingProfileId,
    editorError,
    saving,
    deleting,
    signingOut,
    selectProfile,
    openManage,
    closeManage,
    openEditor,
    closeEditor,
    saveProfile,
    deleteProfile,
    signOut,
  } = useProfileGate();

  return (
    <div
      className={isExiting ? `${styles.gate} ${styles.fadeOut}` : styles.gate}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-gate-title"
    >
      {profileGateView === 'select' ? (
        <ProfileSelectView onSelect={selectProfile} onManage={openManage} />
      ) : (
        <ProfileManageView
          onEdit={(id) => openEditor(id)}
          onAdd={() => openEditor(null)}
          onDone={closeManage}
        />
      )}

      {editorOpen && (
        <ProfileEditor
          profileId={editingProfileId}
          error={editorError}
          saving={saving}
          deleting={deleting}
          onSave={saveProfile}
          onDelete={deleteProfile}
          onCancel={closeEditor}
        />
      )}

      <button
        type="button"
        className={styles.signOutBtn}
        onClick={() => void signOut()}
        disabled={signingOut}
      >
        {signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>
    </div>
  );
}
