'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import EmployerNavbar from '@/components/EmployerNavbar';
import styles from './page.module.css';

interface JobPosting {
  id: string;
  title: string;
}

interface Invitation {
  id: string;
  token: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string | null;
  status: string;
  message: string | null;
  sentAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
  expiresAt: string;
  responsesCount: number;
  isExpired: boolean;
  isCompleted: boolean;
  jobPosting: {
    id: string;
    jobTitle: string;
    companyName: string;
    status: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  viewed: number;
  completed: number;
  expired: number;
}

// Main page wrapper with Suspense
export default function EmployerInvitationsPage() {
  return (
    <Suspense fallback={
      <div className={styles.pageWrapper}>
        <EmployerNavbar />
        <PageTransition>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading invitations...</p>
          </div>
        </PageTransition>
      </div>
    }>
      <EmployerInvitationsContent />
    </Suspense>
  );
}

function EmployerInvitationsContent() {
  const searchParams = useSearchParams();
  const { loading: userTypeLoading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/companies',
  });

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, viewed: 0, completed: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [jobFilter, setJobFilter] = useState<string>(searchParams.get('jobId') || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isEmployer) {
      fetchInvitations();
    }
  }, [isEmployer, statusFilter, jobFilter]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (jobFilter !== 'all') params.set('jobId', jobFilter);

      const response = await fetch(`/api/employer/invitations?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const data = await response.json();
      if (data.success) {
        setInvitations(data.data.invitations);
        setStats(data.data.stats);
        setJobPostings(data.data.jobPostings);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getStatusBadge = (inv: Invitation) => {
    if (inv.isCompleted) {
      return <span className={`${styles.badge} ${styles.badgeCompleted}`}>Completed</span>;
    }
    if (inv.isExpired) {
      return <span className={`${styles.badge} ${styles.badgeExpired}`}>Expired</span>;
    }
    if (inv.status === 'VIEWED') {
      return <span className={`${styles.badge} ${styles.badgeViewed}`}>Viewed</span>;
    }
    return <span className={`${styles.badge} ${styles.badgePending}`}>Pending</span>;
  };

  // Filter by search query
  const filteredInvitations = invitations.filter(inv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      inv.candidateEmail.toLowerCase().includes(query) ||
      inv.candidateName?.toLowerCase().includes(query) ||
      inv.jobPosting.jobTitle.toLowerCase().includes(query)
    );
  });

  if (userTypeLoading || loading) {
    return (
      <div className={styles.pageWrapper}>
        <EmployerNavbar />
        <PageTransition>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading invitations...</p>
          </div>
        </PageTransition>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <EmployerNavbar />
      <PageTransition>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>Screening Invitations</h1>
              <p className={styles.subtitle}>
                Manage all candidate screening invitations across your job postings
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div 
              className={`${styles.statCard} ${statusFilter === 'all' ? styles.statCardActive : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{stats.total}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
            </div>

            <div 
              className={`${styles.statCard} ${styles.statPending} ${statusFilter === 'pending' ? styles.statCardActive : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{stats.pending}</span>
                <span className={styles.statLabel}>Pending</span>
              </div>
            </div>

            <div 
              className={`${styles.statCard} ${styles.statCompleted} ${statusFilter === 'completed' ? styles.statCardActive : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{stats.completed}</span>
                <span className={styles.statLabel}>Completed</span>
              </div>
            </div>

            <div 
              className={`${styles.statCard} ${styles.statExpired} ${statusFilter === 'expired' ? styles.statCardActive : ''}`}
              onClick={() => setStatusFilter('expired')}
            >
              <div className={styles.statIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statNumber}>{stats.expired}</span>
                <span className={styles.statLabel}>Expired</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filtersBar}>
            <div className={styles.searchBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Jobs</option>
              {jobPostings.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          {/* Error State */}
          {error && (
            <div className={styles.errorBox}>{error}</div>
          )}

          {/* Empty State */}
          {filteredInvitations.length === 0 && !error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>No invitations found</h3>
              <p className={styles.emptyText}>
                {statusFilter !== 'all' || jobFilter !== 'all' || searchQuery
                  ? 'Try adjusting your filters or search query.'
                  : 'Send screening invitations to candidates from the Candidates page.'}
              </p>
              {(statusFilter !== 'all' || jobFilter !== 'all' || searchQuery) && (
                <button 
                  className={styles.clearFiltersBtn}
                  onClick={() => {
                    setStatusFilter('all');
                    setJobFilter('all');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Invitations Table */}
          {filteredInvitations.length > 0 && (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job Position</th>
                    <th>Status</th>
                    <th>Sent</th>
                    <th>Responses</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvitations.map((inv) => (
                    <tr key={inv.id} className={inv.isExpired && !inv.isCompleted ? styles.rowExpired : ''}>
                      <td>
                        <div className={styles.candidateCell}>
                          <div className={styles.avatar}>
                            {(inv.candidateName || inv.candidateEmail).charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.candidateInfo}>
                            <div className={styles.candidateName}>
                              {inv.candidateName || inv.candidateEmail.split('@')[0]}
                            </div>
                            <div className={styles.candidateEmail}>{inv.candidateEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.jobCell}>
                          <div className={styles.jobTitle}>{inv.jobPosting.jobTitle}</div>
                          <div className={styles.companyName}>{inv.jobPosting.companyName}</div>
                        </div>
                      </td>
                      <td>{getStatusBadge(inv)}</td>
                      <td>
                        <div className={styles.dateCell}>
                          <span className={styles.dateMain}>{formatDate(inv.sentAt)}</span>
                          <span className={styles.dateAgo}>{getTimeAgo(inv.sentAt)}</span>
                        </div>
                      </td>
                      <td>
                        {inv.isCompleted ? (
                          <span className={styles.responseCount}>{inv.responsesCount} answers</span>
                        ) : (
                          <span className={styles.noResponse}>—</span>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/employer/jobs/${inv.jobPosting.id}/invitations?selected=${inv.id}`}
                          className={styles.viewBtn}
                        >
                          {inv.isCompleted ? 'View Responses' : 'View Details'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
