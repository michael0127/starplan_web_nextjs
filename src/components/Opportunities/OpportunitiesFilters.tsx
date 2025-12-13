'use client';

import styles from './OpportunitiesFilters.module.css';

export type SortOption = 'best_match' | 'trending' | 'newest' | 'most_pay';

interface OpportunitiesFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onReferralClick?: () => void;
}

export function OpportunitiesFilters({
  searchValue,
  onSearchChange,
  activeSort,
  onSortChange,
  onReferralClick,
}: OpportunitiesFiltersProps) {
  return (
    <div className={styles.root}>
      <div className={styles.search}>
        <span className={styles.searchIcon} aria-hidden="true" />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Type to search roles, skills, or companies"
          aria-label="Search opportunities"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className={styles.filtersRow}>
        <button
          type="button"
          className={`${styles.filterButton} ${
            activeSort === 'best_match' ? styles.filterButtonActive : ''
          }`}
          onClick={() => onSortChange('best_match')}
        >
          Best match
        </button>
        <button
          type="button"
          className={`${styles.filterButton} ${
            activeSort === 'trending' ? styles.filterButtonActive : ''
          }`}
          onClick={() => onSortChange('trending')}
        >
          Trending
        </button>
        <button
          type="button"
          className={`${styles.filterButton} ${
            activeSort === 'newest' ? styles.filterButtonActive : ''
          }`}
          onClick={() => onSortChange('newest')}
        >
          Newest
        </button>
        <button
          type="button"
          className={`${styles.filterButton} ${
            activeSort === 'most_pay' ? styles.filterButtonActive : ''
          }`}
          onClick={() => onSortChange('most_pay')}
        >
          Most pay
        </button>
        <button
          type="button"
          className={styles.ctaButton}
          onClick={onReferralClick}
        >
          Refer &amp; earn
        </button>
      </div>
    </div>
  );
}






























