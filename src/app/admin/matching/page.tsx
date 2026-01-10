'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface MatchResult {
  match_id?: string;
  candidate_id?: string;
  job_posting_id?: string;
  passed_hard_gate?: boolean;
  hard_gate_reasons?: string[];
  match_details?: any;
  is_new?: boolean;  // Indicates if match was newly created or updated
  created_at?: string;
  updated_at?: string;
  // Batch results
  total_jobs?: number;
  total_candidates?: number;
  passed_count?: number;
  failed_count?: number;
  new_matches?: number;     // Count of newly created matches
  updated_matches?: number; // Count of updated existing matches
  matches?: any[];
  message?: string;
}

export default function AdminMatching() {
  const [activeTab, setActiveTab] = useState<'single' | 'candidate-all' | 'job-all'>('single');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Single match form
  const [candidateId, setCandidateId] = useState('');
  const [jobPostingId, setJobPostingId] = useState('');
  const [cvId, setCvId] = useState('');
  const [skipHardGate, setSkipHardGate] = useState(false);

  // Candidate to all jobs form
  const [candidateIdAll, setCandidateIdAll] = useState('');
  const [cvIdAll, setCvIdAll] = useState('');
  const [skipHardGateAll, setSkipHardGateAll] = useState(false);

  // Job to all candidates form
  const [jobPostingIdAll, setJobPostingIdAll] = useState('');
  const [skipHardGateJobAll, setSkipHardGateJobAll] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://127.0.0.1:8000';

  const handleSingleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/match/candidate-to-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          job_posting_id: jobPostingId,
          cv_id: cvId || undefined,
          skip_hard_gate: skipHardGate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to match');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateToAllJobs = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fire and forget - don't wait for response
      fetch(`${API_BASE_URL}/api/v1/match/candidate-to-all-jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: candidateIdAll,
          cv_id: cvIdAll || undefined,
          skip_hard_gate: skipHardGateAll,
        }),
      }).catch(err => {
        console.error('Background matching error:', err);
      });

      // Immediately show success message
      setResult({
        candidate_id: candidateIdAll,
        total_jobs: 0,
        passed_count: 0,
        failed_count: 0,
        matches: [],
        message: `✅ Matching started! Processing candidate ${candidateIdAll} against all jobs in the background. You can continue with other tasks.`
      } as any);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJobToAllCandidates = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Fire and forget - don't wait for response
      fetch(`${API_BASE_URL}/api/v1/match/job-to-all-candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_posting_id: jobPostingIdAll,
          skip_hard_gate: skipHardGateJobAll,
        }),
      }).catch(err => {
        console.error('Background matching error:', err);
      });

      // Immediately show success message
      setResult({
        job_posting_id: jobPostingIdAll,
        total_candidates: 0,
        passed_count: 0,
        failed_count: 0,
        matches: [],
        message: `✅ Matching started! Processing job ${jobPostingIdAll} against all candidates in the background. You can continue with other tasks.`
      } as any);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Matching Operations</h1>
        <p className={styles.subtitle}>
          Match candidates to jobs with hard gate validation
        </p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'single' ? styles.active : ''}`}
          onClick={() => setActiveTab('single')}
        >
          Single Match
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'candidate-all' ? styles.active : ''}`}
          onClick={() => setActiveTab('candidate-all')}
        >
          Candidate → All Jobs
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'job-all' ? styles.active : ''}`}
          onClick={() => setActiveTab('job-all')}
        >
          Job → All Candidates
        </button>
      </div>

      {/* Single Match Form */}
      {activeTab === 'single' && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSingleMatch} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Candidate ID *</label>
              <input
                type="text"
                className={styles.input}
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                placeholder="550e8400-e29b-41d4-a716-446655440000"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Job Posting ID *</label>
              <input
                type="text"
                className={styles.input}
                value={jobPostingId}
                onChange={(e) => setJobPostingId(e.target.value)}
                placeholder="660e8400-e29b-41d4-a716-446655440000"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>CV ID (Optional)</label>
              <input
                type="text"
                className={styles.input}
                value={cvId}
                onChange={(e) => setCvId(e.target.value)}
                placeholder="770e8400-e29b-41d4-a716-446655440000"
              />
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={skipHardGate}
                  onChange={(e) => setSkipHardGate(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Skip Hard Gate (Auto-pass validation)</span>
              </label>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Matching...' : 'Match Candidate to Job'}
            </button>
          </form>
        </div>
      )}

      {/* Candidate to All Jobs Form */}
      {activeTab === 'candidate-all' && (
        <div className={styles.formContainer}>
          <form onSubmit={handleCandidateToAllJobs} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Candidate ID *</label>
              <input
                type="text"
                className={styles.input}
                value={candidateIdAll}
                onChange={(e) => setCandidateIdAll(e.target.value)}
                placeholder="550e8400-e29b-41d4-a716-446655440000"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>CV ID (Optional)</label>
              <input
                type="text"
                className={styles.input}
                value={cvIdAll}
                onChange={(e) => setCvIdAll(e.target.value)}
                placeholder="770e8400-e29b-41d4-a716-446655440000"
              />
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={skipHardGateAll}
                  onChange={(e) => setSkipHardGateAll(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Skip Hard Gate (Auto-pass validation)</span>
              </label>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Matching...' : 'Match to All Published Jobs'}
            </button>
          </form>
        </div>
      )}

      {/* Job to All Candidates Form */}
      {activeTab === 'job-all' && (
        <div className={styles.formContainer}>
          <form onSubmit={handleJobToAllCandidates} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Job Posting ID *</label>
              <input
                type="text"
                className={styles.input}
                value={jobPostingIdAll}
                onChange={(e) => setJobPostingIdAll(e.target.value)}
                placeholder="660e8400-e29b-41d4-a716-446655440000"
                required
              />
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={skipHardGateJobAll}
                  onChange={(e) => setSkipHardGateJobAll(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>Skip Hard Gate (Auto-pass validation)</span>
              </label>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Matching...' : 'Match to All Candidates'}
            </button>
          </form>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={styles.errorBox}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className={styles.resultBox}>
          {/* Background processing message */}
          {result.message && (
            <div className={styles.successMessage}>
              <h3 className={styles.resultTitle}>🚀 Processing Started</h3>
              <p>{result.message}</p>
            </div>
          )}

          {/* Single match result */}
          {!result.message && result.match_id && (
            <h3 className={styles.resultTitle}>
              {result.passed_hard_gate 
                ? (result.is_new ? '✅ New Match Created' : '🔄 Match Updated') 
                : '❌ Match Failed (Hard Gate)'}
            </h3>
          )}

          {result.match_id && (
            <div className={styles.resultDetails}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Match ID:</span>
                <span className={styles.resultValue}>{result.match_id}</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Candidate ID:</span>
                <span className={styles.resultValue}>{result.candidate_id}</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Job Posting ID:</span>
                <span className={styles.resultValue}>{result.job_posting_id}</span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Passed Hard Gate:</span>
                <span className={`${styles.resultValue} ${result.passed_hard_gate ? styles.success : styles.failure}`}>
                  {result.passed_hard_gate ? 'Yes' : 'No'}
                </span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Match Type:</span>
                <span className={styles.resultValue}>
                  {result.is_new ? '🆕 New Match' : '🔄 Existing Match Updated'}
                </span>
              </div>

              {result.hard_gate_reasons && result.hard_gate_reasons.length > 0 && (
                <div className={styles.reasonsBox}>
                  <h4>Failed Criteria:</h4>
                  <ul>
                    {result.hard_gate_reasons.map((reason, idx) => (
                      <li key={idx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.match_details && (
                <details className={styles.detailsBox}>
                  <summary>Match Details</summary>
                  <pre>{JSON.stringify(result.match_details, null, 2)}</pre>
                </details>
              )}
            </div>
          )}

          {/* Batch match result (when available) */}
          {(result.passed_count !== undefined || result.new_matches !== undefined) && !result.match_id && (
            <div className={styles.resultDetails}>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Passed Hard Gate:</span>
                <span className={`${styles.resultValue} ${styles.success}`}>
                  {result.passed_count ?? 0}
                </span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Failed Hard Gate:</span>
                <span className={`${styles.resultValue} ${styles.failure}`}>
                  {result.failed_count ?? 0}
                </span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>New Matches Created:</span>
                <span className={`${styles.resultValue}`}>
                  🆕 {result.new_matches ?? 0}
                </span>
              </div>
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Existing Matches Updated:</span>
                <span className={`${styles.resultValue}`}>
                  🔄 {result.updated_matches ?? 0}
                </span>
              </div>

              {result.matches && result.matches.length > 0 && (
                <details className={styles.detailsBox}>
                  <summary>All Results ({result.matches.length})</summary>
                  <div className={styles.batchResults}>
                    {result.matches.map((r: any, idx: number) => (
                      <div key={idx} className={styles.batchResultItem}>
                        <div className={styles.batchResultHeader}>
                          <span className={r.passed_hard_gate ? styles.success : styles.failure}>
                            {r.passed_hard_gate ? '✅' : '❌'}
                          </span>
                          <span className={r.is_new === false ? styles.updated : ''}>
                            {r.is_new === false ? '🔄 ' : '🆕 '}
                            {activeTab === 'candidate-all' 
                              ? `Job: ${r.job_posting_id?.slice(0, 8)}...`
                              : `Candidate: ${r.candidate_id?.slice(0, 8)}...`
                            }
                          </span>
                        </div>
                        {r.hard_gate_reasons?.length > 0 && (
                          <div className={styles.batchReasons}>
                            {r.hard_gate_reasons.map((reason: string, i: number) => (
                              <div key={i} className={styles.reasonItem}>{reason}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className={styles.infoBox}>
        <h3>Hard Gate Criteria</h3>
        <p>All criteria must pass for a successful match:</p>
        <ul>
          <li><strong>Salary:</strong> Candidate's expectation must overlap with job's offer</li>
          <li><strong>Experience Years:</strong> Candidate's years must overlap with job's requirements</li>
          <li><strong>Work Type:</strong> Job's work type must be in candidate's accepted types</li>
          <li><strong>Categories:</strong> At least one category must match</li>
          <li><strong>Work Auth:</strong> Candidate's work authorization must match job's requirements</li>
          <li><strong>Location:</strong> Candidate's preferred location must match job's countries</li>
        </ul>
        <p className={styles.infoNote}>
          <strong>Note:</strong> Check "Skip Hard Gate" to bypass validation and auto-pass all criteria.
        </p>
      </div>
    </div>
  );
}

