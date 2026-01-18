'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
import { Toast, useToast } from '@/components/admin/Toast';
import styles from './page.module.css';

interface Job {
  id: string;
  jobTitle: string;
  companyName: string;
  status: string;
  countryRegion: string;
  workType: string;
  categories: string[];
  createdAt: string;
  employer: {
    email: string;
    name: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type StatusFilter = '' | 'PUBLISHED' | 'DRAFT' | 'CLOSED' | 'ARCHIVED';

export default function AdminJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [matchingJobId, setMatchingJobId] = useState<string | null>(null);
  const { toasts, addToast, dismissToast } = useToast();
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

  // Get admin token
  const getToken = () => localStorage.getItem('adminToken') || '';

  // Fetch jobs
  const fetchJobs = useCallback(async (page: number = 1, searchQuery: string = '', status: string = '') => {
    const token = getToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchQuery,
      });
      if (status) params.set('status', status);

      const response = await fetch(`/api/admin/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.jobs || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load
  useEffect(() => {
    fetchJobs(1, search, statusFilter);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs(1, search, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, fetchJobs]);

  // Copy ID to clipboard
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Match job to all candidates (using Celery async task)
  const matchAllCandidates = async (job: Job) => {
    setMatchingJobId(job.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tasks/matching/job-to-all-candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_posting_id: job.id,
          skip_hard_gate: false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to submit matching task');
      }

      // Show success toast
      addToast({
        type: 'success',
        title: `Matching task submitted for "${job.jobTitle}"`,
        message: `Task ID: ${data.task_id}. The job will be matched against all candidates in the background.`,
      });
    } catch (err) {
      console.error('Background matching error:', err);
      addToast({
        type: 'error',
        title: 'Failed to submit matching task',
        message: 'Please try again later.',
      });
    } finally {
      setMatchingJobId(null);
    }
  };

  // Navigate to matching page with pre-selected job
  const goToMatching = (job: Job) => {
    sessionStorage.setItem('preselectedJob', JSON.stringify({
      ...job,
      id: job.id,
      label: `${job.jobTitle} @ ${job.companyName} (${job.status})`,
    }));
    router.push('/admin/matching');
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return styles.published;
      case 'DRAFT': return styles.draft;
      case 'CLOSED': return styles.closed;
      case 'ARCHIVED': return styles.archived;
      default: return '';
    }
  };

  return (
    <>
    <Toast toasts={toasts} onDismiss={dismissToast} />
    <AdminPageContainer
      title="Job Management"
      description="View and manage all job postings"
    >
      {/* Search and Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <SearchIcon />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by job title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch('')}>
              <ClearIcon />
            </button>
          )}
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.statusFilter}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="CLOSED">Closed</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <div className={styles.stats}>
          Total: <strong>{pagination.total}</strong> jobs
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className={styles.empty}>
            {search || statusFilter ? 'No jobs match your filters' : 'No jobs found'}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Status</th>
                <th>Location</th>
                <th>Work Type</th>
                <th>Employer</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className={styles.titleCell}>
                    <span className={styles.jobTitle}>{job.jobTitle}</span>
                    {job.categories?.length > 0 && (
                      <div className={styles.categories}>
                        {job.categories.slice(0, 2).map((cat, i) => (
                          <span key={i} className={styles.categoryBadge}>{cat}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={styles.companyCell}>{job.companyName}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className={styles.locationCell}>{job.countryRegion || '-'}</td>
                  <td className={styles.workTypeCell}>
                    <span className={styles.workTypeBadge}>{job.workType}</span>
                  </td>
                  <td className={styles.employerCell}>
                    {job.employer?.name || job.employer?.email || '-'}
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(job.createdAt).toLocaleDateString()}
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => copyId(job.id)}
                      title="Copy ID"
                    >
                      {copiedId === job.id ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.matchBtn}`}
                      onClick={() => goToMatching(job)}
                      title="Go to Matching"
                    >
                      <MatchIcon />
                    </button>
                    {job.status === 'PUBLISHED' && (
                      <button
                        className={`${styles.actionBtn} ${styles.matchAllBtn}`}
                        onClick={() => matchAllCandidates(job)}
                        disabled={matchingJobId === job.id}
                        title="Match All Candidates"
                      >
                        {matchingJobId === job.id ? <LoadingIcon /> : <MatchAllIcon />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={pagination.page === 1}
            onClick={() => fetchJobs(pagination.page - 1, search, statusFilter)}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchJobs(pagination.page + 1, search, statusFilter)}
          >
            Next
          </button>
        </div>
      )}
    </AdminPageContainer>
    </>
  );
}

// Icons
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 14A6 6 0 108 2a6 6 0 000 12zM16 16l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 8L6.5 11.5L13 5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MatchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2L10 8L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MatchAllIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.spinning}>
      <circle cx="8" cy="8" r="6" stroke="#e0e0e0" strokeWidth="2"/>
      <path d="M14 8A6 6 0 008 2" stroke="#4a5bf4" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
