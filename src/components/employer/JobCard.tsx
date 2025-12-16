import { memo } from 'react';
import Link from 'next/link';
import type { JobPosting } from '@/types/jobPosting';
import styles from './JobCard.module.css';

interface JobCardProps {
  job: JobPosting;
  onDelete: (id: string, title: string) => void;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function getStatusBadge(status: string) {
  const statusConfig = {
    DRAFT: { label: 'Draft', className: styles.statusDraft },
    PUBLISHED: { label: 'Published', className: styles.statusPublished },
    CLOSED: { label: 'Closed', className: styles.statusClosed },
    ARCHIVED: { label: 'Archived', className: styles.statusArchived },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
  
  return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
}

export const JobCard = memo(function JobCard({ job, onDelete }: JobCardProps) {
  return (
    <div className={styles.jobCard}>
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
          href={`/employer/jobs/edit/${job.id}`}
          className={job.status === 'DRAFT' ? styles.btnPrimary : styles.btnSecondary}
          prefetch={true}
        >
          {job.status === 'DRAFT' ? 'Continue Editing' : 'Edit'}
        </Link>
        <button
          className={styles.btnDanger}
          onClick={() => onDelete(job.id, job.jobTitle)}
        >
          Delete
        </button>
      </div>
    </div>
  );
});




