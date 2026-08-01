import type { ReactNode, SVGProps } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { CatalogView } from '@/types/app';
import styles from './MobileBottomNav.module.scss';

/** Primary destinations reachable from the thumb-zone tab bar (excludes `search`). */
type MobileNavView = Exclude<CatalogView, 'search'>;

interface MobileNavItem {
  id: MobileNavView;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactNode;
}

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  );
}

function SeriesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 19v2M17 19v2M8 9h8M8 13h5" />
    </svg>
  );
}

function MoviesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M7 5v14M17 5v14M2 9.5h20M2 14.5h20" />
    </svg>
  );
}

function NewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <circle cx="12" cy="12" r="5" />
    </svg>
  );
}

function MyListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d="M12 5v14M5 12h14" />
      <rect x="3" y="3" width="18" height="18" rx="3" />
    </svg>
  );
}

const MOBILE_NAV_ITEMS: readonly MobileNavItem[] = [
  { id: 'home', label: 'Inicio', icon: HomeIcon },
  { id: 'series', label: 'Series', icon: SeriesIcon },
  { id: 'movies', label: 'Películas', icon: MoviesIcon },
  { id: 'new', label: 'Novedades', icon: NewIcon },
  { id: 'mylist', label: 'Mi Lista', icon: MyListIcon },
];

export function MobileBottomNav() {
  const catalogView = useAppStore((s) => s.catalogView);
  const setCatalogView = useAppStore((s) => s.setCatalogView);

  return (
    <nav className={styles.bar} aria-label="Navegación principal">
      <ul className={styles.list} role="list">
        {MOBILE_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = catalogView === id;

          return (
            <li key={id} className={styles.item}>
              <button
                type="button"
                className={isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                onClick={() => setCatalogView(id)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={styles.icon} width={22} height={22} />
                <span className={styles.label}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
