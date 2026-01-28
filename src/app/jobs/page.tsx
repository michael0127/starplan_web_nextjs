'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin, Clock, Building2, ArrowRight, Search, Briefcase, X, DollarSign, Calendar } from 'lucide-react';
import styles from './page.module.css';

interface JobPosting {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  };
  location: string;
  type: string;
  level?: string;
  experienceYears?: string;
  salary?: string;
  categories?: string[];
  skills?: string[];
  summary?: string;
  highlights?: string[];
  createdAt: string;
}

interface JobDetails {
  id: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  companyCoverImage?: string;
  countryRegion: string;
  workType: string;
  experienceLevel?: string;
  experienceYearsFrom?: number;
  experienceYearsTo?: string;
  payFrom?: string;
  payTo?: string;
  payType?: string;
  currency?: string;
  showSalaryOnAd?: boolean;
  salaryDisplayText?: string;
  categories?: string[];
  categorySkills?: string[];
  jobSummary?: string;
  jobDescription?: string;
  keySellingPoint1?: string;
  keySellingPoint2?: string;
  keySellingPoint3?: string;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
}

// Normalize workType for display
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

// Format date for display
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format salary display
const formatSalary = (job: JobDetails) => {
  if (job.salaryDisplayText) return job.salaryDisplayText;
  if (!job.payFrom && !job.payTo) return 'Not specified';
  
  const formatNum = (num: string) => {
    const n = parseFloat(num);
    if (isNaN(n)) return num;
    return n.toLocaleString();
  };
  
  const currency = job.currency || 'AUD';
  if (job.payFrom && job.payTo) {
    return `${currency} ${formatNum(job.payFrom)} - ${formatNum(job.payTo)} ${job.payType === 'ANNUAL' ? 'per year' : job.payType === 'HOURLY' ? 'per hour' : ''}`;
  }
  if (job.payFrom) {
    return `${currency} ${formatNum(job.payFrom)}+ ${job.payType === 'ANNUAL' ? 'per year' : job.payType === 'HOURLY' ? 'per hour' : ''}`;
  }
  return 'Not specified';
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewJob, setPreviewJob] = useState<JobDetails | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs/public');
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobPostings || []);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open preview panel with job details
  const openPreview = async (jobId: string) => {
    setPreviewOpen(true);
    setLoadingPreview(true);
    
    try {
      const response = await fetch(`/api/jobs/public/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setPreviewJob(data.data);
      } else {
        setPreviewJob(null);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      setPreviewJob(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewJob(null);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/img/star.png" alt="StarPlan" width={24} height={24} />
              <span className="font-semibold text-text-primary">StarPlan</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-full transition-colors"
              >
                Create profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-text-primary mb-4">
              AI & ML Jobs
            </h1>
            <p className="text-lg text-text-secondary max-w-xl mx-auto">
              Discover opportunities at top AI startups. Get matched based on your real skills.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
              <input
                type="text"
                placeholder="Search by title, company, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-text-muted">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-surface-2 flex items-center justify-center">
              <Briefcase size={28} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {searchTerm ? 'No matching jobs found' : 'No jobs available yet'}
            </h3>
            <p className="text-text-secondary mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Check back soon for new opportunities'}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-full transition-colors"
            >
              Create profile to get notified
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-text-secondary">
                <span className="font-medium text-text-primary">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'job' : 'jobs'} available
              </p>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => openPreview(job.id)}
                    className="w-full text-left p-6 bg-white border border-border rounded-2xl hover:border-primary/30 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Company Logo */}
                      <div className="w-14 h-14 rounded-xl bg-surface-2 flex items-center justify-center shrink-0 overflow-hidden border border-border">
                        {job.company?.logo ? (
                          <Image
                            src={job.company.logo}
                            alt={job.company.name}
                            width={56}
                            height={56}
                            className="object-cover"
                          />
                        ) : (
                          <Building2 size={28} className="text-text-muted" />
                        )}
                      </div>

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary transition-colors">
                              {job.title}
                            </h3>
                            <p className="text-text-secondary font-medium">{job.company?.name || 'Company'}</p>
                          </div>
                          <ArrowRight 
                            size={20} 
                            className="text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" 
                          />
                        </div>

                        {/* Meta info row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-muted">
                          {job.location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin size={14} />
                              {job.location}
                            </span>
                          )}
                          {job.type && (
                            <span className="flex items-center gap-1.5">
                              <Briefcase size={14} />
                              {normalizeWorkType(job.type)}
                            </span>
                          )}
                          {job.level && (
                            <span className="flex items-center gap-1.5">
                              {job.level}
                              {job.experienceYears && <span className="text-text-muted">({job.experienceYears} yrs)</span>}
                            </span>
                          )}
                          {job.createdAt && (
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} />
                              {formatDate(job.createdAt)}
                            </span>
                          )}
                        </div>

                        {/* Salary */}
                        {job.salary && (
                          <p className="mt-2 text-sm font-semibold text-success">{job.salary}</p>
                        )}

                        {/* Summary */}
                        {job.summary && (
                          <p className="mt-3 text-sm text-text-secondary line-clamp-2">
                            {job.summary}
                          </p>
                        )}

                        {/* Highlights */}
                        {job.highlights && job.highlights.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {job.highlights.slice(0, 2).map((highlight, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-success/10 text-success rounded-full">
                                <span className="w-1 h-1 rounded-full bg-success" />
                                {highlight.length > 40 ? highlight.slice(0, 40) + '...' : highlight}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Categories & Skills */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {job.categories && job.categories.slice(0, 2).map((cat, i) => (
                            <span key={`cat-${i}`} className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                              {cat}
                            </span>
                          ))}
                          {job.skills && job.skills.slice(0, 3).map((skill, i) => (
                            <span key={`skill-${i}`} className="px-2.5 py-1 text-xs bg-surface-2 text-text-secondary rounded-full">
                              {skill}
                            </span>
                          ))}
                          {((job.categories?.length || 0) + (job.skills?.length || 0)) > 5 && (
                            <span className="px-2.5 py-1 text-xs text-text-muted">
                              +{(job.categories?.length || 0) + (job.skills?.length || 0) - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Get matched to the right roles
          </h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            Create a profile and let our AI match you with opportunities based on your real skills.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-white bg-primary hover:bg-primary-dark rounded-full transition-colors"
          >
            Create your profile
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Job Preview Panel */}
      {previewOpen && (
        <>
          <div className={styles.previewOverlay} onClick={closePreview} />
          <div className={styles.previewPanel}>
            <div className={styles.previewHeader}>
              <h2 className={styles.previewTitle}>Job Details</h2>
              <button className={styles.previewClose} onClick={closePreview}>
                <X size={24} />
              </button>
            </div>

            {loadingPreview ? (
              <div className={styles.previewLoading}>
                <div className={styles.spinner} />
                <span>Loading job details...</span>
              </div>
            ) : previewJob ? (
              <div className={styles.previewContent}>
                {/* Company Header */}
                {previewJob.companyCoverImage && (
                  <div className={styles.previewCover}>
                    <img src={previewJob.companyCoverImage} alt="Company cover" />
                  </div>
                )}
                
                <div className={styles.previewCompanyInfo}>
                  {previewJob.companyLogo ? (
                    <img 
                      src={previewJob.companyLogo} 
                      alt={previewJob.companyName}
                      className={styles.previewLogo}
                    />
                  ) : (
                    <div className={styles.previewLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={32} color="#999" />
                    </div>
                  )}
                  <div className={styles.previewCompanyDetails}>
                    <h3 className={styles.previewJobTitle}>{previewJob.jobTitle}</h3>
                    <p className={styles.previewCompanyName}>{previewJob.companyName}</p>
                    <div className={styles.previewMeta}>
                      <span>{previewJob.countryRegion}</span>
                      <span className={styles.previewDot}>•</span>
                      <span>{normalizeWorkType(previewJob.workType)}</span>
                    </div>
                  </div>
                </div>

                {/* Key Selling Points */}
                {(previewJob.keySellingPoint1 || previewJob.keySellingPoint2 || previewJob.keySellingPoint3) && (
                  <div className={styles.previewSection}>
                    <h4 className={styles.previewSectionTitle}>Why Join Us</h4>
                    <ul className={styles.previewSellingPoints}>
                      {previewJob.keySellingPoint1 && <li>{previewJob.keySellingPoint1}</li>}
                      {previewJob.keySellingPoint2 && <li>{previewJob.keySellingPoint2}</li>}
                      {previewJob.keySellingPoint3 && <li>{previewJob.keySellingPoint3}</li>}
                    </ul>
                  </div>
                )}

                {/* Quick Info Cards */}
                <div className={styles.previewInfoGrid}>
                  <div className={styles.previewInfoCard}>
                    <div className={styles.previewInfoIcon}>
                      <Briefcase size={20} />
                    </div>
                    <div className={styles.previewInfoContent}>
                      <span className={styles.previewInfoLabel}>Experience</span>
                      <span className={styles.previewInfoValue}>
                        {previewJob.experienceLevel || 'Not specified'}
                        {previewJob.experienceYearsFrom !== undefined && (
                          <> ({previewJob.experienceYearsFrom}{previewJob.experienceYearsTo && previewJob.experienceYearsTo !== 'Unlimited' ? `-${previewJob.experienceYearsTo}` : '+'} years)</>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.previewInfoCard}>
                    <div className={styles.previewInfoIcon}>
                      <DollarSign size={20} />
                    </div>
                    <div className={styles.previewInfoContent}>
                      <span className={styles.previewInfoLabel}>Salary</span>
                      <span className={styles.previewInfoValue}>
                        {previewJob.showSalaryOnAd ? formatSalary(previewJob) : 'Competitive'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.previewInfoCard}>
                    <div className={styles.previewInfoIcon}>
                      <Clock size={20} />
                    </div>
                    <div className={styles.previewInfoContent}>
                      <span className={styles.previewInfoLabel}>Posted</span>
                      <span className={styles.previewInfoValue}>{formatDate(previewJob.createdAt)}</span>
                    </div>
                  </div>

                  {previewJob.applicationDeadline && (
                    <div className={styles.previewInfoCard}>
                      <div className={styles.previewInfoIcon}>
                        <Calendar size={20} />
                      </div>
                      <div className={styles.previewInfoContent}>
                        <span className={styles.previewInfoLabel}>Deadline</span>
                        <span className={styles.previewInfoValue}>{formatDate(previewJob.applicationDeadline)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories */}
                {previewJob.categories && previewJob.categories.length > 0 && (
                  <div className={styles.previewSection}>
                    <h4 className={styles.previewSectionTitle}>Categories</h4>
                    <div className={styles.previewTags}>
                      {previewJob.categories.map((cat, idx) => (
                        <span key={idx} className={styles.previewTag}>{cat}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                {previewJob.categorySkills && previewJob.categorySkills.length > 0 && (
                  <div className={styles.previewSection}>
                    <h4 className={styles.previewSectionTitle}>Required Skills</h4>
                    <div className={styles.previewTags}>
                      {previewJob.categorySkills.map((skill, idx) => (
                        <span key={idx} className={styles.previewSkillTag}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Company Summary */}
                {previewJob.jobSummary && (
                  <div className={styles.previewSection}>
                    <h4 className={styles.previewSectionTitle}>About</h4>
                    <p className={styles.previewSummary}>{previewJob.jobSummary}</p>
                  </div>
                )}

                {/* Job Description */}
                {previewJob.jobDescription && (
                  <div className={styles.previewSection}>
                    <h4 className={styles.previewSectionTitle}>Job Description</h4>
                    <div 
                      className={styles.previewDescription}
                      dangerouslySetInnerHTML={{ __html: previewJob.jobDescription }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.previewError}>
                <p>Unable to load job details</p>
              </div>
            )}

            {/* Footer with Apply Button */}
            <div className={styles.previewFooter}>
              <Link
                href={`/register?job=${previewJob?.id || ''}`}
                className={styles.previewApplyBtn}
              >
                Apply Now
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
