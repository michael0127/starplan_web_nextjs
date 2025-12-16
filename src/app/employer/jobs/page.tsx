'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import type { JobPosting } from '@/types/jobPosting';
import styles from './page.module.css';

export default function EmployerJobs() {
  const mounted = usePageAnimation();
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 使用权限检查 hook
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/companies',
  });

  // 获取职位列表
  useEffect(() => {
    if (user && isEmployer) {
      fetchJobPostings();
    }
  }, [user, isEmployer, activeTab]);

  const fetchJobPostings = async () => {
    try {
      setIsLoading(true);
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        setIsLoading(false);
        return;
      }
      
      const url = activeTab === 'all' 
        ? '/api/job-postings' 
        : `/api/job-postings?status=${activeTab.toUpperCase()}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setJobPostings(data.data);
      }
    } catch (error) {
      console.error('Error fetching job postings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (id: string, title: string) => {
    setJobToDelete({ id, title });
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setJobToDelete(null);
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        setIsDeleting(false);
      return;
    }
    
      const response = await fetch(`/api/job-postings/${jobToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        closeDeleteModal();
        fetchJobPostings();
      }
    } catch (error) {
      console.error('Error deleting job posting:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/companies');
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Draft', className: styles.statusDraft },
      PUBLISHED: { label: 'Published', className: styles.statusPublished },
      CLOSED: { label: 'Closed', className: styles.statusClosed },
      ARCHIVED: { label: 'Archived', className: styles.statusArchived },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
  };

  if (loading || !isEmployer) {
    return (
      <PageTransition>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <Link href="/employer/dashboard">
                <img src="/img/logo.png" alt="StarPlan" />
              </Link>
            </div>
            <nav className={styles.nav}>
              <Link href="/employer/dashboard" className={styles.navLink}>
                Dashboard
              </Link>
              <Link href="/employer/jobs" className={styles.navLink + ' ' + styles.active}>
                Job Posts
              </Link>
              <Link href="/employer/candidates" className={styles.navLink}>
                Candidates
              </Link>
              <div className={styles.userMenu}>
                <span className={styles.userEmail}>{user?.email}</span>
                <button onClick={handleSignOut} className={styles.signOutBtn}>
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Job Posts</h1>
              <p className={styles.pageSubtitle}>
                Manage all your job postings and track applications
              </p>
            </div>
            <Link href="/employer/jobs/new" className={styles.btnPrimary}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create Job Ad
            </Link>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'published' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('published')}
            >
              Published
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'draft' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('draft')}
            >
              Drafts
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'closed' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('closed')}
            >
              Closed
            </button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : jobPostings.length === 0 ? (
            /* Empty State */
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h2 className={styles.emptyTitle}>
                {activeTab === 'all' ? 'No job posts yet' : `No ${activeTab} jobs`}
              </h2>
              <p className={styles.emptyDescription}>
                {activeTab === 'draft' 
                  ? 'You don\'t have any draft job postings'
                  : 'Start by creating your first job posting to find the perfect candidates'}
              </p>
              <Link href="/employer/jobs/new" className={styles.btnEmptyState}>
                Create Your First Job Ad
              </Link>
            </div>
          ) : (
            /* Job List */
            <div className={styles.jobList}>
              {jobPostings.map((job) => (
                <div key={job.id} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <div>
                      <div className={styles.jobTitleRow}>
                        <h3 className={styles.jobTitle}>{job.jobTitle}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className={styles.jobMeta}>
                        <span>{job.companyName}</span>
                        <span>•</span>
                        <span>{job.countryRegion}</span>
                        <span>•</span>
                        <span>{job.workType}</span>
                        <span>•</span>
                        <span>Posted {formatDate(job.createdAt)}</span>
                      </div>
                      {job.categories.length > 0 && (
                        <div className={styles.jobCategories}>
                          {job.categories.slice(0, 3).map((cat, idx) => (
                            <span key={idx} className={styles.categoryTag}>{cat}</span>
                          ))}
                          {job.categories.length > 3 && (
                            <span className={styles.categoryTag}>+{job.categories.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className={styles.jobSummary}>{job.jobSummary}</p>
                  
                  <div className={styles.jobActions}>
                    <Link
                      href={`/employer/jobs/new?edit=${job.id}`}
                      className={job.status === 'DRAFT' ? styles.btnPrimary : styles.btnSecondary}
                      prefetch={true}
                    >
                      {job.status === 'DRAFT' ? 'Continue Editing' : 'Edit'}
                    </Link>
                    <button
                      className={styles.btnDanger}
                      onClick={() => openDeleteModal(job.id, job.jobTitle)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className={styles.modalOverlay} onClick={closeDeleteModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Delete Job Posting</h2>
              <button 
                className={styles.modalClose}
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.modalIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <p className={styles.modalText}>
                Are you sure you want to delete <strong>"{jobToDelete?.title}"</strong>?
              </p>
              <p className={styles.modalSubtext}>
                This action cannot be undone. All data associated with this job posting will be permanently deleted.
              </p>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.btnModalCancel}
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.btnModalDelete}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}













