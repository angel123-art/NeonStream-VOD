import { useAppStore } from '@/store/useAppStore';
import { MAX_PROFILES } from '@/services/config';
import styles from '../ProfileGate.module.scss';

interface ProfileManageViewProps {
  onEdit: (profileId: string) => void;
  onAdd: () => void;
  onDone: () => void;
}

function EditBadgeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function AddIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ProfileManageView({ onEdit, onAdd, onDone }: ProfileManageViewProps) {
  const userProfiles = useAppStore((s) => s.userProfiles);
  const profilesLoading = useAppStore((s) => s.profilesLoading);

  return (
    <div className={styles.view}>
      <div className={styles.inner}>
        <h1 id="profile-gate-title" className={styles.title}>Administrar perfiles</h1>

        {profilesLoading ? (
          <p className={styles.gridLoading}>Cargando perfiles…</p>
        ) : (
          <div className={styles.grid}>
            {userProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={styles.manageItem}
                aria-label={`Editar perfil ${profile.name}`}
                onClick={() => onEdit(profile.id)}
              >
                <img
                  className={styles.avatar}
                  src={profile.avatar}
                  alt={profile.name}
                  width={132}
                  height={132}
                />
                <span className={styles.editBadge} aria-hidden="true">
                  <EditBadgeIcon />
                </span>
                <span className={styles.itemName}>{profile.name}</span>
              </button>
            ))}

            {userProfiles.length < MAX_PROFILES && (
              <button
                type="button"
                className={styles.addItem}
                aria-label="Añadir perfil"
                onClick={onAdd}
              >
                <span className={styles.addTile}>
                  <AddIcon />
                </span>
                <span className={styles.itemName}>Añadir perfil</span>
              </button>
            )}
          </div>
        )}

        <div className={styles.manageActions}>
          <button type="button" className={styles.doneBtn} onClick={onDone}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
