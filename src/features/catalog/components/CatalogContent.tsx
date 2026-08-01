import { Row } from './Row';
import { MovieGrid } from './MovieGrid';
import { GenreFilters } from './GenreFilters';
import { ContinueWatchingRow } from './ContinueWatchingRow';
import { CATALOG_VIEW_LABELS } from '@/types/catalog';
import { CatalogRowsSkeleton, MovieGridSkeleton } from '@/components/ui/skeleton/CatalogSkeleton';
import type { CatalogRow } from '@/types/catalog';
import type { CatalogView } from '@/types/app';
import type { MediaItem } from '@/types/movie';
import styles from './CatalogContent.module.scss';

interface CatalogContentProps {
  catalogView: CatalogView;
  loading: boolean;
  error: string | null;
  homeRows: CatalogRow[];
  gridItems: MediaItem[];
  gridPage: number;
  gridTotalPages: number;
  myListItems: MediaItem[];
  searchQuery?: string;
  onGridPageChange: (page: number) => void;
}

export function CatalogContent({
  catalogView,
  loading,
  error,
  homeRows,
  gridItems,
  gridPage,
  gridTotalPages,
  myListItems,
  searchQuery,
  onGridPageChange,
}: CatalogContentProps) {
  if (error) {
    return <p className={styles.error} role="alert">{error}</p>;
  }

  if (loading && catalogView === 'home') {
    return <CatalogRowsSkeleton rowCount={5} cardsPerRow={6} />;
  }

  if (loading && (catalogView === 'movies' || catalogView === 'series' || catalogView === 'new' || catalogView === 'search')) {
    return (
      <>
        <GenreFilters catalogView={catalogView} />
        <MovieGridSkeleton count={18} />
      </>
    );
  }

  if (catalogView === 'home') {
    return (
      <div className={styles.rows}>
        <ContinueWatchingRow />
        {homeRows.map((row) => (
          <Row key={row.id} row={row} />
        ))}
      </div>
    );
  }

  if (catalogView === 'mylist') {
    if (myListItems.length === 0) {
      return (
        <div className={styles.emptyList}>
          <p>Tu lista está vacía.</p>
          <p className={styles.emptyHint}>
            Explora el catálogo y pulsa + en cualquier título para añadirlo.
          </p>
        </div>
      );
    }
    return (
      <>
        <h1 className={styles.sectionTitle}>{CATALOG_VIEW_LABELS.mylist}</h1>
        <MovieGrid items={myListItems} page={1} totalPages={1} onPageChange={() => {}} />
      </>
    );
  }

  if (catalogView === 'search') {
    return (
      <>
        <h1 className={styles.sectionTitle}>
          Resultados para &ldquo;{searchQuery}&rdquo;
        </h1>
        {gridItems.length === 0 ? (
          <div className={styles.emptyList}>
            <p>No se encontraron títulos.</p>
            <p className={styles.emptyHint}>Prueba con otro término de búsqueda.</p>
          </div>
        ) : (
          <MovieGrid
            items={gridItems}
            page={gridPage}
            totalPages={gridTotalPages}
            onPageChange={onGridPageChange}
          />
        )}
      </>
    );
  }

  const title = CATALOG_VIEW_LABELS[catalogView];

  return (
    <>
      <h1 className={styles.sectionTitle}>{title}</h1>
      <GenreFilters catalogView={catalogView} />
      <MovieGrid
        items={gridItems}
        page={gridPage}
        totalPages={gridTotalPages}
        onPageChange={onGridPageChange}
      />
    </>
  );
}
