'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import EmployerNavbar from '@/components/EmployerNavbar';
import styles from './page.module.css';

// Types
interface Applicant {
  id: string;
  candidateId: string;
  appliedAt: string;
  passedHardGate: boolean;
  hardGateReasons: string[];
  employerViewed: boolean;
  employerInterested: boolean;
  candidateInterested: boolean;
  jobPosting: {
    id: string;
    title: string;
    companyName: string;
  };
  candidate: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    headline: string;
    location: string;
    experienceLevel: string | null;
    experienceYears: number | null;
  };
  experience: Array<{
    title?: string;
    company?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
  }>;
  education: Array<{
    degree?: string;
    school?: string;
    field?: string;
    startYear?: string;
    endYear?: string;
    current?: boolean;
  }>;
  skills: string[];
  skillsMatch: {
    matched: string[];
    total: number;
    percentage: number;
  };
  hasResume: boolean;
  resumeUrl?: string;
  aiRank?: number;  // AI ranking position (1 = best)
}

interface RankedCandidate {
  candidateId: string;
  rank: number;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface RankingStats {
  totalComparisons: number;
  totalTokens: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
}

interface CacheStatus {
  fromCache: boolean;
  isIncremental: boolean;
  newCandidatesCount: number;
  cachedAt: string | null;
}

interface RankingResult {
  jobPostingId: string;
  jobTitle: string;
  rankedCandidates: RankedCandidate[];
  totalCandidates: number;
  stats: RankingStats;
  cacheStatus?: CacheStatus;
}

interface Job {
  id: string;
  title: string;
  status: string;
}

interface ApplicantsData {
  jobs: Job[];
  applicants: Applicant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    passed: number;
    failed: number;
    newApplicants: number;
  };
  spotlights: {
    activeApplicants: number;
    passedScreening: number;
    interestedInCompany: number;
  };
  filterOptions: {
    skills: string[];
    locations: string[];
  };
}

type SortOption = 'newest' | 'oldest' | 'screening' | 'ranking';
type TabOption = 'applicants' | 'recommended';

function EmployerCandidatesContent() {
  const mounted = usePageAnimation();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<ApplicantsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabOption>('applicants');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [passedHardGateFilter, setPassedHardGateFilter] = useState<string>('');
  
  // Expanded sections
  const [expandedExperience, setExpandedExperience] = useState<Set<string>>(new Set());
  const [expandedEducation, setExpandedEducation] = useState<Set<string>>(new Set());
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  
  // Track archived applicants
  const [archivedCount, setArchivedCount] = useState(0);
  
  // AI Ranking state
  const [isRanking, setIsRanking] = useState(false);
  const [rankingResult, setRankingResult] = useState<RankingResult | null>(null);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  
  const fetchingRef = useRef(false);
  
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/companies',
  });

  // Fetch existing ranking data when job changes
  useEffect(() => {
    if (user && isEmployer && selectedJob && activeTab === 'recommended') {
      fetchExistingRanking(selectedJob);
    }
  }, [user, isEmployer, selectedJob, activeTab]);

  // Fetch existing ranking from database
  const fetchExistingRanking = async (jobId: string) => {
    try {
      setIsLoadingRanking(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoadingRanking(false);
        return;
      }
      
      const response = await fetch(`/api/ranking/job/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setRankingResult(result.data);
        
        // Update applicants with AI ranking
        setData(prev => {
          if (!prev) return prev;
          
          const rankMap = new Map<string, number>();
          result.data.rankedCandidates.forEach((rc: RankedCandidate) => {
            rankMap.set(rc.candidateId, rc.rank);
          });
          
          return {
            ...prev,
            applicants: prev.applicants.map(a => ({
              ...a,
              aiRank: rankMap.get(a.candidateId),
            })),
          };
        });
      } else {
        // No existing ranking, that's okay
        setRankingResult(null);
      }
    } catch (error) {
      console.error('Error fetching existing ranking:', error);
      // Don't show error - it's fine if no ranking exists
    } finally {
      setIsLoadingRanking(false);
    }
  };

  // Fetch applicants
  useEffect(() => {
    if (user && isEmployer) {
      fetchApplicants();
    }
  }, [user, isEmployer, selectedJob, sortBy, currentPage, passedHardGateFilter]);

  const fetchApplicants = async () => {
    if (fetchingRef.current) return;
    
    try {
      fetchingRef.current = true;
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoading(false);
        fetchingRef.current = false;
        return;
      }
      
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '25');
      params.set('sortBy', sortBy);
      
      if (selectedJob) {
        params.set('jobId', selectedJob);
      }
      if (passedHardGateFilter) {
        params.set('passedHardGate', passedHardGateFilter);
      }
      if (searchQuery) {
        params.set('q', searchQuery);
      }
      if (selectedSkills.size > 0) {
        params.set('skills', Array.from(selectedSkills).join(','));
      }
      if (selectedLocations.size > 0) {
        params.set('locations', Array.from(selectedLocations).join(','));
      }
      
      const response = await fetch(`/api/employer/applicants?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleApplicantAction = async (applicantId: string, action: 'view' | 'interested' | 'reject') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Find the applicant to get the jobPostingId
      const applicant = data?.applicants.find(a => a.id === applicantId);
      if (!applicant) return;

      const response = await fetch(`/api/job-postings/${applicant.jobPosting.id}/applicants`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicantId, action }),
      });

      if (response.ok) {
        // Update local state
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            applicants: prev.applicants.map(a => {
              if (a.id === applicantId) {
                return {
                  ...a,
                  employerViewed: true,
                  employerInterested: action === 'interested' ? true : action === 'reject' ? false : a.employerInterested,
                };
              }
              return a;
            }),
          };
        });
      }
    } catch (error) {
      console.error('Error updating applicant:', error);
    }
  };

  const toggleFilter = (set: Set<string>, setFn: (s: Set<string>) => void, value: string) => {
    const newSet = new Set(set);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    setFn(newSet);
    setCurrentPage(1);
  };

  // AI Ranking function
  const handleStartRanking = async () => {
    if (!selectedJob) {
      setRankingError('Please select a job to rank candidates');
      return;
    }
    
    setIsRanking(true);
    setRankingError(null);
    setRankingResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRankingError('Session expired. Please log in again.');
        setIsRanking(false);
        return;
      }
      
      const response = await fetch(`/api/ranking/job/${selectedJob}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.success) {
        setRankingResult(result.data);
        
        // Update applicants with AI ranking
        setData(prev => {
          if (!prev) return prev;
          
          const rankMap = new Map<string, number>();
          result.data.rankedCandidates.forEach((rc: RankedCandidate) => {
            rankMap.set(rc.candidateId, rc.rank);
          });
          
          return {
            ...prev,
            applicants: prev.applicants.map(a => ({
              ...a,
              aiRank: rankMap.get(a.candidateId) || undefined,
            })),
          };
        });
      } else {
        setRankingError(result.error || 'Failed to rank candidates');
      }
    } catch (error) {
      console.error('Ranking error:', error);
      setRankingError(error instanceof Error ? error.message : 'An error occurred while ranking');
    } finally {
      setIsRanking(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSkills(new Set());
    setSelectedLocations(new Set());
    setPassedHardGateFilter('');
    setSelectedJob('');
    setCurrentPage(1);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatExperienceDate = (exp: Applicant['experience'][0]) => {
    const start = exp.startDate || '';
    const end = exp.current ? 'Present' : (exp.endDate || '');
    if (start && end) return `${start} – ${end}`;
    return start || end || '';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getExperienceLevelLabel = (level: string | null) => {
    const labels: Record<string, string> = {
      'INTERN': 'Intern',
      'JUNIOR': 'Entry Level',
      'MID_LEVEL': 'Mid Level',
      'SENIOR': 'Senior',
      'LEAD': 'Lead',
      'PRINCIPAL': 'Principal',
    };
    return level ? labels[level] || level : '';
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

  const hasApplicants = data && data.applicants.length > 0;
  const hasJobs = data && data.jobs.length > 0;

  return (
    <PageTransition>
      <div className={styles.container}>
        <EmployerNavbar userEmail={user?.email} />

        {/* Secondary Navigation - Job Selector */}
        <div className={styles.secondaryNav}>
          <div className={styles.secondaryNavContent}>
            {/* Job Selector - Always visible on left */}
            <div className={styles.jobSelector}>
              <select
                value={selectedJob}
                onChange={(e) => {
                  setSelectedJob(e.target.value);
                  setCurrentPage(1);
                }}
                className={styles.jobSelect}
              >
                {activeTab === 'applicants' && <option value="">All Jobs</option>}
                {data?.jobs.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <svg className={styles.selectArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            
            <nav className={styles.tabNav}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'applicants' ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab('applicants');
                  setSortBy('newest');
                }}
              >
                Applicants
              </button>
              
              {/* Divider */}
              <div className={styles.tabDivider}></div>
              
              {/* AI Ranked Matches */}
              <button 
                className={`${styles.tabBtn} ${activeTab === 'recommended' ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab('recommended');
                  setSortBy('ranking');
                  // Auto-select first job if no job is selected
                  if (!selectedJob && data?.jobs && data.jobs.length > 0) {
                    setSelectedJob(data.jobs[0].id);
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                AI Ranked Matches
              </button>
            </nav>
            
            <div className={styles.secondaryNavRight}>
              {/* Start Ranking Button - Only in AI Ranked tab */}
              {activeTab === 'recommended' && (
                <button 
                  className={`${styles.startRankingBtn} ${isRanking ? styles.rankingInProgress : ''}`}
                  onClick={handleStartRanking}
                  disabled={isRanking || !selectedJob}
                >
                  {isRanking ? (
                    <>
                      <div className={styles.miniSpinner}></div>
                      Ranking...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20V10"></path>
                        <path d="M18 20V4"></path>
                        <path d="M6 20v-4"></path>
                      </svg>
                      Start AI Ranking
                    </>
                  )}
                </button>
              )}
              <span className={styles.privacyBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                Private
              </span>
            </div>
          </div>
        </div>

        <main className={styles.mainLayout}>
          {/* Left Sidebar - Filters */}
          {showFilters && (
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <span className={styles.resultsCount}>
                  {data?.pagination.total.toLocaleString() || 0} results
                </span>
                <button className={styles.clearSearchBtn} onClick={clearAllFilters}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                  Clear search
                </button>
              </div>

              {/* Skills Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Skills</h3>
                <div className={styles.addFilter}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add skills and expertise</span>
                </div>
                {(data?.filterOptions?.skills || []).slice(0, 5).map(skill => (
                  <label key={skill} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedSkills.has(skill)}
                      onChange={() => toggleFilter(selectedSkills, setSelectedSkills, skill)}
                      className={styles.checkbox}
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>

              {/* Location Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Current locations</h3>
                <div className={styles.addFilter}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add candidate geographic locations</span>
                </div>
                {(data?.filterOptions?.locations || []).slice(0, 5).map(location => (
                  <label key={location} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedLocations.has(location)}
                      onChange={() => toggleFilter(selectedLocations, setSelectedLocations, location)}
                      className={styles.checkbox}
                    />
                    <span>{location}</span>
                  </label>
                ))}
              </div>

              {/* Screening Status Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Screening status</h3>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={passedHardGateFilter === 'true'}
                    onChange={() => setPassedHardGateFilter(passedHardGateFilter === 'true' ? '' : 'true')}
                    className={styles.checkbox}
                  />
                  <span>Passed screening</span>
                  <span className={styles.filterCount}>({data?.stats.passed || 0})</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={passedHardGateFilter === 'false'}
                    onChange={() => setPassedHardGateFilter(passedHardGateFilter === 'false' ? '' : 'false')}
                    className={styles.checkbox}
                  />
                  <span>Did not pass</span>
                  <span className={styles.filterCount}>({data?.stats.failed || 0})</span>
                </label>
              </div>

              {/* Keywords */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Keywords</h3>
                <div className={styles.addFilter}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Profile keywords or boolean</span>
                </div>
              </div>

              <button className={styles.advancedSearchBtn}>
                Advanced search
              </button>
            </aside>
          )}

          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Spotlights / AI Ranking Info */}
            {activeTab === 'recommended' && rankingResult ? (
              <div className={styles.topCandidatesPanel}>
                <div className={styles.topCandidatesHeader}>
                  <div className={styles.topCandidatesTitle}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>Top AI Matches</span>
                  </div>
                  <span className={styles.topCandidatesSubtitle}>
                    {rankingResult.totalCandidates} candidates ranked
                    {rankingResult.cacheStatus?.cachedAt && (
                      <> • Updated {new Date(rankingResult.cacheStatus.cachedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                    )}
                  </span>
                </div>
                <div className={styles.topCandidatesGrid}>
                  {rankingResult.rankedCandidates.slice(0, 3).map((candidate, index) => {
                    const applicant = data?.applicants.find(a => a.candidateId === candidate.candidateId);
                    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                    const rankLabels = ['Top Match', '2nd Best', '3rd Best'];
                    
                    return (
                      <div key={candidate.candidateId} className={`${styles.topCandidateCard} ${styles[`topCandidate${index + 1}`]}`}>
                        <div className={styles.topCandidateRank} style={{ backgroundColor: rankColors[index] }}>
                          <span>#{index + 1}</span>
                        </div>
                        <div className={styles.topCandidateInfo}>
                          <div className={styles.topCandidateAvatar}>
                            {candidate.avatarUrl ? (
                              <img src={candidate.avatarUrl} alt={candidate.name || ''} />
                            ) : (
                              <div className={styles.avatarPlaceholder}>
                                {(candidate.name || candidate.email || '?').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className={styles.topCandidateDetails}>
                            <Link 
                              href={`/employer/candidates/${candidate.candidateId}`}
                              className={styles.topCandidateNameLink}
                            >
                              <h4 className={styles.topCandidateName}>
                                {candidate.name || candidate.email?.split('@')[0] || 'Unknown'}
                              </h4>
                            </Link>
                            <p className={styles.topCandidateRole}>
                              {applicant?.experience?.[0]?.title || applicant?.candidate?.headline || 'Candidate'}
                            </p>
                          </div>
                        </div>
                        <div className={styles.topCandidateBadge}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                          </svg>
                          <span>{rankLabels[index]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : activeTab === 'recommended' && rankingError ? (
              <div className={styles.rankingErrorPanel}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span>{rankingError}</span>
                <button onClick={() => setRankingError(null)} className={styles.dismissErrorBtn}>Dismiss</button>
              </div>
            ) : activeTab === 'recommended' && isRanking ? (
              <div className={styles.rankingProgressPanel}>
                <div className={styles.rankingProgressContent}>
                  <div className={styles.progressSpinner}></div>
                  <div className={styles.progressText}>
                    <h3>AI Ranking in Progress</h3>
                    <p>Comparing candidates using binary insertion algorithm...</p>
                    <p className={styles.progressHint}>This may take a moment depending on the number of candidates</p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'recommended' && !rankingResult && sortBy === 'ranking' ? (
              <div className={styles.rankingPromptPanel}>
                <div className={styles.rankingPromptContent}>
                  <div className={styles.rankingPromptIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 20V10M18 20V4M6 20v-4"/>
                    </svg>
                  </div>
                  <div className={styles.rankingPromptText}>
                    <h3>AI Ranking Not Started</h3>
                    <p>Click the <strong>"Start AI Ranking"</strong> button above to rank candidates using AI-powered binary insertion comparison.</p>
                    <p className={styles.rankingPromptHint}>
                      {selectedJob 
                        ? `${data?.stats.passed || 0} candidates passed screening and are ready to be ranked.`
                        : 'Please select a job position first to start ranking.'
                      }
                    </p>
                  </div>
                  {selectedJob && (
                    <button 
                      className={styles.rankingPromptBtn}
                      onClick={handleStartRanking}
                      disabled={isRanking}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20V10M18 20V4M6 20v-4"/>
                      </svg>
                      Start AI Ranking
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.spotlights}>
                <h2 className={styles.spotlightsTitle}>
                  Spotlights
                  <button className={styles.infoBtn}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </button>
                </h2>
                
                <div className={styles.spotlightCards}>
                  <div className={styles.spotlightCard}>
                    <div className={styles.spotlightNumber}>{data?.spotlights.activeApplicants || 0}</div>
                    <div className={styles.spotlightLabel}>Active applicants</div>
                  </div>
                  <div className={styles.spotlightCard}>
                    <div className={styles.spotlightNumber}>{data?.spotlights.passedScreening || 0}</div>
                    <div className={styles.spotlightLabel}>Passed screening</div>
                  </div>
                  <div className={styles.spotlightCard}>
                    <div className={styles.spotlightNumber}>{data?.spotlights.interestedInCompany || 0}</div>
                    <div className={styles.spotlightLabel}>
                      Interested in your company
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.dropdownIcon}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                  <div className={styles.spotlightCard}>
                    <div className={styles.spotlightNumber}>{data?.stats.newApplicants || 0}</div>
                    <div className={styles.spotlightLabel}>New applicants</div>
                  </div>
                </div>
              </div>
            )}

            {/* Archived Notice */}
            {archivedCount > 0 && (
              <div className={styles.archivedNotice}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
                You received {data?.stats.total.toLocaleString()} applicants. {archivedCount} have been moved to{' '}
                <a href="#" className={styles.archivedLink}>Archived</a> in the pipeline.
              </div>
            )}

            {/* Results Header */}
            <div className={styles.resultsHeader}>
              <div className={styles.resultsHeaderLeft}>
                <input
                  type="checkbox"
                  className={styles.selectAllCheckbox}
                />
                <span className={styles.resultsText}>
                  {activeTab === 'recommended' 
                    ? `${data?.stats.passed || 0} RANKED CANDIDATES`
                    : `${data?.pagination.total.toLocaleString() || 0} RESULTS`
                  }
                </span>
                {activeTab === 'recommended' && (
                  <span className={`${styles.rankingIndicator} ${rankingResult ? styles.rankingComplete : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    {rankingResult 
                      ? `AI Ranked (${rankingResult.stats.totalComparisons} comparisons)` 
                      : 'Click "Start AI Ranking" to rank candidates'}
                  </span>
                )}
              </div>
              <div className={styles.resultsHeaderRight}>
                <button className={styles.exportBtn}>
                  Export all to XLSX
                </button>
                <div className={styles.sortContainer}>
                  <span className={styles.sortLabel}>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className={styles.sortSelect}
                  >
                    {activeTab === 'recommended' ? (
                      <>
                        <option value="ranking">AI Match Ranking</option>
                        <option value="screening">Screening Requirements</option>
                        <option value="newest">Newest first</option>
                      </>
                    ) : (
                      <>
                        <option value="screening">Screening Requirements</option>
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                      </>
                    )}
                  </select>
                </div>
                <div className={styles.pagination}>
                  <span>{((currentPage - 1) * 25) + 1} – {Math.min(currentPage * 25, data?.pagination.total || 0)}</span>
                  <button 
                    className={styles.paginationBtn}
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                  <button 
                    className={styles.paginationBtn}
                    disabled={currentPage >= (data?.pagination.totalPages || 1)}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Applicant List */}
            {isLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading applicants...</p>
              </div>
            ) : !hasJobs ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                </div>
                <h2 className={styles.emptyTitle}>No job postings yet</h2>
                <p className={styles.emptyDescription}>
                  Create a job posting to start receiving applications from qualified candidates
                </p>
                <Link href="/employer/jobs/new" className={styles.btnEmptyState}>
                  Create Your First Job Ad
                </Link>
              </div>
            ) : !hasApplicants ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
                <h2 className={styles.emptyTitle}>No applicants yet</h2>
            <p className={styles.emptyDescription}>
                  Once candidates apply to your job postings, they will appear here
                </p>
              </div>
            ) : activeTab === 'recommended' && sortBy === 'ranking' && !rankingResult && !isRanking ? (
              // Don't show candidates list when AI Ranking is selected but not yet executed
              <div className={styles.noRankingResults}>
                <div className={styles.noRankingIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 20V10M18 20V4M6 20v-4"/>
                  </svg>
                </div>
                <p>Start AI Ranking to see candidates sorted by match quality</p>
              </div>
            ) : (
              <div className={styles.applicantList}>
                {/* Filter and sort applicants based on active tab and sort option */}
                {(() => {
                  let applicants = activeTab === 'recommended' 
                    ? data?.applicants.filter(a => a.passedHardGate) || []
                    : data?.applicants || [];
                  
                  // Apply sorting based on sortBy option
                  if (activeTab === 'recommended' && sortBy === 'ranking' && rankingResult) {
                    // AI Match Ranking: only show and sort by ranked candidates
                    const rankMap = new Map<string, number>();
                    rankingResult.rankedCandidates.forEach(rc => {
                      rankMap.set(rc.candidateId, rc.rank);
                    });
                    
                    applicants = applicants
                      .filter(a => rankMap.has(a.candidateId))
                      .sort((a, b) => {
                        const rankA = rankMap.get(a.candidateId) ?? Infinity;
                        const rankB = rankMap.get(b.candidateId) ?? Infinity;
                        return rankA - rankB;
                      });
                  } else if (sortBy === 'screening') {
                    // Screening Requirements: passed first, then by percentage
                    applicants = [...applicants].sort((a, b) => {
                      // First by passedHardGate
                      if (a.passedHardGate !== b.passedHardGate) {
                        return a.passedHardGate ? -1 : 1;
                      }
                      // Then by skills match percentage
                      return (b.skillsMatch?.percentage || 0) - (a.skillsMatch?.percentage || 0);
                    });
                  } else if (sortBy === 'newest') {
                    // Newest first
                    applicants = [...applicants].sort((a, b) => {
                      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
                    });
                  } else if (sortBy === 'oldest') {
                    // Oldest first
                    applicants = [...applicants].sort((a, b) => {
                      return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
                    });
                  }
                  
                  return applicants;
                })().map((applicant, index) => (
                  <div 
                    key={applicant.id} 
                    className={`${styles.applicantCard} ${!applicant.employerViewed ? styles.unviewed : ''} ${activeTab === 'recommended' ? styles.rankedCard : ''}`}
                  >
                    <div className={styles.applicantCardLeft}>
                      {/* Show ranking number in recommended tab */}
                      {activeTab === 'recommended' ? (
                        <div className={styles.rankingNumber}>
                          {rankingResult ? (
                            <div className={`${styles.rankBadge} ${index < 3 ? styles[`rankBadge${index + 1}`] : styles.rankBadgeDefault}`}>
                              <span className={styles.rankBadgeNum}>#{index + 1}</span>
                            </div>
                          ) : (
                            <>
                              <span className={styles.rankNum}>#{index + 1}</span>
                              <div className={styles.matchScoreBar}>
                                <div 
                                  className={styles.matchScoreFill} 
                                  style={{ width: `${applicant.skillsMatch.percentage}%` }}
                                />
                              </div>
                              <span className={styles.matchPercent}>{applicant.skillsMatch.percentage}%</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <input type="checkbox" className={styles.applicantCheckbox} />
                      )}
                      
                      <div className={styles.avatarContainer}>
                        {applicant.candidate.avatarUrl ? (
                          <img 
                            src={applicant.candidate.avatarUrl} 
                            alt={applicant.candidate.name}
                            className={styles.avatar}
                          />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {getInitials(applicant.candidate.name)}
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.applicantInfo}>
                        <div className={styles.applicantHeader}>
                          <Link 
                            href={`/employer/candidates/${applicant.candidateId}`}
                            className={styles.applicantNameLink}
                          >
                            <h3 className={styles.applicantName}>
                              {applicant.candidate.name.split(' ')[0]}{' '}
                              {applicant.candidate.name.split(' ').slice(1).map(n => n[0] + '.').join(' ')}
                            </h3>
                          </Link>
                          <span className={styles.connectionDegree}>3rd</span>
                          {activeTab === 'recommended' ? (
                            rankingResult && index < 3 ? (
                              <span className={`${styles.rankedBadge} ${styles[`rankedBadge${index + 1}`]}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                {index === 0 ? 'Top Match' : index === 1 ? '2nd Best' : '3rd Best'}
                              </span>
                            ) : rankingResult ? (
                              <span className={styles.rankedBadgeNormal}>AI Ranked</span>
                            ) : (
                              <span className={styles.rankedBadge}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                Top Match
                              </span>
                            )
                          ) : (
                            <span className={styles.applicantBadge}>Applicant</span>
                          )}
                        </div>
                        
                        <p className={styles.applicantHeadline}>{applicant.candidate.headline}</p>
                        <p className={styles.applicantLocation}>{applicant.candidate.location}</p>

                        {/* Experience Section */}
                        {applicant.experience.length > 0 && (
                          <div className={styles.detailSection}>
                            <span className={styles.detailLabel}>Experience</span>
                            <div className={styles.detailContent}>
                              {applicant.experience.slice(0, expandedExperience.has(applicant.id) ? undefined : 3).map((exp, idx) => (
                                <div key={idx} className={styles.experienceItem}>
                                  {exp.title && exp.company 
                                    ? `${exp.title} at ${exp.company}`
                                    : exp.title || exp.company || 'Position'}
                                  {(exp.startDate || exp.endDate || exp.current) && (
                                    <> · {formatExperienceDate(exp)}</>
                                  )}
                                </div>
                              ))}
                              {applicant.experience.length > 3 && (
                                <button 
                                  className={styles.showMoreBtn}
                                  onClick={() => {
                                    const newSet = new Set(expandedExperience);
                                    if (newSet.has(applicant.id)) {
                                      newSet.delete(applicant.id);
                                    } else {
                                      newSet.add(applicant.id);
                                    }
                                    setExpandedExperience(newSet);
                                  }}
                                >
                                  Show all ({applicant.experience.length})
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points={expandedExperience.has(applicant.id) ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Education Section */}
                        {applicant.education.length > 0 && (
                          <div className={styles.detailSection}>
                            <span className={styles.detailLabel}>Education</span>
                            <div className={styles.detailContent}>
                              {applicant.education.slice(0, expandedEducation.has(applicant.id) ? undefined : 2).map((edu, idx) => {
                                // Build education display text
                                const schoolPart = edu.school || '';
                                const degreePart = edu.degree ? (edu.field ? `${edu.degree} in ${edu.field}` : edu.degree) : edu.field || '';
                                const datePart = (edu.startYear || edu.endYear || edu.current) 
                                  ? `${edu.startYear || ''} – ${edu.current ? 'Present' : (edu.endYear || '')}`
                                  : '';
                                
                                return (
                                  <div key={idx} className={styles.educationItem}>
                                    {schoolPart && degreePart 
                                      ? `${schoolPart}, ${degreePart}`
                                      : schoolPart || degreePart || 'Education'}
                                    {datePart && <> · {datePart}</>}
                                  </div>
                                );
                              })}
                              {applicant.education.length > 2 && (
                                <button 
                                  className={styles.showMoreBtn}
                                  onClick={() => {
                                    const newSet = new Set(expandedEducation);
                                    if (newSet.has(applicant.id)) {
                                      newSet.delete(applicant.id);
                                    } else {
                                      newSet.add(applicant.id);
                                    }
                                    setExpandedEducation(newSet);
                                  }}
                                >
                                  Show all ({applicant.education.length})
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points={expandedEducation.has(applicant.id) ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Skills Match */}
                        {applicant.skillsMatch.total > 0 && (
                          <div className={styles.detailSection}>
                            <span className={styles.detailLabel}>Skills Match</span>
                            <div className={styles.detailContent}>
                              <span className={styles.skillsMatchCount}>
                                {applicant.skillsMatch.matched.length} of {applicant.skillsMatch.total} match your job post
                              </span>
                              <div className={styles.skillsList}>
                                {applicant.skillsMatch.matched.slice(0, expandedSkills.has(applicant.id) ? undefined : 3).map((skill, idx) => (
                                  <span key={idx} className={styles.skillTag}>{skill}</span>
                                ))}
                                {applicant.skillsMatch.matched.length > 3 && !expandedSkills.has(applicant.id) && (
                                  <button 
                                    className={styles.showMoreSkillsBtn}
                                    onClick={() => {
                                      const newSet = new Set(expandedSkills);
                                      newSet.add(applicant.id);
                                      setExpandedSkills(newSet);
                                    }}
                                  >
                                    Show all ({applicant.skillsMatch.matched.length})
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interest & Activity */}
                        <div className={styles.detailSection}>
                          <span className={styles.detailLabel}>Interest</span>
                          <div className={styles.detailContent}>
                            {applicant.candidateInterested ? (
                              <span className={styles.interestTag}>Interested in your company</span>
                            ) : (
                              <span className={styles.interestTagNeutral}>Open to work</span>
                            )}
                          </div>
                        </div>

                        <div className={styles.detailSection}>
                          <span className={styles.detailLabel}>Activity</span>
                          <div className={styles.detailContent}>
                            <div className={styles.activityTags}>
                              {applicant.hasResume && (
                                <a href={applicant.resumeUrl} target="_blank" rel="noopener noreferrer" className={styles.activityLink}>
                                  resume
                                </a>
                              )}
                              {applicant.passedHardGate && (
                                <span className={styles.activityTagSuccess}>
                                  Passed screening
                                </span>
                              )}
                              <span className={styles.activityTag}>
                                Applied to {applicant.jobPosting.title}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.applicantCardRight}>
                      <div className={styles.actionButtons}>
                        <button 
                          className={`${styles.btnSavePipeline} ${applicant.employerInterested ? styles.saved : ''}`}
                          onClick={() => handleApplicantAction(applicant.id, 'interested')}
                        >
                          {applicant.employerInterested ? 'Saved' : 'Save to pipeline'}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                          </svg>
                        </button>
                        <button 
                          className={styles.btnReject}
                          onClick={() => handleApplicantAction(applicant.id, 'reject')}
                        >
                          Reject
                        </button>
                        <button className={styles.btnMessage}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </button>
                        <button className={styles.btnMore}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="19" cy="12" r="1"></circle>
                            <circle cx="5" cy="12" r="1"></circle>
                          </svg>
                        </button>
                      </div>
                      <div className={styles.appliedDate}>
                        Applied on {formatDate(applicant.appliedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

// Loading fallback for Suspense
function CandidatesLoading() {
  return (
    <div className={styles.loadingContainer} style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f8f9fa'
    }}>
      <div className={styles.spinner}></div>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function EmployerCandidates() {
  return (
    <Suspense fallback={<CandidatesLoading />}>
      <EmployerCandidatesContent />
    </Suspense>
  );
}
