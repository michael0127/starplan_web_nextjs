'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import EmployerNavbar from '@/components/EmployerNavbar';
import type { JobPosting } from '@/types/jobPosting';
import styles from './page.module.css';

// Filter types
type SortOption = 'last-viewed' | 'newest' | 'oldest';

// Normalize workType to consistent display format
// Converts "FULL_TIME" to "Full-time", "PART_TIME" to "Part-time", etc.
const normalizeWorkType = (workType: string): string => {
  const mapping: Record<string, string> = {
    'FULL_TIME': 'Full-time',
    'PART_TIME': 'Part-time',
    'CONTRACT': 'Contract',
    'CASUAL': 'Casual',
    'INTERNSHIP': 'Internship',
    'FREELANCER': 'Freelancer',
    'VOLUNTEER': 'Volunteer',
  };
  return mapping[workType] || workType;
};

export default function EmployerJobs() {
  const mounted = usePageAnimation();
  const router = useRouter();
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('last-viewed');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  
  // Filters
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  
  // Modals
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
  
  // 防止重复 fetch 的 ref
  const fetchingRef = useRef(false);
  const initialFetchDone = useRef(false);
  
  // 使用权限检查 hook
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/companies',
  });

  // 获取职位列表 - 只在必要时触发
  useEffect(() => {
    if (user && isEmployer && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchJobPostings();
    }
  }, [user, isEmployer]);
  
  // Apply filters and search
  useEffect(() => {
    let filtered = [...jobPostings];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.jobTitle.toLowerCase().includes(query) ||
        job.companyName.toLowerCase().includes(query) ||
        job.countryRegion.toLowerCase().includes(query)
      );
    }
    
    // Location filter
    if (selectedLocations.size > 0) {
      filtered = filtered.filter(job => selectedLocations.has(job.countryRegion));
    }
    
    // Work type filter (compare normalized values)
    if (selectedWorkTypes.size > 0) {
      filtered = filtered.filter(job => selectedWorkTypes.has(normalizeWorkType(job.workType)));
    }
    
    // Status filter
    if (selectedStatuses.size > 0) {
      filtered = filtered.filter(job => selectedStatuses.has(job.status));
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'last-viewed':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    
    setFilteredJobs(filtered);
  }, [jobPostings, searchQuery, selectedLocations, selectedWorkTypes, selectedStatuses, sortBy]);

  const fetchJobPostings = async () => {
    // 防止并发请求
    if (fetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    try {
      fetchingRef.current = true;
      setIsLoading(true);
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        setIsLoading(false);
        fetchingRef.current = false;
        return;
      }
      
      const response = await fetch('/api/job-postings', {
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
      fetchingRef.current = false;
    }
  };
  
  // Get unique values for filters
  const uniqueLocations = Array.from(new Set(jobPostings.map(job => job.countryRegion)));
  // Normalize workType values for consistent display (e.g., "FULL_TIME" -> "Full-time")
  const uniqueWorkTypes = Array.from(new Set(jobPostings.map(job => normalizeWorkType(job.workType))));
  const uniqueStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'];
  
  // Toggle filter selection
  const toggleFilter = (filterSet: Set<string>, setFilterSet: (set: Set<string>) => void, value: string) => {
    const newSet = new Set(filterSet);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setFilterSet(newSet);
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    setSelectedLocations(new Set());
    setSelectedWorkTypes(new Set());
    setSelectedStatuses(new Set());
    setSearchQuery('');
  };
  
  // Select/deselect all jobs
  const toggleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.map(job => job.id)));
    }
  };
  
  // Toggle individual job selection
  const toggleJobSelection = (jobId: string) => {
    const newSet = new Set(selectedJobs);
    if (newSet.has(jobId)) {
      newSet.delete(jobId);
    } else {
      newSet.add(jobId);
    }
    setSelectedJobs(newSet);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/companies');
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
        // Optimistic update: immediately remove from local state
        setJobPostings(prev => prev.filter(job => job.id !== jobToDelete.id));
        closeDeleteModal();
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
        // Optimistic update: immediately update status in local state
        setJobPostings(prev => prev.map(job => 
          job.id === jobToArchive.id 
            ? { ...job, status: 'ARCHIVED' as const }
            : job
        ));
        closeArchiveModal();
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
        // Optimistic update: immediately update status in local state
        setJobPostings(prev => prev.map(job => 
          job.id === jobToRepublish.id 
            ? { ...job, status: 'PUBLISHED' as const }
            : job
        ));
        closeRepublishModal();
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
      PUBLISHED: { label: 'Open', className: styles.statusPublished },
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
        <EmployerNavbar userEmail={user?.email} />

        {/* Main Content */}
        <main className={styles.mainLayout}>
          {/* Left Sidebar - Filters */}
          {showFilters && (
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <button 
                  className={styles.resetFiltersBtn}
                  onClick={clearAllFilters}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                  Reset filters
                </button>
              </div>

              {/* Search */}
              <div className={styles.filterSection}>
                <label className={styles.filterLabel}>Search for a job</label>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Job title, company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Location Filter */}
              {uniqueLocations.length > 0 && (
                <div className={styles.filterSection}>
                  <h3 className={styles.filterTitle}>Location</h3>
                  <div className={styles.filterOptions}>
                    {uniqueLocations.map((location) => (
                      <label key={location} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedLocations.has(location)}
                          onChange={() => toggleFilter(selectedLocations, setSelectedLocations, location)}
                          className={styles.checkbox}
                        />
                        <span>{location}</span>
                        <span className={styles.count}>
                          ({jobPostings.filter(j => j.countryRegion === location).length})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Workplace Type Filter */}
              {uniqueWorkTypes.length > 0 && (
                <div className={styles.filterSection}>
                  <h3 className={styles.filterTitle}>Workplace type</h3>
                  <div className={styles.filterOptions}>
                    {uniqueWorkTypes.map((workType) => (
                      <label key={workType} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedWorkTypes.has(workType)}
                          onChange={() => toggleFilter(selectedWorkTypes, setSelectedWorkTypes, workType)}
                          className={styles.checkbox}
                        />
                        <span>{workType}</span>
                        <span className={styles.count}>
                          ({jobPostings.filter(j => normalizeWorkType(j.workType) === workType).length})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Status Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Job status</h3>
                <div className={styles.filterOptions}>
                  {uniqueStatuses.map((status) => (
                    <label key={status} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedStatuses.has(status)}
                        onChange={() => toggleFilter(selectedStatuses, setSelectedStatuses, status)}
                        className={styles.checkbox}
                      />
                      <span>{status === 'PUBLISHED' ? 'Open' : status.charAt(0) + status.slice(1).toLowerCase()}</span>
                      <span className={styles.count}>
                        ({jobPostings.filter(j => j.status === status).length})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <div className={styles.contentArea}>
            {/* Top Bar */}
            <div className={styles.topBar}>
              <div className={styles.topBarLeft}>
                <button 
                  className={styles.toggleFiltersBtn}
                  onClick={() => setShowFilters(!showFilters)}
                  title={showFilters ? 'Hide filters' : 'Show filters'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M7 12h10M11 18h2" />
                  </svg>
                </button>
                <h1 className={styles.pageTitle}>Jobs</h1>
                <span className={styles.jobCount}>
                  {filteredJobs.length === jobPostings.length 
                    ? `${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''}`
                    : `${filteredJobs.length} of ${jobPostings.length} job${jobPostings.length !== 1 ? 's' : ''}`
                  }
                </span>
              </div>
              <div className={styles.topBarRight}>
                <div className={styles.sortContainer}>
                  <label className={styles.sortLabel}>Sort by:</label>
                  <select 
                    className={styles.sortSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                  >
                    <option value="last-viewed">Last viewed by me</option>
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </div>
                <Link href="/employer/jobs/new" className={styles.btnPostJob}>
                  Post a job
                </Link>
              </div>
            </div>

            {/* Job List */}
            {isLoading ? (
              <div className={styles.loading}>Loading...</div>
            ) : filteredJobs.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <h2 className={styles.emptyTitle}>
                  {jobPostings.length === 0 ? 'No job posts yet' : 'No jobs match your filters'}
                </h2>
                <p className={styles.emptyDescription}>
                  {jobPostings.length === 0 
                    ? 'Start by creating your first job posting to find the perfect candidates'
                    : 'Try adjusting your filters to see more results'
                  }
                </p>
                {jobPostings.length === 0 ? (
                  <Link href="/employer/jobs/new" className={styles.btnEmptyState}>
                    Create Your First Job Ad
                  </Link>
                ) : (
                  <button onClick={clearAllFilters} className={styles.btnEmptyState}>
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.jobListContainer}>
                {/* Select All Header */}
                <div className={styles.selectAllBar}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedJobs.size === filteredJobs.length && filteredJobs.length > 0}
                      onChange={toggleSelectAll}
                      className={styles.checkbox}
                    />
                    <span className={styles.selectAllText}>
                      {selectedJobs.size > 0 ? `${selectedJobs.size} selected` : `${filteredJobs.length} JOBS`}
                    </span>
                  </label>
                  <div className={styles.listHeaders}>
                    <span className={styles.headerApplicants}>Applicants</span>
                  </div>
                </div>

                {/* Job Items */}
                {filteredJobs.map((job) => (
                  <div key={job.id} className={styles.jobRow}>
                    <div className={styles.jobRowLeft}>
                      <input
                        type="checkbox"
                        checked={selectedJobs.has(job.id)}
                        onChange={() => toggleJobSelection(job.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.jobInfo}>
                        <div className={styles.jobTitleRow}>
                          <Link href={`/employer/jobs/new?edit=${job.id}`} className={styles.jobTitle}>
                            {job.jobTitle}
                          </Link>
                          {getStatusBadge(job.status)}
                        </div>
                        <div className={styles.jobMeta}>
                          <span className={styles.metaItem}>{job.companyName}</span>
                          <span className={styles.metaDot}>•</span>
                          <span className={styles.metaItem}>{job.countryRegion} ({normalizeWorkType(job.workType)})</span>
                        </div>
                        <div className={styles.jobDetails}>
                          <span className={styles.detailItem}>
                            Posted: {formatDate(job.createdAt)}
                          </span>
                          {job.status === 'CLOSED' && (
                            <>
                              <span className={styles.metaDot}>•</span>
                              <span className={styles.detailItem}>
                                Closed: {formatDate(job.updatedAt)}
                              </span>
                            </>
                          )}
                          <span className={styles.metaDot}>•</span>
                          <span className={styles.detailItem}>
                            StarPlan Job ID: {job.id.slice(0, 8)}
                          </span>
                        </div>
                        {job.categories.length > 0 && (
                          <div className={styles.jobCategories}>
                            <span className={styles.categoryLabel}>Categories:</span>
                            {job.categories.slice(0, 2).map((cat, idx) => (
                              <span key={idx} className={styles.categoryTag}>{cat}</span>
                            ))}
                            {job.categories.length > 2 && (
                              <span className={styles.categoryMore}>+{job.categories.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.jobRowRight}>
                      <div className={styles.statsContainer}>
                        <Link 
                          href={`/employer/candidates?jobId=${job.id}&tab=recommended`}
                          className={styles.statColumnClickable}
                        >
                          <span className={styles.statNumber}>{job.applicantCount || 0}</span>
                          <span className={styles.statLabel}>Applicants</span>
                        </Link>
                      </div>
                      <div className={styles.actionsColumn}>
                        <Link 
                          href={`/employer/jobs/new?edit=${job.id}`}
                          className={styles.btnEdit}
                        >
                          Edit
                        </Link>
                        
                        {job.status === 'PUBLISHED' || job.status === 'CLOSED' ? (
                          <button
                            className={styles.btnArchive}
                            onClick={() => openArchiveModal(job.id, job.jobTitle)}
                          >
                            Archive
                          </button>
                        ) : job.status === 'ARCHIVED' ? (
                          <button
                            className={styles.btnRepost}
                            onClick={() => openRepublishModal(job.id, job.jobTitle)}
                            disabled={checkingExpiry === job.id}
                          >
                            {checkingExpiry === job.id ? 'Checking...' : 'Repost'}
                          </button>
                        ) : (
                          <button
                            className={styles.btnDelete}
                            onClick={() => openDeleteModal(job.id, job.jobTitle)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                    This will make the job posting visible to candidates again. It will appear in the Open tab and candidates can apply.
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













