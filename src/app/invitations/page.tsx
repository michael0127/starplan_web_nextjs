'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';
import { PageTransition } from '@/components/PageTransition';
import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface JobPosting {
  id: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string | null;
  countryRegion: string;
  workType: string;
  status: string;
}

interface Invitation {
  id: string;
  token: string;
  jobPosting: JobPosting;
  status: string;
  message: string | null;
  sentAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
  expiresAt: string;
  responsesCount: number;
  isExpired: boolean;
  isCompleted: boolean;
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
  expired: number;
}

export default function InvitationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { loading: userTypeLoading, isCandidate } = useUserType({
    required: 'CANDIDATE',
    redirectTo: '/employer/dashboard',
  });

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, completed: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'expired'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && isCandidate) {
      fetchInvitations();
    }
  }, [user, isCandidate]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/user/invitations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setInvitations(data.data.invitations);
        setStats(data.data.stats);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvitations = invitations.filter((inv) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return inv.status === 'PENDING' && !inv.isExpired;
    if (filter === 'completed') return inv.isCompleted;
    if (filter === 'expired') return inv.isExpired && !inv.isCompleted;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeLeft = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (authLoading || userTypeLoading || loading) {
    return (
      <SidebarLayout>
        <PageTransition>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading invitations...</p>
          </div>
        </PageTransition>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <PageTransition>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerText}>
              <h1 className={styles.title}>My Invitations</h1>
              <p className={styles.subtitle}>
                Screening invitations from employers for job opportunities
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div 
              className={`${styles.statCard} ${filter === 'all' ? styles.statCardActive : ''}`}
              onClick={() => setFilter('all')}
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
              className={`${styles.statCard} ${styles.statPending} ${filter === 'pending' ? styles.statCardActive : ''}`}
              onClick={() => setFilter('pending')}
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
              className={`${styles.statCard} ${styles.statCompleted} ${filter === 'completed' ? styles.statCardActive : ''}`}
              onClick={() => setFilter('completed')}
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
              className={`${styles.statCard} ${styles.statExpired} ${filter === 'expired' ? styles.statCardActive : ''}`}
              onClick={() => setFilter('expired')}
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

          {/* Error State */}
          {error && (
            <div className={styles.errorBox}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
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
              <h3 className={styles.emptyTitle}>
                {filter === 'all' ? 'No invitations yet' : `No ${filter} invitations`}
              </h3>
              <p className={styles.emptyText}>
                {filter === 'all' 
                  ? "When employers invite you to answer screening questions, they'll appear here."
                  : `You don't have any ${filter} invitations at the moment.`}
              </p>
              {filter !== 'all' && (
                <button className={styles.showAllBtn} onClick={() => setFilter('all')}>
                  Show all invitations
                </button>
              )}
            </div>
          )}

          {/* Invitations List */}
          {filteredInvitations.length > 0 && (
            <div className={styles.invitationsList}>
              {filteredInvitations.map((invitation) => (
                <div 
                  key={invitation.id} 
                  className={`${styles.invitationCard} ${invitation.isExpired && !invitation.isCompleted ? styles.cardExpired : ''}`}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.companyInfo}>
                      {invitation.jobPosting.companyLogo ? (
                        <Image
                          src={invitation.jobPosting.companyLogo}
                          alt={invitation.jobPosting.companyName}
                          width={48}
                          height={48}
                          className={styles.companyLogo}
                        />
                      ) : (
                        <div className={styles.companyLogoPlaceholder}>
                          {invitation.jobPosting.companyName.charAt(0)}
                        </div>
                      )}
                      <div className={styles.jobInfo}>
                        <h3 className={styles.jobTitle}>{invitation.jobPosting.jobTitle}</h3>
                        <p className={styles.companyName}>{invitation.jobPosting.companyName}</p>
                      </div>
                    </div>
                    <div className={styles.statusBadge}>
                      {invitation.isCompleted ? (
                        <span className={styles.badgeCompleted}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Completed
                        </span>
                      ) : invitation.isExpired ? (
                        <span className={styles.badgeExpired}>Expired</span>
                      ) : (
                        <span className={styles.badgePending}>
                          <span className={styles.pendingDot} />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {invitation.jobPosting.countryRegion || 'Remote'}
                    </div>
                    <div className={styles.metaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      {invitation.jobPosting.workType}
                    </div>
                    <div className={styles.metaItem}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Received {formatDate(invitation.sentAt)}
                    </div>
                  </div>

                  {invitation.message && (
                    <div className={styles.personalMessage}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <p>{invitation.message}</p>
                    </div>
                  )}

                  <div className={styles.cardFooter}>
                    {!invitation.isExpired && !invitation.isCompleted ? (
                      <>
                        <span className={styles.timeLeft}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {getTimeLeft(invitation.expiresAt)}
                        </span>
                        <Link 
                          href={`/invite/${invitation.token}`}
                          className={styles.answerBtn}
                        >
                          Answer Questions
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </Link>
                      </>
                    ) : invitation.isCompleted ? (
                      <>
                        <span className={styles.completedAt}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                          Submitted {invitation.respondedAt ? formatDate(invitation.respondedAt) : ''}
                        </span>
                        <Link 
                          href={`/invite/${invitation.token}`}
                          className={styles.viewBtn}
                        >
                          View Responses
                        </Link>
                      </>
                    ) : (
                      <span className={styles.expiredText}>
                        This invitation expired on {formatDate(invitation.expiresAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageTransition>
    </SidebarLayout>
  );
}
