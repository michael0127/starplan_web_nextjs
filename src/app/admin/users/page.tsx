'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
import { Toast, useToast } from '@/components/admin/Toast';
import styles from './page.module.css';

interface User {
  id: string;
  email: string;
  name: string;
  preferredLocation?: string;
  categories: string[];
  createdAt: string;
  hasCompletedOnboarding: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [matchingUserId, setMatchingUserId] = useState<string | null>(null);
  const { toasts, addToast, dismissToast } = useToast();
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

  // Get admin token
  const getToken = () => localStorage.getItem('adminToken') || '';

  // Fetch users
  const fetchUsers = useCallback(async (page: number = 1, searchQuery: string = '') => {
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

      const response = await fetch(`/api/admin/candidates?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.candidates || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Initial load
  useEffect(() => {
    fetchUsers(1, search);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  // Copy ID to clipboard
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Navigate to matching page with pre-selected candidate
  const goToMatching = (user: User) => {
    // Store selected candidate in sessionStorage
    sessionStorage.setItem('preselectedCandidate', JSON.stringify({
      ...user,
      id: user.id,
      label: `${user.name} (${user.email})${user.categories?.length ? ` - ${user.categories.slice(0, 2).join(', ')}` : ''}`,
    }));
    router.push('/admin/matching');
  };

  // Match candidate to all jobs (using Celery async task)
  const matchAllJobs = async (user: User) => {
    setMatchingUserId(user.id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tasks/matching/candidate-to-all-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: user.id,
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
        title: `Matching task submitted for "${user.name || user.email}"`,
        message: `Task ID: ${data.task_id}. The candidate will be matched against all published jobs in the background.`,
      });
    } catch (err) {
      console.error('Background matching error:', err);
      addToast({
        type: 'error',
        title: 'Failed to submit matching task',
        message: 'Please try again later.',
      });
    } finally {
      setMatchingUserId(null);
    }
  };

  return (
    <>
    <Toast toasts={toasts} onDismiss={dismissToast} />
    <AdminPageContainer
      title="User Management"
      description="View and manage all candidate accounts"
    >
      {/* Search and Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <SearchIcon />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch('')}>
              <ClearIcon />
            </button>
          )}
        </div>
        <div className={styles.stats}>
          Total: <strong>{pagination.total}</strong> candidates
        </div>
      </div>

      {/* Error */}
      {error && <div className={styles.error}>{error}</div>}

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <div className={styles.loading}>Loading users...</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>
            {search ? 'No users match your search' : 'No users found'}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Categories</th>
                <th>Location</th>
                <th>Onboarding</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className={styles.nameCell}>
                    <span className={styles.name}>{user.name || 'No Name'}</span>
                  </td>
                  <td className={styles.emailCell}>{user.email}</td>
                  <td className={styles.categoriesCell}>
                    {user.categories?.slice(0, 2).map((cat, i) => (
                      <span key={i} className={styles.categoryBadge}>{cat}</span>
                    ))}
                    {user.categories?.length > 2 && (
                      <span className={styles.moreBadge}>+{user.categories.length - 2}</span>
                    )}
                  </td>
                  <td className={styles.locationCell}>
                    {user.preferredLocation || '-'}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${user.hasCompletedOnboarding ? styles.completed : styles.pending}`}>
                      {user.hasCompletedOnboarding ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => copyId(user.id)}
                      title="Copy ID"
                    >
                      {copiedId === user.id ? <CheckIcon /> : <CopyIcon />}
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.matchBtn}`}
                      onClick={() => goToMatching(user)}
                      title="Go to Matching"
                    >
                      <MatchIcon />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.matchAllBtn}`}
                      onClick={() => matchAllJobs(user)}
                      disabled={matchingUserId === user.id}
                      title="Match All Jobs"
                    >
                      {matchingUserId === user.id ? <LoadingIcon /> : <MatchAllIcon />}
                    </button>
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
            onClick={() => fetchUsers(pagination.page - 1, search)}
          >
            Previous
          </button>
          <span className={styles.pageInfo}>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pagination.page === pagination.totalPages}
            onClick={() => fetchUsers(pagination.page + 1, search)}
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
