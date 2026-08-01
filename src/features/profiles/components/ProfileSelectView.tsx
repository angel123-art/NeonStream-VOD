import { useAppStore } from '@/store/useAppStore';
import type { Profile } from '@/types/profile';
import styles from '../ProfileGate.module.scss';

interface ProfileSelectViewProps {
  onSelect: (profile: Profile) => void;
  onManage: () => void;
}

export function ProfileSelectView({ onSelect, onManage }: ProfileSelectViewProps) {
  const userProfiles = useAppStore((s) => s.userProfiles);
  const profilesLoading = useAppStore((s) => s.profilesLoading);
  const profilesLoadError = useAppStore((s) => s.profilesLoadError);

  return (
    <div className={styles.view}>
      <div className={styles.inner}>
        <h1 id="profile-gate-title" className={styles.title}>¿Quién está viendo ahora?</h1>

        {profilesLoading && (
          <p className={styles.gridLoading}>Cargando perfiles…</p>
        )}

        {!profilesLoading && profilesLoadError && (
          <p className={styles.gridError} role="alert">{profilesLoadError}</p>
        )}

        {!profilesLoading && !profilesLoadError && userProfiles.length === 0 && (
          <p className={styles.gridEmpty}>
            Aún no tienes perfiles. Pulsa «Administrar perfiles» para crear uno.
          </p>
        )}

        {!profilesLoading && userProfiles.length > 0 && (
          <div className={styles.grid}>
            {userProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                className={styles.item}
                aria-label={`Perfil ${profile.name}`}
                onClick={() => onSelect(profile)}
              >
                <img
                  className={styles.avatar}
                  src={profile.avatar}
                  alt={profile.name}
                  width={132}
                  height={132}
                />
                <span className={styles.itemName}>{profile.name}</span>
              </button>
            ))}
          </div>
        )}

        <button type="button" className={styles.manageBtn} onClick={onManage}>
          Administrar perfiles
        </button>
      </div>
    </div>
  );
}
