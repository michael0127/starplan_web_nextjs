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
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft' | 'closed' | 'archived'>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [jobToArchive, setJobToArchive] = useState<{ id: string; title: string } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [republishModalOpen, setRepublishModalOpen] = useState(false);
  const [jobToRepublish, setJobToRepublish] = useState<{ id: string; title: string; expired: boolean } | null>(null);
  const [isRepublishing, setIsRepublishing] = useState(false);
  const [checkingExpiry, setCheckingExpiry] = useState<string | null>(null);
  
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

  const openArchiveModal = (id: string, title: string) => {
    setJobToArchive({ id, title });
    setArchiveModalOpen(true);
  };

  const closeArchiveModal = () => {
    setArchiveModalOpen(false);
    setJobToArchive(null);
  };

  const handleArchive = async () => {
    if (!jobToArchive) return;
    
    setIsArchiving(true);
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        setIsArchiving(false);
        return;
      }
    
      const response = await fetch(`/api/job-postings/${jobToArchive.id}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        closeArchiveModal();
        fetchJobPostings();
      }
    } catch (error) {
      console.error('Error archiving job posting:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const openRepublishModal = async (id: string, title: string) => {
    setCheckingExpiry(id);
    
    try {
      // Check if job is expired
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }

      const response = await fetch(`/api/job-postings/${id}/expiry`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setJobToRepublish({ 
          id, 
          title,
          expired: data.expiry.isExpired 
        });
        setRepublishModalOpen(true);
      }
    } catch (error) {
      console.error('Error checking expiry:', error);
    } finally {
      setCheckingExpiry(null);
    }
  };

  const closeRepublishModal = () => {
    setRepublishModalOpen(false);
    setJobToRepublish(null);
  };

  const handleRepublish = async () => {
    if (!jobToRepublish) return;
    
    setIsRepublishing(true);
    
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        setIsRepublishing(false);
        return;
      }
    
      const response = await fetch(`/api/job-postings/${jobToRepublish.id}/republish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const data = await response.json();
      
      if (response.ok) {
        closeRepublishModal();
        fetchJobPostings();
      } else {
        alert(data.error || 'Failed to republish job posting');
      }
    } catch (error) {
      console.error('Error republishing job posting:', error);
      alert('Failed to republish job posting');
    } finally {
      setIsRepublishing(false);
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
            <button
              className={`${styles.tab} ${activeTab === 'archived' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('archived')}
            >
              Archived
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
                    {job.status === 'PUBLISHED' ? (
                      <button
                        className={styles.btnWarning}
                        onClick={() => openArchiveModal(job.id, job.jobTitle)}
                      >
                        Archive
                      </button>
                    ) : job.status === 'ARCHIVED' ? (
                      <>
                        <button
                          className={styles.btnSuccess}
                          onClick={() => openRepublishModal(job.id, job.jobTitle)}
                          disabled={checkingExpiry === job.id}
                        >
                          {checkingExpiry === job.id ? 'Checking...' : 'Republish'}
                        </button>
                        <button
                          className={styles.btnDanger}
                          onClick={() => openDeleteModal(job.id, job.jobTitle)}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.btnDanger}
                        onClick={() => openDeleteModal(job.id, job.jobTitle)}
                      >
                        Delete
                      </button>
                    )}
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

      {/* Archive Confirmation Modal */}
      {archiveModalOpen && (
        <div className={styles.modalOverlay} onClick={closeArchiveModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Archive Job Posting</h2>
              <button 
                className={styles.modalClose}
                onClick={closeArchiveModal}
                disabled={isArchiving}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.modalIcon} style={{ color: '#f59e0b' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 8v13H3V8" />
                  <path d="M1 3h22v5H1z" />
                  <polyline points="10 12 14 12" />
                </svg>
              </div>
              <p className={styles.modalText}>
                Archive <strong>"{jobToArchive?.title}"</strong>?
              </p>
              <p className={styles.modalSubtext}>
                This will remove the job posting from active listings. You can still view it in the Archived tab. This action can be reversed.
              </p>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.btnModalCancel}
                onClick={closeArchiveModal}
                disabled={isArchiving}
              >
                Cancel
              </button>
              <button
                className={styles.btnModalArchive}
                onClick={handleArchive}
                disabled={isArchiving}
              >
                {isArchiving ? 'Archiving...' : 'Archive Job'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Republish Confirmation Modal */}
      {republishModalOpen && (
        <div className={styles.modalOverlay} onClick={closeRepublishModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {jobToRepublish?.expired ? 'Cannot Republish' : 'Republish Job Posting'}
              </h2>
              <button 
                className={styles.modalClose}
                onClick={closeRepublishModal}
                disabled={isRepublishing}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {jobToRepublish?.expired ? (
                <>
                  <div className={styles.modalIcon} style={{ color: '#dc2626' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <p className={styles.modalText}>
                    <strong>"{jobToRepublish?.title}"</strong> has expired
                  </p>
                  <p className={styles.modalSubtext}>
                    This job posting's 30-day validity period has ended. You cannot republish an expired job. Please create a new job posting instead.
                  </p>
                </>
              ) : (
                <>
                  <div className={styles.modalIcon} style={{ color: '#10b981' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </div>
                  <p className={styles.modalText}>
                    Republish <strong>"{jobToRepublish?.title}"</strong>?
                  </p>
                  <p className={styles.modalSubtext}>
                    This will make the job posting visible to candidates again. It will appear in the Published tab and candidates can apply.
                  </p>
                </>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.btnModalCancel}
                onClick={closeRepublishModal}
                disabled={isRepublishing}
              >
                {jobToRepublish?.expired ? 'Close' : 'Cancel'}
              </button>
              {!jobToRepublish?.expired && (
                <button
                  className={styles.btnModalRepublish}
                  onClick={handleRepublish}
                  disabled={isRepublishing}
                >
                  {isRepublishing ? 'Republishing...' : 'Republish Job'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}













