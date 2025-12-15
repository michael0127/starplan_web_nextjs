import { memo } from 'react';
import styles from './SkeletonLoader.module.css';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'jobList' | 'jobForm';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

/**
 * Skeleton loader component for better loading UX
 * Shows placeholder content while data is loading
 */
export const SkeletonLoader = memo(function SkeletonLoader({
  variant = 'text',
  width = '100%',
  height,
  count = 1,
  className = '',
}: SkeletonLoaderProps) {
  const getDefaultHeight = () => {
    switch (variant) {
      case 'text':
        return '1em';
      case 'circular':
        return 40;
      case 'rectangular':
        return 140;
      case 'card':
        return 200;
      default:
        return 40;
    }
  };

  const finalHeight = height || getDefaultHeight();

  const renderSkeleton = () => (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={{ width, height: finalHeight }}
    />
  );

  if (count > 1) {
    return (
      <div className={styles.skeletonGroup}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index}>{renderSkeleton()}</div>
        ))}
      </div>
    );
  }

  return renderSkeleton();
});

/**
 * Job Card Skeleton - mimics JobCard component structure
 */
export const JobCardSkeleton = memo(function JobCardSkeleton() {
  return (
    <div className={styles.jobCardSkeleton}>
      <div className={styles.jobCardHeader}>
        <div>
          <div className={styles.jobCardTitleRow}>
            <SkeletonLoader variant="text" width="60%" height={24} />
            <SkeletonLoader variant="rectangular" width={80} height={24} />
          </div>
          <div className={styles.jobCardMeta}>
            <SkeletonLoader variant="text" width="40%" height={14} />
          </div>
          <div className={styles.jobCardCategories}>
            <SkeletonLoader variant="rectangular" width={120} height={28} />
            <SkeletonLoader variant="rectangular" width={100} height={28} />
            <SkeletonLoader variant="rectangular" width={90} height={28} />
          </div>
        </div>
      </div>
      
      <div className={styles.jobCardSummary}>
        <SkeletonLoader variant="text" width="100%" count={2} />
      </div>
      
      <div className={styles.jobCardActions}>
        <SkeletonLoader variant="rectangular" width={140} height={40} />
        <SkeletonLoader variant="rectangular" width={100} height={40} />
      </div>
    </div>
  );
});

/**
 * Job List Skeleton - shows multiple job cards
 */
export const JobListSkeleton = memo(function JobListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.jobListSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  );
});

/**
 * Job Form Skeleton - for loading job posting form
 */
export const JobFormSkeleton = memo(function JobFormSkeleton() {
  return (
    <div className={styles.jobFormSkeleton}>
      {/* Title */}
      <div className={styles.formSection}>
        <SkeletonLoader variant="text" width={150} height={20} />
        <SkeletonLoader variant="rectangular" width="100%" height={48} />
      </div>
      
      {/* Category */}
      <div className={styles.formSection}>
        <SkeletonLoader variant="text" width={100} height={20} />
        <div className={styles.categoryGrid}>
          <SkeletonLoader variant="rectangular" width="100%" height={80} />
          <SkeletonLoader variant="rectangular" width="100%" height={80} />
          <SkeletonLoader variant="rectangular" width="100%" height={80} />
        </div>
      </div>
      
      {/* Other fields */}
      <div className={styles.formSection}>
        <SkeletonLoader variant="text" width={120} height={20} />
        <SkeletonLoader variant="rectangular" width="100%" height={48} />
      </div>
      
      <div className={styles.formSection}>
        <SkeletonLoader variant="text" width={140} height={20} />
        <SkeletonLoader variant="rectangular" width="100%" height={48} />
      </div>
    </div>
  );
});

/**
 * Spinner Loader - for inline loading states
 */
export const SpinnerLoader = memo(function SpinnerLoader({
  size = 40,
  color = '#2563eb',
  text,
}: {
  size?: number;
  color?: string;
  text?: string;
}) {
  return (
    <div className={styles.spinnerContainer}>
      <div
        className={styles.spinner}
        style={{
          width: size,
          height: size,
          borderColor: `${color}20`,
          borderTopColor: color,
        }}
      />
      {text && <p className={styles.spinnerText}>{text}</p>}
    </div>
  );
});

/**
 * Pulse Loader - dots animation
 */
export const PulseLoader = memo(function PulseLoader({
  text = 'Loading',
}: {
  text?: string;
}) {
  return (
    <div className={styles.pulseContainer}>
      <div className={styles.pulseDots}>
        <div className={styles.pulseDot} style={{ animationDelay: '0s' }} />
        <div className={styles.pulseDot} style={{ animationDelay: '0.2s' }} />
        <div className={styles.pulseDot} style={{ animationDelay: '0.4s' }} />
      </div>
      {text && <p className={styles.pulseText}>{text}</p>}
    </div>
  );
});

/**
 * Progress Bar Loader
 */
export const ProgressLoader = memo(function ProgressLoader({
  progress = 0,
  text,
}: {
  progress?: number;
  text?: string;
}) {
  return (
    <div className={styles.progressContainer}>
      {text && <p className={styles.progressText}>{text}</p>}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className={styles.progressPercent}>{Math.round(progress)}%</p>
    </div>
  );
});

