/**
 * Job Posting Purchase Component
 * Displays pricing and handles purchase flow for job postings
 */

'use client';

import { useState } from 'react';
import { getStripeProductConfig, formatCurrency } from '@/lib/stripeProducts';
import styles from './JobPostingPurchase.module.css';

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
      // Get auth token
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create checkout session
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

      // Redirect to Stripe Checkout
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
                ✏️ Edit
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
                <span className={styles.detailLabel}>📍 Location:</span>
                <span className={styles.detailValue}>{jobPosting.countryRegion}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>💼 Work Type:</span>
                <span className={styles.detailValue}>{jobPosting.workType.replace('_', ' ')}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>⭐ Experience:</span>
                <span className={styles.detailValue}>{jobPosting.experienceLevel.replace('_', ' ')}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>💰 Salary:</span>
                <span className={styles.detailValue}>{formatSalary()}</span>
              </div>
              {jobPosting.categories.length > 0 && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>🏷️ Categories:</span>
                  <span className={styles.detailValue}>
                    {jobPosting.categories.join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.jobSummary}>
              <h4>Job Summary</h4>
              <p>{jobPosting.jobSummary || 'No summary provided'}</p>
            </div>

            <div className={styles.jobDescription}>
              <h4>Job Description</h4>
              <div className={styles.descriptionPreview}>
                {jobPosting.jobDescription.substring(0, 300)}
                {jobPosting.jobDescription.length > 300 && '...'}
              </div>
            </div>

            {jobPosting.selectedCountries.length > 0 && (
              <div className={styles.targetCountries}>
                <h4>Target Countries</h4>
                <div className={styles.countryTags}>
                  {jobPosting.selectedCountries.map((country) => (
                    <span key={country} className={styles.countryTag}>
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {jobPosting.applicationDeadline && (
              <div className={styles.deadline}>
                <span className={styles.detailLabel}>📅 Application Deadline:</span>
                <span className={styles.detailValue}>
                  {new Date(jobPosting.applicationDeadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Payment */}
        <div className={styles.paymentSection}>
          <div className={styles.stickyPayment}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingHeader}>
                <h2>Complete Payment</h2>
                <span className={styles.badge}>
                  {isJuniorLevel ? 'Junior Package' : 'Senior Package'}
                </span>
              </div>

              <div className={styles.priceDisplay}>
                <div className={styles.priceAmount}>
                  {formatCurrency(productConfig.amount, productConfig.currency)}
                </div>
                <div className={styles.priceLabel}>one-time payment</div>
              </div>

              <div className={styles.packageInfo}>
                <p className={styles.packageNote}>
                  {isJuniorLevel
                    ? 'Perfect for entry-level positions'
                    : 'Ideal for experienced professionals'}
                </p>
              </div>

              <div className={styles.features}>
                <h3>What's included:</h3>
                <ul>
                  <li><span className={styles.checkmark}>✓</span> 30 days of visibility</li>
                  <li><span className={styles.checkmark}>✓</span> Unlimited applications</li>
                  <li><span className={styles.checkmark}>✓</span> Advanced screening tools</li>
                  <li><span className={styles.checkmark}>✓</span> Candidate matching</li>
                  <li><span className={styles.checkmark}>✓</span> Email notifications</li>
                  {!isJuniorLevel && (
                    <>
                      <li><span className={styles.checkmark}>✓</span> Featured placement</li>
                      <li><span className={styles.checkmark}>✓</span> Priority support</li>
                      <li><span className={styles.checkmark}>✓</span> Enhanced analytics</li>
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
                  <span>Included</span>
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
                      🔒 Proceed to Payment
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
                <p>🔒 Secure payment powered by Stripe</p>
                <p className={styles.secureNote}>Your payment information is encrypted and secure</p>
              </div>

              <div className={styles.moneyBack}>
                <p>💯 100% Money-Back Guarantee</p>
                <p className={styles.moneyBackNote}>
                  Not satisfied? Get a full refund within 7 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




