'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import EmployerNavbar from '@/components/EmployerNavbar';
import { InviteModal } from '@/components/InviteModal';
import { MessageModal } from '@/components/MessageModal';
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
    location: string | { city?: string; state?: string; country?: string } | null;
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

interface JobPostingDetails {
  id: string;
  jobTitle: string;
  companyName: string;
  systemScreeningAnswers: Array<{
    questionId: string;
    requirement: string;
    selectedAnswers: string[];
  }>;
  customScreeningQuestions: Array<{
    id: string;
    questionText: string;
    answerType: string;
    options: string[];
    mustAnswer: boolean;
    requirement: string;
  }>;
}

interface InviteCandidate {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
}

interface FilterOption {
  name: string;
  count: number;
}

// Hierarchical location types for structured filtering
interface LocationCity {
  name: string;
  count: number;
}

interface LocationState {
  name: string;
  count: number;
  cities: LocationCity[];
}

interface LocationCountry {
  name: string;
  count: number;
  states: LocationState[];
}

interface LocationHierarchy {
  countries: LocationCountry[];
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
    skills: FilterOption[];
    locations: LocationHierarchy;
    experienceLevels: FilterOption[];
  };
}

type SortOption = 'newest' | 'oldest' | 'screening' | 'ranking';
type TabOption = 'applicants' | 'recommended';

function EmployerCandidatesContent() {
  const mounted = usePageAnimation();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get URL params
  const jobIdParam = searchParams.get('jobId');
  const tabParam = searchParams.get('tab');
  
  const [data, setData] = useState<ApplicantsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string>(jobIdParam || '');
  const [sortBy, setSortBy] = useState<SortOption>(tabParam === 'recommended' ? 'ranking' : 'newest');
  const [showFilters, setShowFilters] = useState(true);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabOption>(tabParam === 'recommended' ? 'recommended' : 'applicants');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedExperienceLevels, setSelectedExperienceLevels] = useState<Set<string>>(new Set());
  const [passedHardGateFilter, setPassedHardGateFilter] = useState<string>('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  
  // Hierarchical location filter states
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  
  // Expanded sections
  const [expandedExperience, setExpandedExperience] = useState<Set<string>>(new Set());
  const [expandedEducation, setExpandedEducation] = useState<Set<string>>(new Set());
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  
  // Track archived applicants
  const [archivedCount, setArchivedCount] = useState(0);
  
  // Spotlight and Top AI Matches collapsed state
  const [spotlightCollapsed, setSpotlightCollapsed] = useState(false);
  const [topMatchesCollapsed, setTopMatchesCollapsed] = useState(false);
  
  // Dropdown menu state for three-dot button
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Batch selection state
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(new Set());
  
  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteCandidates, setInviteCandidates] = useState<InviteCandidate[]>([]);
  const [selectedJobDetails, setSelectedJobDetails] = useState<JobPostingDetails | null>(null);
  const [loadingJobDetails, setLoadingJobDetails] = useState(false);
  
  // Message Modal state
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageCandidates, setMessageCandidates] = useState<InviteCandidate[]>([]);
  
  // AI Ranking state
  const [isRanking, setIsRanking] = useState(false);
  const [rankingResult, setRankingResult] = useState<RankingResult | null>(null);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [rankingProgress, setRankingProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    message: string;
  } | null>(null);
  
  // AI Ranking prompt modal state
  const [showRankingPromptModal, setShowRankingPromptModal] = useState(false);
  
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
  }, [user, isEmployer, selectedJob, sortBy, passedHardGateFilter, selectedSkills, selectedLocations, selectedExperienceLevels, searchQuery]);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      // Fetch all candidates at once (no pagination, use scrollable container instead)
      params.set('page', '1');
      params.set('limit', '200');
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
      if (selectedExperienceLevels.size > 0) {
        params.set('experienceLevels', Array.from(selectedExperienceLevels).join(','));
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
  };

  // AI Ranking function with real-time progress polling
  const handleStartRanking = async () => {
    if (!selectedJob) {
      setRankingError('Please select a job to rank candidates');
      return;
    }
    
    setIsRanking(true);
    setRankingError(null);
    setRankingResult(null);
    setRankingProgress({ current: 0, total: 0, percent: 0, message: 'Starting ranking...' });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRankingError('Session expired. Please log in again.');
        setIsRanking(false);
        setRankingProgress(null);
        return;
      }
      
      // Submit async ranking task
      const response = await fetch(`/api/ranking/job/${selectedJob}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sync: false }), // 异步模式
      });
      
      const submitResult = await response.json();
      
      if (!submitResult.success || !submitResult.taskId) {
        setRankingError(submitResult.error || 'Failed to start ranking task');
        setIsRanking(false);
        setRankingProgress(null);
        return;
      }
      
      const taskId = submitResult.taskId;
      setRankingProgress({ current: 0, total: 0, percent: 0, message: 'Task submitted, waiting...' });
      
      // Poll for progress
      const pollInterval = 1500; // 1.5 seconds
      const maxWaitTime = 10 * 60 * 1000; // 10 minutes max
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        try {
          const statusResponse = await fetch(`/api/tasks/${taskId}`);
          const statusData = await statusResponse.json();
          
          if (!statusData.success) continue;
          
          const taskStatus = statusData.data;
          
          // Update progress from task metadata
          if (taskStatus.progress) {
            const progress = taskStatus.progress;
            setRankingProgress({
              current: progress.current || 0,
              total: progress.total || 0,
              percent: progress.progress_percent || 0,
              message: progress.message || `Ranking in progress...`,
            });
          }
          
          // Task completed
          if (taskStatus.ready) {
            if (taskStatus.result?.success) {
              const result = taskStatus.result;
              
              // Transform result to expected format
              const rankingData: RankingResult = {
                jobPostingId: result.job_posting_id,
                jobTitle: result.job_title,
                rankedCandidates: (result.ranked_candidates || []).map((c: { candidate_id: string; rank: number; name?: string; email?: string }) => ({
                  candidateId: c.candidate_id,
                  rank: c.rank,
                  name: c.name,
                  email: c.email,
                })),
                totalCandidates: result.total_candidates,
                stats: {
                  totalComparisons: result.total_comparisons || 0,
                  totalTokens: result.total_tokens || 0,
                  totalCost: result.total_cost || 0,
                  inputTokens: result.total_input_tokens || 0,
                  outputTokens: result.total_output_tokens || 0,
                  inputCost: result.input_cost || 0,
                  outputCost: result.output_cost || 0,
                },
                cacheStatus: {
                  fromCache: result.from_cache || false,
                  isIncremental: result.is_incremental || false,
                  newCandidatesCount: result.new_candidates_count || 0,
                  cachedAt: null,
                },
              };
              
              setRankingResult(rankingData);
              
              // Update applicants with AI ranking
              setData(prev => {
                if (!prev) return prev;
                
                const rankMap = new Map<string, number>();
                (rankingData.rankedCandidates || []).forEach((rc: RankedCandidate) => {
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
              
              setRankingProgress(null);
              setIsRanking(false);
              return;
            } else {
              setRankingError(taskStatus.result?.error || 'Ranking task failed');
              setRankingProgress(null);
              setIsRanking(false);
              return;
            }
          }
        } catch (pollError) {
          console.error('Poll error:', pollError);
          // Continue polling on error
        }
      }
      
      // Timeout
      setRankingError('Ranking task timed out. Please try again.');
      setRankingProgress(null);
      
    } catch (error) {
      console.error('Ranking error:', error);
      setRankingError(error instanceof Error ? error.message : 'An error occurred while ranking');
      setRankingProgress(null);
    } finally {
      setIsRanking(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSkills(new Set());
    setSelectedLocations(new Set());
    setSelectedExperienceLevels(new Set());
    setPassedHardGateFilter('');
    setSelectedJob('');
    setSkillSearchQuery('');
    setShowAllSkills(false);
    setShowAllLocations(false);
  };

  // Fetch job posting details with screening questions
  const fetchJobDetails = async (jobId: string): Promise<JobPostingDetails | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const response = await fetch(`/api/job-postings/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching job details:', error);
      return null;
    }
  };

  // Handle invite button click
  const handleInviteClick = async (applicant: Applicant) => {
    if (!selectedJob) {
      alert('Please select a job first to invite candidates.');
      return;
    }

    setLoadingJobDetails(true);
    
    // Fetch job details with screening questions
    const jobDetails = await fetchJobDetails(selectedJob);
    
    if (!jobDetails) {
      alert('Failed to load job details. Please try again.');
      setLoadingJobDetails(false);
      return;
    }

    // Check if job has screening questions
    const totalQuestions = 
      (jobDetails.systemScreeningAnswers?.length || 0) + 
      (jobDetails.customScreeningQuestions?.length || 0);

    if (totalQuestions === 0) {
      alert('This job has no screening questions configured. Please add screening questions in the job settings first.');
      setLoadingJobDetails(false);
      return;
    }

    setSelectedJobDetails(jobDetails);
    setInviteCandidates([{
      candidateId: applicant.candidateId,
      candidateName: applicant.candidate.name,
      candidateEmail: applicant.candidate.email,
    }]);
    setInviteModalOpen(true);
    setLoadingJobDetails(false);
  };

  // Handle invite sent callback
  const handleInviteSent = (result: { success: boolean; count: number }) => {
    if (result.success) {
      // Clear selection after successful invite
      setSelectedApplicants(new Set());
      console.log(`Successfully sent ${result.count} invitation(s)`);
    }
  };

  // Toggle single applicant selection
  const toggleApplicantSelection = (candidateId: string) => {
    setSelectedApplicants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  // Select/deselect all visible applicants
  const toggleSelectAll = () => {
    const visibleApplicants = data?.applicants || [];
    if (selectedApplicants.size === visibleApplicants.length && visibleApplicants.length > 0) {
      // Deselect all
      setSelectedApplicants(new Set());
    } else {
      // Select all
      setSelectedApplicants(new Set(visibleApplicants.map(a => a.candidateId)));
    }
  };

  // Handle batch invite button click
  const handleBatchInviteClick = async () => {
    if (!selectedJob) {
      alert('Please select a job first to invite candidates.');
      return;
    }

    if (selectedApplicants.size === 0) {
      alert('Please select at least one candidate to invite.');
      return;
    }

    setLoadingJobDetails(true);

    // Fetch job details with screening questions
    const jobDetails = await fetchJobDetails(selectedJob);
    if (!jobDetails) {
      setLoadingJobDetails(false);
      alert('Failed to load job details. Please try again.');
      return;
    }

    // Get all selected applicants' info
    const selectedApplicantsList = (data?.applicants || [])
      .filter(a => selectedApplicants.has(a.candidateId))
      .map(a => ({
        candidateId: a.candidateId,
        candidateName: a.candidate.name,
        candidateEmail: a.candidate.email,
      }));

    setSelectedJobDetails(jobDetails);
    setInviteCandidates(selectedApplicantsList);
    setInviteModalOpen(true);
    setLoadingJobDetails(false);
  };

  // Handle message button click
  const handleMessageClick = (applicant: Applicant) => {
    setMessageCandidates([{
      candidateId: applicant.candidateId,
      candidateName: applicant.candidate.name,
      candidateEmail: applicant.candidate.email,
    }]);
    setMessageModalOpen(true);
  };

  // Handle message sent callback
  const handleMessageSent = (result: { success: boolean; count: number }) => {
    if (result.success) {
      console.log(`Successfully sent ${result.count} message(s)`);
    }
  };

  const getExperienceLevelDisplay = (level: string) => {
    const labels: Record<string, string> = {
      'INTERN': 'Intern',
      'JUNIOR': 'Entry Level',
      'MID_LEVEL': 'Mid Level',
      'SENIOR': 'Senior',
      'LEAD': 'Lead',
      'PRINCIPAL': 'Principal',
    };
    return labels[level] || level;
  };

  // Filter skills based on search query
  const filteredSkillOptions = (data?.filterOptions?.skills || []).filter(skill =>
    skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase())
  );

  const hasActiveFilters = selectedSkills.size > 0 || selectedLocations.size > 0 || 
    selectedExperienceLevels.size > 0 || passedHardGateFilter !== '' || searchQuery !== '';

  // Format location which can be a string or an object with city/state/country
  const formatLocation = (location: string | { city?: string; state?: string; country?: string } | null): string => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    const parts = [location.city, location.state, location.country].filter(Boolean);
    return parts.join(', ');
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
                {hasActiveFilters && (
                  <button className={styles.clearSearchBtn} onClick={clearAllFilters}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    Clear filters
                  </button>
                )}
              </div>

              {/* Search / Keywords Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Search</h3>
                <div className={styles.searchInputWrapper}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Name, email, or keyword..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                    }}
                    className={styles.searchInput}
                  />
                  {searchQuery && (
                    <button 
                      className={styles.clearInputBtn}
                      onClick={() => setSearchQuery('')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Skills Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>
                  Skills
                  {selectedSkills.size > 0 && (
                    <span className={styles.selectedCount}>({selectedSkills.size})</span>
                  )}
                </h3>
                {(data?.filterOptions?.skills?.length || 0) > 5 && (
                  <div className={styles.filterSearchWrapper}>
                    <input
                      type="text"
                      placeholder="Search skills..."
                      value={skillSearchQuery}
                      onChange={(e) => setSkillSearchQuery(e.target.value)}
                      className={styles.filterSearchInput}
                    />
                  </div>
                )}
                <div className={styles.filterOptions}>
                  {filteredSkillOptions.length === 0 ? (
                    <div className={styles.noFilterOptions}>
                      {skillSearchQuery ? 'No skills match your search' : 'No skills available'}
                    </div>
                  ) : (
                    <>
                      {filteredSkillOptions.slice(0, showAllSkills ? undefined : 8).map(skill => (
                        <label key={skill.name} className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={selectedSkills.has(skill.name)}
                            onChange={() => toggleFilter(selectedSkills, setSelectedSkills, skill.name)}
                            className={styles.checkbox}
                          />
                          <span className={styles.filterOptionName}>{skill.name}</span>
                          <span className={styles.filterCount}>({skill.count})</span>
                        </label>
                      ))}
                      {filteredSkillOptions.length > 8 && (
                        <button 
                          className={styles.showMoreFiltersBtn}
                          onClick={() => setShowAllSkills(!showAllSkills)}
                        >
                          {showAllSkills ? 'Show less' : `Show all ${filteredSkillOptions.length}`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Location Filter - Hierarchical */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>
                  Location
                  {selectedLocations.size > 0 && (
                    <span className={styles.selectedCount}>({selectedLocations.size})</span>
                  )}
                </h3>
                <div className={styles.filterOptions}>
                  {(data?.filterOptions?.locations?.countries?.length || 0) === 0 ? (
                    <div className={styles.noFilterOptions}>No locations available</div>
                  ) : (
                    <>
                      {(data?.filterOptions?.locations?.countries || [])
                        .slice(0, showAllLocations ? undefined : 6)
                        .map(country => (
                        <div key={country.name} className={styles.locationHierarchy}>
                          {/* Country Level */}
                          <div className={styles.locationCountryRow}>
                            <button
                              type="button"
                              className={styles.locationExpandBtn}
                              onClick={() => {
                                const newSet = new Set(expandedCountries);
                                if (newSet.has(country.name)) {
                                  newSet.delete(country.name);
                                } else {
                                  newSet.add(country.name);
                                }
                                setExpandedCountries(newSet);
                              }}
                            >
                              {expandedCountries.has(country.name) ? '▼' : '▶'}
                            </button>
                            <label className={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={selectedLocations.has(`country:${country.name.toLowerCase()}`)}
                                onChange={() => toggleFilter(selectedLocations, setSelectedLocations, `country:${country.name.toLowerCase()}`)}
                                className={styles.checkbox}
                              />
                              <span className={styles.filterOptionName}>{country.name}</span>
                              <span className={styles.filterCount}>({country.count})</span>
                            </label>
                          </div>
                          
                          {/* State Level - shown when country expanded */}
                          {expandedCountries.has(country.name) && country.states && (
                            <div className={styles.locationStateList}>
                              {country.states
                                .filter(state => state.name !== '(No State)')
                                .map(state => (
                                <div key={`${country.name}-${state.name}`} className={styles.locationStateItem}>
                                  <div className={styles.locationStateRow}>
                                    {state.cities && state.cities.filter(c => c.name !== '(No City)').length > 0 && (
                                      <button
                                        type="button"
                                        className={styles.locationExpandBtn}
                                        onClick={() => {
                                          const key = `${country.name}-${state.name}`;
                                          const newSet = new Set(expandedStates);
                                          if (newSet.has(key)) {
                                            newSet.delete(key);
                                          } else {
                                            newSet.add(key);
                                          }
                                          setExpandedStates(newSet);
                                        }}
                                      >
                                        {expandedStates.has(`${country.name}-${state.name}`) ? '▼' : '▶'}
                                      </button>
                                    )}
                                    <label className={styles.checkboxLabel}>
                                      <input
                                        type="checkbox"
                                        checked={selectedLocations.has(`state:${state.name.toLowerCase()}`)}
                                        onChange={() => toggleFilter(selectedLocations, setSelectedLocations, `state:${state.name.toLowerCase()}`)}
                                        className={styles.checkbox}
                                      />
                                      <span className={styles.filterOptionName}>{state.name}</span>
                                      <span className={styles.filterCount}>({state.count})</span>
                                    </label>
                                  </div>
                                  
                                  {/* City Level - shown when state expanded */}
                                  {expandedStates.has(`${country.name}-${state.name}`) && state.cities && (
                                    <div className={styles.locationCityList}>
                                      {state.cities
                                        .filter(city => city.name !== '(No City)')
                                        .map(city => (
                                        <label key={`${country.name}-${state.name}-${city.name}`} className={styles.checkboxLabel}>
                                          <input
                                            type="checkbox"
                                            checked={selectedLocations.has(`city:${city.name.toLowerCase()}`)}
                                            onChange={() => toggleFilter(selectedLocations, setSelectedLocations, `city:${city.name.toLowerCase()}`)}
                                            className={styles.checkbox}
                                          />
                                          <span className={styles.filterOptionName}>{city.name}</span>
                                          <span className={styles.filterCount}>({city.count})</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {(data?.filterOptions?.locations?.countries?.length || 0) > 6 && (
                        <button 
                          className={styles.showMoreFiltersBtn}
                          onClick={() => setShowAllLocations(!showAllLocations)}
                        >
                          {showAllLocations ? 'Show less' : `Show all ${data?.filterOptions?.locations?.countries?.length} countries`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Experience Level Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>
                  Experience Level
                  {selectedExperienceLevels.size > 0 && (
                    <span className={styles.selectedCount}>({selectedExperienceLevels.size})</span>
                  )}
                </h3>
                <div className={styles.filterOptions}>
                  {(data?.filterOptions?.experienceLevels?.length || 0) === 0 ? (
                    <div className={styles.noFilterOptions}>No experience levels available</div>
                  ) : (
                    (data?.filterOptions?.experienceLevels || []).map(level => (
                      <label key={level.name} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedExperienceLevels.has(level.name)}
                          onChange={() => toggleFilter(selectedExperienceLevels, setSelectedExperienceLevels, level.name)}
                          className={styles.checkbox}
                        />
                        <span className={styles.filterOptionName}>{getExperienceLevelDisplay(level.name)}</span>
                        <span className={styles.filterCount}>({level.count})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Screening Status Filter */}
              <div className={styles.filterSection}>
                <h3 className={styles.filterTitle}>Screening Status</h3>
                <div className={styles.filterOptions}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={passedHardGateFilter === 'true'}
                      onChange={() => {
                        setPassedHardGateFilter(passedHardGateFilter === 'true' ? '' : 'true');
                      }}
                      className={styles.checkbox}
                    />
                    <span className={styles.filterOptionName}>Passed screening</span>
                    <span className={`${styles.filterCount} ${styles.filterCountSuccess}`}>({data?.stats.passed || 0})</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={passedHardGateFilter === 'false'}
                      onChange={() => {
                        setPassedHardGateFilter(passedHardGateFilter === 'false' ? '' : 'false');
                      }}
                      className={styles.checkbox}
                    />
                    <span className={styles.filterOptionName}>Did not pass</span>
                    <span className={`${styles.filterCount} ${styles.filterCountFailed}`}>({data?.stats.failed || 0})</span>
                  </label>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Spotlights / AI Ranking Info */}
            {activeTab === 'recommended' && rankingResult ? (
              <div className={`${styles.topCandidatesPanel} ${topMatchesCollapsed ? styles.topCandidatesPanelCollapsed : ''}`}>
                <div className={styles.topCandidatesHeader}>
                  <div className={styles.topCandidatesHeaderLeft}>
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
                  <button 
                    className={styles.topMatchesToggleBtn}
                    onClick={() => setTopMatchesCollapsed(!topMatchesCollapsed)}
                    title={topMatchesCollapsed ? 'Expand top matches' : 'Collapse top matches'}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{ transform: topMatchesCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </button>
                </div>
                {!topMatchesCollapsed && (
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
                )}
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
                    {rankingProgress ? (
                      <>
                        <p className={styles.progressMessage}>{rankingProgress.message}</p>
                        <div className={styles.progressBarContainer}>
                          <div 
                            className={styles.progressBar} 
                            style={{ width: `${rankingProgress.percent}%` }}
                          />
                        </div>
                        <p className={styles.progressStats}>
                          {rankingProgress.current} / {rankingProgress.total} candidates • {rankingProgress.percent}% complete
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Comparing candidates using binary insertion algorithm...</p>
                        <p className={styles.progressHint}>This may take a moment depending on the number of candidates</p>
                      </>
                    )}
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
              <div className={`${styles.spotlights} ${spotlightCollapsed ? styles.spotlightsCollapsed : ''}`}>
                <div className={styles.spotlightsHeader}>
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
                  <button 
                    className={styles.spotlightToggleBtn}
                    onClick={() => setSpotlightCollapsed(!spotlightCollapsed)}
                    title={spotlightCollapsed ? 'Expand spotlights' : 'Collapse spotlights'}
                  >
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{ transform: spotlightCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  </button>
                </div>
                
                {!spotlightCollapsed && (
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
                )}
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
                  checked={selectedApplicants.size > 0 && selectedApplicants.size === (data?.applicants?.length || 0)}
                  onChange={toggleSelectAll}
                />
                <span className={styles.resultsText}>
                  {selectedApplicants.size > 0 
                    ? `${selectedApplicants.size} SELECTED`
                    : activeTab === 'recommended' 
                      ? `${data?.stats.passed || 0} RANKED CANDIDATES`
                      : `${data?.pagination.total.toLocaleString() || 0} RESULTS`
                  }
                </span>
                
                {/* Batch Action Buttons */}
                {selectedApplicants.size > 0 && (
                  <div className={styles.batchActions}>
                    <button 
                      className={styles.batchInviteBtn}
                      onClick={handleBatchInviteClick}
                      disabled={loadingJobDetails || !selectedJob}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                      {loadingJobDetails ? 'Loading...' : `Invite ${selectedApplicants.size} Candidate${selectedApplicants.size > 1 ? 's' : ''}`}
                    </button>
                    <button 
                      className={styles.batchClearBtn}
                      onClick={() => setSelectedApplicants(new Set())}
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
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
              <div className={`${styles.applicantList} ${(activeTab === 'recommended' ? topMatchesCollapsed : spotlightCollapsed) ? styles.applicantListExpanded : ''}`}>
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
                      <input 
                        type="checkbox" 
                        className={styles.applicantCheckbox}
                        checked={selectedApplicants.has(applicant.candidateId)}
                        onChange={() => toggleApplicantSelection(applicant.candidateId)}
                      />
                      
                      {activeTab === 'recommended' && (
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
                        <p className={styles.applicantLocation}>{formatLocation(applicant.candidate.location)}</p>

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
                        <button 
                          className={styles.btnInvite}
                          onClick={() => handleInviteClick(applicant)}
                          disabled={loadingJobDetails}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                          </svg>
                          {loadingJobDetails ? 'Loading...' : 'Invite'}
                        </button>
                        <div className={styles.moreMenuContainer} ref={openDropdownId === applicant.id ? dropdownRef : null}>
                          <button 
                            className={styles.btnMore}
                            onClick={() => setOpenDropdownId(openDropdownId === applicant.id ? null : applicant.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>
                          {openDropdownId === applicant.id && (
                            <div className={styles.moreMenu}>
                              <button 
                                className={styles.moreMenuItem}
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  handleMessageClick(applicant);
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Message
                              </button>
                              <button className={styles.moreMenuItem}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Download CV
                              </button>
                              <button className={styles.moreMenuItem}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="18" cy="5" r="3"></circle>
                                  <circle cx="6" cy="12" r="3"></circle>
                                  <circle cx="18" cy="19" r="3"></circle>
                                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                </svg>
                                Share Profile
                              </button>
                              <button className={styles.moreMenuItem}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Add Note
                              </button>
                            </div>
                          )}
                        </div>
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

      {/* Invite Modal */}
      <InviteModal
        isOpen={inviteModalOpen}
        onClose={() => {
          setInviteModalOpen(false);
          setInviteCandidates([]);
          setSelectedJobDetails(null);
        }}
        candidates={inviteCandidates}
        jobPosting={selectedJobDetails}
        onInviteSent={handleInviteSent}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModalOpen}
        onClose={() => {
          setMessageModalOpen(false);
          setMessageCandidates([]);
        }}
        candidates={messageCandidates}
        onMessageSent={handleMessageSent}
      />
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
