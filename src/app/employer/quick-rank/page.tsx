'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import EmployerNavbar from '@/components/EmployerNavbar';
import styles from './page.module.css';

type Phase = 'idle' | 'uploading' | 'extracting-cv' | 'analyzing-jd' | 'ranking' | 'complete' | 'error';

interface RankedCandidate {
  candidateId: string;
  rank: number;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

interface RankingResult {
  jobPostingId: string;
  jobTitle: string;
  rankedCandidates: RankedCandidate[];
  totalCandidates: number;
  stats: {
    totalComparisons: number;
    totalTokens: number;
    totalCost: number;
  };
}

export default function QuickRankPage() {
  usePageAnimation();
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/',
  });

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [result, setResult] = useState<RankingResult | null>(null);

  const [cvDragOver, setCvDragOver] = useState(false);
  const [jdDragOver, setJdDragOver] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isBusy = phase !== 'idle' && phase !== 'complete' && phase !== 'error';

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
      abortRef.current?.abort();
    };
  }, [stopPolling]);

  const pollBatchTask = useCallback(async (
    batchTaskId: string,
    onComplete: (results: Record<string, unknown>[]) => void,
    onError: (msg: string) => void,
    onProgress?: (completed: number, total: number) => void,
  ) => {
    let done = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/tasks/${batchTaskId}?batch=true`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;

        if (onProgress) {
          onProgress(data.completed ?? 0, data.total ?? 0);
        }

        if (data.ready) {
          done = true;
          stopPolling();
          const failedCount = data.failed ?? 0;
          if (failedCount > 0 && (data.completed - failedCount) === 0) {
            onError('All files failed to process');
            return;
          }
          onComplete(data.results ?? []);
        }
      } catch {
        // continue polling
      }
    };

    await poll();
    if (!done) {
      pollRef.current = setInterval(poll, 2500);
    }
  }, [stopPolling]);

  const pollSingleTask = useCallback(async (
    taskId: string,
    onComplete: (result: Record<string, unknown>) => void,
    onError: (msg: string) => void,
    onProgress?: (progress: Record<string, unknown>) => void,
  ) => {
    let done = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;

        const taskData = data.data;
        if (onProgress && taskData?.progress) {
          onProgress(taskData.progress);
        }

        if (taskData?.ready) {
          done = true;
          stopPolling();
          if (taskData.result?.success) {
            onComplete(taskData.result);
          } else {
            onError(taskData.result?.error || taskData.error || 'Task failed');
          }
        }
      } catch {
        // continue polling
      }
    };

    await poll();
    if (!done) {
      pollRef.current = setInterval(poll, 1500);
    }
  }, [stopPolling]);

  const handleStart = async () => {
    if (!cvFile || !jdFile) return;

    setPhase('uploading');
    setErrorMsg('');
    setProgressPercent(0);
    setProgressMessage('Uploading files...');
    setResult(null);
    abortRef.current = new AbortController();

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated. Please sign in again.');
      }
      const headers = { 'Authorization': `Bearer ${token}` };

      // Step 1: Upload CV ZIP
      const cvFormData = new FormData();
      cvFormData.append('file', cvFile);

      let cvRes: Response;
      try {
        cvRes = await fetch('/api/employer/quick-rank/upload-cv', {
          method: 'POST',
          headers,
          body: cvFormData,
          signal: abortRef.current.signal,
        });
      } catch (fetchErr) {
        throw new Error(`CV upload network error: ${(fetchErr as Error).message}. The file may be too large or the server may need a restart.`);
      }

      let cvData;
      try {
        cvData = await cvRes.json();
      } catch {
        throw new Error(`CV upload failed with status ${cvRes.status}`);
      }
      if (!cvRes.ok || !cvData.success) {
        throw new Error(cvData.error || 'CV upload failed');
      }

      // Step 2: Upload JD
      const jdFormData = new FormData();
      jdFormData.append('file', jdFile);

      let jdRes: Response;
      try {
        jdRes = await fetch('/api/employer/quick-rank/upload-jd', {
          method: 'POST',
          headers,
          body: jdFormData,
          signal: abortRef.current.signal,
        });
      } catch (fetchErr) {
        throw new Error(`JD upload network error: ${(fetchErr as Error).message}`);
      }

      let jdData;
      try {
        jdData = await jdRes.json();
      } catch {
        throw new Error(`JD upload failed with status ${jdRes.status}`);
      }
      if (!jdRes.ok || !jdData.success) {
        throw new Error(jdData.error || 'JD upload failed');
      }

      setPhase('extracting-cv');
      setProgressPercent(10);
      setProgressMessage(`Extracting CVs (0/${cvData.totalFiles} files)...`);

      // Step 3: Poll CV extraction
      const cvResults = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
        pollBatchTask(
          cvData.batchTaskId,
          resolve,
          reject as (msg: string) => void,
          (completed, total) => {
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            setProgressPercent(10 + Math.round(pct * 0.3));
            setProgressMessage(`Extracting CVs (${completed}/${total} files)...`);
          },
        );
      });

      const successfulCvResults = cvResults.filter(
        (r: Record<string, unknown>) => (r.result as Record<string, unknown>)?.success
      );
      const cvCount = successfulCvResults.length;

      const candidateIds = successfulCvResults
        .map((r: Record<string, unknown>) => (r.result as Record<string, unknown>)?.user_id as string)
        .filter(Boolean);

      setPhase('analyzing-jd');
      setProgressPercent(45);
      setProgressMessage('Analyzing job description...');

      // Step 4: Poll JD analysis
      const jdResults = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
        pollBatchTask(
          jdData.batchTaskId,
          resolve,
          reject as (msg: string) => void,
        );
      });

      const jdResult = jdResults[0] as Record<string, unknown>;
      const jdInner = jdResult?.result as Record<string, unknown> | undefined;
      const jobPostingId = jdInner?.job_posting_id as string | undefined;

      if (!jobPostingId) {
        throw new Error('Failed to create job posting from JD');
      }

      setPhase('ranking');
      setProgressPercent(55);
      setProgressMessage(`Ranking ${cvCount} candidates...`);

      // Step 5: Start ranking (pass candidateIds to scope ranking to uploaded CVs only)
      const rankBody: Record<string, unknown> = { sync: false, skipHardGate: true };
      if (candidateIds.length > 0) {
        rankBody.candidateIds = candidateIds;
      }
      const rankRes = await fetch(`/api/ranking/job/${jobPostingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rankBody),
        signal: abortRef.current.signal,
      });

      const rankData = await rankRes.json();
      if (!rankRes.ok || !rankData.success) {
        throw new Error(rankData.error || 'Failed to start ranking');
      }

      // Step 6: Poll ranking
      const rankingResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
        pollSingleTask(
          rankData.taskId,
          resolve,
          reject as (msg: string) => void,
          (progress) => {
            const status = progress.status as string;
            if (status === 'starting') {
              setProgressMessage('Preparing candidates for ranking...');
              return;
            }
            const pct = (progress.progress_percent as number) || 0;
            setProgressPercent(55 + Math.round(pct * 0.45));
            const msg = progress.message as string;
            if (msg) {
              setProgressMessage(msg);
            }
          },
        );
      });

      // Done!
      setPhase('complete');
      setProgressPercent(100);
      setProgressMessage('Ranking complete!');
      setResult({
        jobPostingId,
        jobTitle: (rankingResult.job_title as string) || 'Untitled Job',
        rankedCandidates: ((rankingResult.ranked_candidates as Record<string, unknown>[]) || []).map(
          (c) => ({
            candidateId: (c.candidate_id as string) || (c.candidateId as string) || '',
            rank: (c.rank as number) || 0,
            name: (c.name as string) || null,
            email: (c.email as string) || null,
            avatarUrl: (c.avatar_url as string) || (c.avatarUrl as string) || null,
          })
        ),
        totalCandidates: (rankingResult.total_candidates as number) || 0,
        stats: {
          totalComparisons: (rankingResult.total_comparisons as number) || 0,
          totalTokens: (rankingResult.total_tokens as number) || 0,
          totalCost: (rankingResult.total_cost as number) || 0,
        },
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      stopPolling();
      setPhase('error');
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    }
  };

  const handleReset = () => {
    setCvFile(null);
    setJdFile(null);
    setPhase('idle');
    setErrorMsg('');
    setProgressPercent(0);
    setProgressMessage('');
    setResult(null);
    stopPolling();
    abortRef.current?.abort();
    if (cvInputRef.current) cvInputRef.current.value = '';
    if (jdInputRef.current) jdInputRef.current.value = '';
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    stopPolling();
    setPhase('idle');
    setProgressPercent(0);
    setProgressMessage('');
  };

  const handleDrop = (e: React.DragEvent, type: 'cv' | 'jd') => {
    e.preventDefault();
    if (type === 'cv') setCvDragOver(false);
    else setJdDragOver(false);
    if (isBusy) return;

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (type === 'cv') {
      if (!file.name.toLowerCase().endsWith('.zip')) return;
      setCvFile(file);
    } else {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.pdf') && !name.endsWith('.docx')) return;
      setJdFile(file);
    }
  };

  const getPhaseStep = (): number => {
    switch (phase) {
      case 'uploading': return 0;
      case 'extracting-cv': return 1;
      case 'analyzing-jd': return 2;
      case 'ranking': return 3;
      case 'complete': return 4;
      default: return -1;
    }
  };

  const phaseStepClass = (stepIndex: number) => {
    const current = getPhaseStep();
    if (phase === 'error') return stepIndex <= current ? styles.phaseStepFailed : '';
    if (stepIndex < current) return styles.phaseStepCompleted;
    if (stepIndex === current) return styles.phaseStepActive;
    return '';
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return styles.rankBadgeGold;
    if (rank === 2) return styles.rankBadgeSilver;
    if (rank === 3) return styles.rankBadgeBronze;
    return '';
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

        <main className={styles.main}>
          <div className={styles.pageHeader}>
            <h1 className={styles.title}>Quick Rank</h1>
            <p className={styles.subtitle}>
              Upload a CV zip and a job description file to instantly rank candidates with AI
            </p>
          </div>

          {/* Upload Section */}
          {(phase === 'idle' || phase === 'error') && (
            <div className={styles.uploadCard}>
              <div className={styles.uploadGrid}>
                {/* CV Upload Zone */}
                <div
                  className={`${styles.dropZone} ${cvDragOver ? styles.dropZoneDragOver : ''} ${cvFile ? styles.dropZoneHasFile : ''} ${isBusy ? styles.dropZoneDisabled : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setCvDragOver(true); }}
                  onDragLeave={() => setCvDragOver(false)}
                  onDrop={(e) => handleDrop(e, 'cv')}
                  onClick={() => !isBusy && cvInputRef.current?.click()}
                >
                  <div className={styles.dropZoneIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className={styles.dropZoneTitle}>CV ZIP File</div>
                  <div className={styles.dropZoneDesc}>ZIP archive containing PDF/DOCX resumes</div>
                  <div className={styles.dropZoneBrowse}>Browse Files</div>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".zip"
                    className={styles.fileInput}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setCvFile(f);
                    }}
                  />
                  {cvFile && (
                    <div className={styles.dropZoneFileName}>
                      <span className={styles.fileIcon}>&#10003;</span>
                      {cvFile.name}
                    </div>
                  )}
                </div>

                {/* JD Upload Zone */}
                <div
                  className={`${styles.dropZone} ${jdDragOver ? styles.dropZoneDragOver : ''} ${jdFile ? styles.dropZoneHasFile : ''} ${isBusy ? styles.dropZoneDisabled : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setJdDragOver(true); }}
                  onDragLeave={() => setJdDragOver(false)}
                  onDrop={(e) => handleDrop(e, 'jd')}
                  onClick={() => !isBusy && jdInputRef.current?.click()}
                >
                  <div className={styles.dropZoneIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className={styles.dropZoneTitle}>Job Description</div>
                  <div className={styles.dropZoneDesc}>Single PDF or DOCX file</div>
                  <div className={styles.dropZoneBrowse}>Browse Files</div>
                  <input
                    ref={jdInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    className={styles.fileInput}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setJdFile(f);
                    }}
                  />
                  {jdFile && (
                    <div className={styles.dropZoneFileName}>
                      <span className={styles.fileIcon}>&#10003;</span>
                      {jdFile.name}
                    </div>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className={styles.errorBox}>
                  <span>&#9888;</span>
                  {errorMsg}
                </div>
              )}

              <button
                className={styles.startButton}
                disabled={!cvFile || !jdFile || isBusy}
                onClick={handleStart}
              >
                Start Quick Rank
              </button>
            </div>
          )}

          {/* Progress Section */}
          {(isBusy || phase === 'complete') && (
            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <h2 className={styles.progressTitle}>
                  {phase === 'complete' ? 'Ranking Complete' : 'Processing...'}
                </h2>
                {isBusy && (
                  <button onClick={handleCancel} className={styles.cancelBtn}>
                    Cancel
                  </button>
                )}
              </div>

              {/* Phase Steps */}
              <div className={styles.phaseSteps}>
                {['Upload', 'Extract CVs', 'Analyze JD', 'AI Ranking'].map((label, i) => (
                  <div key={label} className={`${styles.phaseStep} ${phaseStepClass(i)}`}>
                    <div className={styles.phaseIcon}>
                      {getPhaseStep() > i || phase === 'complete' ? '✓' : i + 1}
                    </div>
                    <span className={styles.phaseLabel}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className={styles.progressBarWrapper}>
                <div className={styles.progressStats}>
                  <span className={styles.progressPercent}>
                    {phase === 'uploading' ? '—' : `${progressPercent}%`}
                  </span>
                  <span className={styles.progressMessage}>{progressMessage}</span>
                </div>
                <div className={styles.progressBarTrack}>
                  {phase === 'uploading' ? (
                    <div className={styles.progressBarIndeterminate} />
                  ) : (
                    <div
                      className={`${styles.progressBarFill} ${phase === 'complete' ? styles.complete : ''}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Status Message */}
              {isBusy && (
                <div className={`${styles.statusMessage} ${styles.statusProcessing}`}>
                  <span className={styles.spinner} />
                  {progressMessage}
                </div>
              )}
              {phase === 'complete' && (
                <div className={`${styles.statusMessage} ${styles.statusComplete}`}>
                  <span>&#10003;</span>
                  All candidates have been ranked successfully!
                </div>
              )}
            </div>
          )}

          {/* Results Section */}
          {phase === 'complete' && result && (
            <div className={styles.resultsCard}>
              <div className={styles.resultsHeader}>
                <h2 className={styles.resultsTitle}>Ranking Results</h2>
                <span className={styles.jobTitleBadge}>{result.jobTitle}</span>
              </div>

              {/* Stats */}
              <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.statCardTotal}`}>
                  <div className={styles.statCardValue}>{result.totalCandidates}</div>
                  <div className={styles.statCardLabel}>Candidates Ranked</div>
                </div>
                <div className={`${styles.statCard} ${styles.statCardComparisons}`}>
                  <div className={styles.statCardValue}>{result.stats.totalComparisons}</div>
                  <div className={styles.statCardLabel}>AI Comparisons</div>
                </div>
                <div className={`${styles.statCard} ${styles.statCardCost}`}>
                  <div className={styles.statCardValue}>
                    ${result.stats.totalCost.toFixed(4)}
                  </div>
                  <div className={styles.statCardLabel}>Processing Cost</div>
                </div>
              </div>

              {/* Ranking List */}
              <div className={styles.rankingList}>
                <div className={styles.rankingListHeader}>
                  <span>Rank</span>
                  <span>Name</span>
                  <span>Email</span>
                </div>
                {result.rankedCandidates.map((c) => (
                  <div key={c.candidateId} className={styles.rankingItem}>
                    <div className={`${styles.rankBadge} ${getRankBadgeClass(c.rank)}`}>
                      {c.rank}
                    </div>
                    <div className={styles.candidateName}>
                      {c.name || 'Unknown'}
                    </div>
                    <div className={styles.candidateEmail}>
                      {c.email || '—'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className={styles.actionsRow}>
                <Link
                  href={`/employer/candidates?job=${result.jobPostingId}&tab=ranked`}
                  className={styles.viewCandidatesBtn}
                >
                  View in Candidates Page
                </Link>
                <button onClick={handleReset} className={styles.newRankBtn}>
                  Start New Rank
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
