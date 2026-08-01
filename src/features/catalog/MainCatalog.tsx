import { useCatalog } from '@/hooks/useCatalog';
import { useNavbarScroll } from '@/hooks/useNavbarScroll';
import { useUrlSync } from '@/hooks/useUrlSync';
import { useNotifications } from '@/hooks/useNotifications';
import { HeroSkeleton } from '@/components/ui/skeleton/HeroSkeleton';
import { CatalogNavbar } from './components/CatalogNavbar';
import { Hero } from './components/Hero';
import { CatalogContent } from './components/CatalogContent';
import { DetailModal } from './components/DetailModal';
import { TrailerModal } from './components/TrailerModal';
import { Player } from './components/Player';
import styles from './MainCatalog.module.scss';

export function MainCatalog() {
  useUrlSync();
  useNotifications();
  const scrolled = useNavbarScroll();
  const {
    catalogView,
    loading,
    error,
    homeData,
    gridData,
    myListItems,
    setGridPage,
  } = useCatalog();

  const isHome = catalogView === 'home';
  const showHero = isHome && !loading && homeData.heroItems.length > 0;
  const showHeroSkeleton = isHome && loading;

  return (
    <div className={styles.shell}>
      <CatalogNavbar scrolled={scrolled} />

      {showHeroSkeleton && <HeroSkeleton />}
      {showHero && <Hero items={homeData.heroItems} />}

      <main className={showHero || showHeroSkeleton ? `${styles.main} ${styles.mainWithHero}` : styles.main}>
        <div className={`container-fluid ${styles.catalogInner}`}>
          <CatalogContent
            catalogView={catalogView}
            loading={loading}
            error={error}
            homeRows={homeData.rows}
            gridItems={gridData.items}
            gridPage={gridData.page}
            gridTotalPages={gridData.totalPages}
            myListItems={myListItems}
            searchQuery={gridData.searchQuery}
            onGridPageChange={setGridPage}
          />
        </div>
      </main>

      <DetailModal />
      <TrailerModal />
      <Player />
    </div>
  );
}
