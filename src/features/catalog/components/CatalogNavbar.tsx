import { useAppStore } from '@/store/useAppStore';
import { useNavbarSearch } from '@/hooks/useNavbarSearch';
import { buildTmdbImageUrl } from '@/services/tmdb';
import { getMediaTitle, resolveMediaType } from '@/types/movie';
import type { CatalogView } from '@/types/app';
import { NotificationsPanel } from './NotificationsPanel';
import layoutStyles from '../MainCatalog.module.scss';
import searchStyles from './CatalogNavbar.module.scss';

const NETFLIX_WORDMARK =
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg';

/** Inline N mark — always renders on mobile (no external CDN dependency). */
function NetflixNLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={28}
      height={28}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#e50914"
        d="M96 32h86.4l147.2 288.5V32H416v448h-86.4L182.4 191.5V480H96V32z"
      />
    </svg>
  );
}

const NAV_VIEWS: { id: CatalogView; label: string }[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'series', label: 'Series' },
  { id: 'movies', label: 'Películas' },
  { id: 'new', label: 'Novedades' },
  { id: 'mylist', label: 'Mi Lista' },
];

interface CatalogNavbarProps {
  scrolled: boolean;
}

export function CatalogNavbar({ scrolled }: CatalogNavbarProps) {
  const activeProfile = useAppStore((s) => s.activeProfile);
  const catalogView = useAppStore((s) => s.catalogView);
  const setCatalogView = useAppStore((s) => s.setCatalogView);
  const openProfileGate = useAppStore((s) => s.openProfileGate);

  const {
    wrapperRef,
    inputRef,
    query,
    setQuery,
    results,
    loading,
    showDropdown,
    searchOpen,
    toggleSearch,
    handleSubmit,
    handleSelectResult,
  } = useNavbarSearch();

  const isKids = activeProfile?.is_kids === true;

  const handleNavClick = (view: CatalogView) => {
    setCatalogView(view);
  };

  return (
    <header className={scrolled ? `${layoutStyles.navbar} ${layoutStyles.navbarScrolled}` : layoutStyles.navbar}>
      <div className={layoutStyles.navContainer}>
        <div className={layoutStyles.navLeft}>
          <button
            type="button"
            className={isKids ? `${layoutStyles.brand} ${layoutStyles.brandKids}` : layoutStyles.brand}
            onClick={() => handleNavClick('home')}
            aria-label="Netflix Inicio"
          >
            <NetflixNLogo className={layoutStyles.brandIcon} />
            <img className={layoutStyles.brandWordmark} src={NETFLIX_WORDMARK} alt="Netflix" width={110} height={30} />
            {isKids && <span className={layoutStyles.kidsLabel}>Kids</span>}
          </button>

          <nav className={layoutStyles.nav} aria-label="Principal">
            {NAV_VIEWS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={catalogView === id ? layoutStyles.navLinkActive : layoutStyles.navLink}
                onClick={() => handleNavClick(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className={searchStyles.navRight}>
          <div
            ref={wrapperRef}
            className={searchOpen ? `${searchStyles.searchWrapper} ${searchStyles.searchOpen}` : searchStyles.searchWrapper}
          >
            <button
              type="button"
              className={searchStyles.searchToggle}
              onClick={toggleSearch}
              aria-label={searchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
              aria-expanded={searchOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            <div className={searchStyles.searchExpand}>
              <input
                ref={inputRef}
                type="search"
                className={searchStyles.searchInput}
                placeholder="Títulos, personas, géneros"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                  if (e.key === 'Escape') toggleSearch();
                }}
                aria-label="Buscar títulos"
                aria-autocomplete="list"
                aria-controls="search-results"
              />
              <button
                type="button"
                className={searchStyles.searchSubmit}
                onClick={handleSubmit}
                aria-label="Buscar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>

            {showDropdown && searchOpen && query.trim().length >= 2 && (
              <div id="search-results" className={searchStyles.dropdown} role="listbox">
                {loading && (
                  <p className={searchStyles.dropdownLoading} role="status">Buscando…</p>
                )}
                {!loading && results.length === 0 && (
                  <p className={searchStyles.dropdownEmpty}>Sin resultados</p>
                )}
                {!loading && results.map((item) => {
                  const title = getMediaTitle(item);
                  const type = resolveMediaType(item);
                  const posterUrl = buildTmdbImageUrl(item.poster_path, 'w200');

                  return (
                    <button
                      key={`${type}-${item.id}`}
                      type="button"
                      className={searchStyles.dropdownItem}
                      role="option"
                      onClick={() => handleSelectResult(item)}
                    >
                      {posterUrl && <img src={posterUrl} alt="" loading="lazy" />}
                      <span className={searchStyles.dropdownMeta}>
                        <span className={searchStyles.dropdownTitle}>{title}</span>
                        <span className={searchStyles.dropdownType}>
                          {type === 'tv' ? 'Serie' : 'Película'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <NotificationsPanel />

          <button
            type="button"
            className={layoutStyles.profileBtn}
            onClick={() => openProfileGate('select')}
            aria-label={`Perfil: ${activeProfile?.name ?? 'Cambiar perfil'}`}
          >
            {activeProfile && (
              <img src={activeProfile.avatar} alt={activeProfile.name} width={32} height={32} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
