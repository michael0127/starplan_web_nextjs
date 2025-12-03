'use client';

import { useEffect, useMemo, useState } from 'react';
import { OpportunitiesFilters, SortOption } from './OpportunitiesFilters';
import { OpportunitiesGrid } from './OpportunitiesGrid';
import { Opportunity } from './OpportunityCard';
import styles from '@/app/explore/page.module.css';

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'senior-review',
    title: 'Senior/Staff Code Review Expert',
    minRate: 40,
    maxRate: 125,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 90,
    avgPayout: 250,
  },
  {
    id: 'saas-reviewer',
    title: 'SaaS Software Data Reviewer',
    minRate: 30,
    maxRate: 37,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 39,
    avgPayout: 100,
  },
  {
    id: 'python-backend',
    title: 'Backend Software Engineer: Python',
    minRate: 80,
    maxRate: 120,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 28,
    avgPayout: 300,
  },
  {
    id: 'go-backend',
    title: 'Backend Software Engineer: Go',
    minRate: 80,
    maxRate: 100,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 10,
    avgPayout: 250,
  },
  {
    id: 'math-expert',
    title: "Mathematics Expert (Master's / PhD)",
    minRate: 60,
    maxRate: 80,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 174,
    avgPayout: 250,
  },
  {
    id: 'annotation',
    title: 'Digital Annotation Expert',
    minRate: 16,
    maxRate: 16,
    currency: '$',
    unit: 'hour',
    hiredThisMonth: 4069,
    avgPayout: 50,
  },
];

export function OpportunitiesPage() {
  const [searchValue, setSearchValue] = useState('');
  const [activeSort, setActiveSort] = useState<SortOption>('best_match');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  useEffect(() => {
    const determinePerPage = (width: number) => {
      if (width >= 1280) return 9;
      if (width >= 768) return 6;
      return 4;
    };

    const updatePerPage = () => {
      if (typeof window === 'undefined') return;
      setItemsPerPage(determinePerPage(window.innerWidth));
    };

    updatePerPage();
    window.addEventListener('resize', updatePerPage);

    return () => window.removeEventListener('resize', updatePerPage);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, activeSort, itemsPerPage]);

  const filteredItems = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    let items = MOCK_OPPORTUNITIES;

    if (keyword) {
      items = items.filter((item) =>
        item.title.toLowerCase().includes(keyword),
      );
    }

    const sorted = [...items];

    if (activeSort === 'most_pay') {
      sorted.sort((a, b) => b.maxRate - a.maxRate);
    } else if (activeSort === 'newest') {
      sorted.reverse();
    } else if (activeSort === 'trending') {
      sorted.sort((a, b) => b.hiredThisMonth - a.hiredThisMonth);
    }

    return sorted;
  }, [searchValue, activeSort]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredItems.slice(start, end);
  }, [filteredItems, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <section className={styles.inner}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Explore opportunities</h1>
          <p className={styles.subtitle}>
            Curated roles matched to your StarPlan profile.
          </p>
        </div>
        <p className={styles.meta}>
          Showing {paginatedItems.length} of {filteredItems.length}
        </p>
      </div>

      <OpportunitiesFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />

      <OpportunitiesGrid items={paginatedItems} />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.paginationButton}
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <div className={styles.paginationNumbers}>
            {Array.from({ length: totalPages }).map((_, index) => {
              const page = index + 1;
              const isActive = page === currentPage;
              return (
                <button
                  key={page}
                  type="button"
                  className={`${styles.paginationNumber} ${
                    isActive ? styles.paginationNumberActive : ''
                  }`}
                  onClick={() => handlePageChange(page)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {page}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={styles.paginationButton}
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}


