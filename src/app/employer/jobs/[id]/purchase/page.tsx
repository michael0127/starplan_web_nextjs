/**
 * Job Posting Purchase Page
 * Final step in job posting flow - payment
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import JobPostingPurchase from '@/components/employer/JobPostingPurchase';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface JobPosting {
  id: string;
  jobTitle: string;
  companyName: string;
  experienceLevel: string;
  workType: string;
  countryRegion: string;
  currency: string;
  payFrom: string;
  payTo: string;
  payType: string;
  showSalaryOnAd: boolean;
  salaryDisplayText?: string;
  categories: string[];
  jobDescription: string;
  jobSummary: string;
  selectedCountries: string[];
  applicationDeadline?: string;
  status: string;
}

export default function JobPostingPurchasePage() {
  const params = useParams();
  const router = useRouter();
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobPosting();
  }, [params.id]);

  const fetchJobPosting = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/job-postings/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job posting');
      }

      const result = await response.json();
      setJobPosting(result.data || result);
    } catch (err) {
      console.error('Error fetching job posting:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job posting');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/employer/jobs?success=true');
  };

  const handleCancel = () => {
    router.push('/employer/jobs');
  };

  const handleEdit = () => {
    router.push(`/employer/jobs/new?edit=${params.id}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading your job posting...</p>
      </div>
    );
  }

  if (error || !jobPosting) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p className={styles.errorMessage}>
          {error || 'Job posting not found'}
        </p>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/employer/jobs')}
        >
          ← Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <JobPostingPurchase
      jobPosting={jobPosting}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
      onEdit={handleEdit}
    />
  );
}




