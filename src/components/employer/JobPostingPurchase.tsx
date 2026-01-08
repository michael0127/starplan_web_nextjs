/**
 * Job Posting Purchase Component
 * Displays pricing and handles purchase flow for job postings
 */

'use client';

import { useState } from 'react';
import { getStripeProductConfig, formatCurrency } from '@/lib/stripeProducts';
import styles from './JobPostingPurchase.module.css';

// Simple SVG Icons
const Icons = {
  location: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  briefcase: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  ),
  star: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  dollar: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  tag: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  calendar: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  edit: (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  check: (
    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  lock: (
    <svg className={styles.lockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  shield: (
    <svg className={styles.shieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

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
}

interface JobPostingPurchaseProps {
  jobPosting: JobPosting;
  onSuccess?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

export default function JobPostingPurchase({
  jobPosting,
  onSuccess,
  onCancel,
  onEdit,
}: JobPostingPurchaseProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productConfig = getStripeProductConfig(jobPosting.experienceLevel);
  const isJuniorLevel = ['INTERN', 'JUNIOR'].includes(jobPosting.experienceLevel.toUpperCase());

  const handlePurchase = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/job-postings/${jobPosting.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/employer/jobs?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/employer/jobs/new?canceled=true`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process purchase');
      setLoading(false);
    }
  };

  const formatSalary = () => {
    if (!jobPosting.showSalaryOnAd && jobPosting.salaryDisplayText) {
      return jobPosting.salaryDisplayText;
    }
    
    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'AUD': 'A$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CNY': '¥',
    };
    
    const symbol = currencySymbols[jobPosting.currency] || jobPosting.currency;
    return `${symbol}${jobPosting.payFrom} - ${symbol}${jobPosting.payTo}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        {/* Left Column: Job Review */}
        <div className={styles.reviewSection}>
          <div className={styles.sectionHeader}>
            <h2>Review Your Job Posting</h2>
            {onEdit && (
              <button className={styles.editButton} onClick={onEdit}>
                {Icons.edit}
                <span>Edit</span>
              </button>
            )}
          </div>

          <div className={styles.reviewCard}>
            <div className={styles.jobHeader}>
              <h3>{jobPosting.jobTitle}</h3>
              <p className={styles.companyName}>{jobPosting.companyName}</p>
            </div>

            <div className={styles.jobDetails}>
              <div className={styles.detailRow}>
                {Icons.location}
                <span className={styles.detailLabel}>Location</span>
                <span className={styles.detailValue}>{jobPosting.countryRegion}</span>
              </div>
              <div className={styles.detailRow}>
                {Icons.briefcase}
                <span className={styles.detailLabel}>Work Type</span>
                <span className={styles.detailValue}>{jobPosting.workType.replace('_', ' ')}</span>
              </div>
              <div className={styles.detailRow}>
                {Icons.star}
                <span className={styles.detailLabel}>Experience</span>
                <span className={styles.detailValue}>{jobPosting.experienceLevel.replace('_', ' ')}</span>
              </div>
              <div className={styles.detailRow}>
                {Icons.dollar}
                <span className={styles.detailLabel}>Salary</span>
                <span className={styles.detailValue}>{formatSalary()}</span>
              </div>
              {jobPosting.categories.length > 0 && (
                <div className={styles.detailRow}>
                  {Icons.tag}
                  <span className={styles.detailLabel}>Categories</span>
                  <span className={styles.detailValue}>{jobPosting.categories.join(', ')}</span>
                </div>
              )}
              {jobPosting.applicationDeadline && (
                <div className={styles.detailRow}>
                  {Icons.calendar}
                  <span className={styles.detailLabel}>Deadline</span>
                  <span className={styles.detailValue}>
                    {new Date(jobPosting.applicationDeadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Payment */}
        <div className={styles.paymentSection}>
          <div className={styles.stickyPayment}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingHeader}>
                <span className={styles.badge}>
                  {isJuniorLevel ? 'Junior Package' : 'Senior Package'}
                </span>
                <div className={styles.priceDisplay}>
                  <span className={styles.priceAmount}>
                    {formatCurrency(productConfig.amount, productConfig.currency)}
                  </span>
                  <span className={styles.priceLabel}>one-time payment</span>
                </div>
              </div>

              <div className={styles.features}>
                <ul>
                  <li>{Icons.check} 30 days of visibility</li>
                  <li>{Icons.check} Unlimited applications</li>
                  <li>{Icons.check} Advanced screening tools</li>
                  <li>{Icons.check} Candidate matching</li>
                  <li>{Icons.check} Email notifications</li>
                  {!isJuniorLevel && (
                    <>
                      <li>{Icons.check} Featured placement</li>
                      <li>{Icons.check} Priority support</li>
                      <li>{Icons.check} Enhanced analytics</li>
                    </>
                  )}
                </ul>
              </div>

              <div className={styles.pricingBreakdown}>
                <div className={styles.breakdownRow}>
                  <span>Job Posting Package</span>
                  <span>{formatCurrency(productConfig.amount, productConfig.currency)}</span>
                </div>
                <div className={styles.breakdownRow}>
                  <span>Platform Fee</span>
                  <span className={styles.included}>Included</span>
                </div>
                <div className={styles.breakdownTotal}>
                  <span>Total</span>
                  <span>{formatCurrency(productConfig.amount, productConfig.currency)}</span>
                </div>
              </div>

              {error && (
                <div className={styles.error}>
                  <p>{error}</p>
                </div>
              )}

              <div className={styles.actions}>
                <button
                  className={styles.purchaseButton}
                  onClick={handlePurchase}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      {Icons.lock}
                      Proceed to Payment
                    </>
                  )}
                </button>
                
                {onCancel && (
                  <button
                    className={styles.cancelButton}
                    onClick={onCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className={styles.securePayment}>
                {Icons.shield}
                <span>Secure payment powered by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
