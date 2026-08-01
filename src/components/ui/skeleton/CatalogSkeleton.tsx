import skeletonStyles from './Skeleton.module.scss';
import layoutStyles from './CatalogSkeleton.module.scss';

interface CatalogRowsSkeletonProps {
  rowCount?: number;
  cardsPerRow?: number;
}

export function CatalogRowsSkeleton({
  rowCount = 5,
  cardsPerRow = 6,
}: CatalogRowsSkeletonProps) {
  return (
    <div className={layoutStyles.rows} role="status" aria-live="polite" aria-label="Cargando catálogo">
      {Array.from({ length: rowCount }, (_, rowIndex) => (
        <div key={rowIndex} className={layoutStyles.row}>
          <div className={skeletonStyles.rowTitle} aria-hidden="true" />
          <div className={layoutStyles.track}>
            {Array.from({ length: cardsPerRow }, (_, cardIndex) => (
              <div
                key={cardIndex}
                className={rowIndex === 0 ? skeletonStyles.wideCard : skeletonStyles.card}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface MovieGridSkeletonProps {
  count?: number;
}

export function MovieGridSkeleton({ count = 18 }: MovieGridSkeletonProps) {
  return (
    <div className={layoutStyles.grid} role="status" aria-live="polite" aria-label="Cargando títulos">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={skeletonStyles.gridCard} aria-hidden="true" />
      ))}
    </div>
  );
}
