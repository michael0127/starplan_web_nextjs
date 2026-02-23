'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
import SearchableSelect, { SelectOption } from '@/components/admin/SearchableSelect';
import styles from './page.module.css';

type Phase = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface TaskResult {
  task_id: string;
  status: string;
  result?: {
    success?: boolean;
    filename?: string;
    error?: string;
    data?: unknown;
    user_id?: string;
    job_posting_id?: string;
  };
  error?: string;
  progress?: Record<string, unknown>;
}

interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
  results: TaskResult[];
}

export default function BatchUpload() {
  const [uploadType, setUploadType] = useState<'cv' | 'jd'>('cv');
  const [files, setFiles] = useState<FileList | null>(null);
  const [autoInvite, setAutoInvite] = useState(false);
  const [saveToDb, setSaveToDb] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const [employers, setEmployers] = useState<SelectOption[]>([]);
  const [selectedEmployer, setSelectedEmployer] = useState<SelectOption | null>(null);
  const [loadingEmployers, setLoadingEmployers] = useState(false);

  // Progress tracking
  const [batchTaskId, setBatchTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0, completed: 0, failed: 0, percentage: 0, results: [],
  });
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const getToken = () => localStorage.getItem('adminToken') || '';

  const fetchEmployers = useCallback(async (search: string = '') => {
    setLoadingEmployers(true);
    try {
      const response = await fetch(
        `/api/admin/employers?search=${encodeURIComponent(search)}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const data = await response.json();
      if (data.employers) setEmployers(data.employers);
    } catch (err) {
      console.error('Failed to fetch employers:', err);
    } finally {
      setLoadingEmployers(false);
    }
  }, []);

  useEffect(() => {
    if (saveToDb && employers.length === 0) fetchEmployers();
  }, [saveToDb, employers.length, fetchEmployers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    if (phase === 'complete' || phase === 'error') resetState();
  };

  const resetState = () => {
    setPhase('idle');
    setErrorMsg('');
    setBatchTaskId(null);
    setProgress({ total: 0, completed: 0, failed: 0, percentage: 0, results: [] });
    stopPolling();
  };

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollBatchStatus = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}?batch=true`);
      if (!res.ok) return;
      const data = await res.json();

      if (!data.success) return;

      const total = data.total ?? 0;
      const completed = data.completed ?? 0;
      const failed = data.failed ?? 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      setProgress({
        total,
        completed,
        failed,
        percentage,
        results: data.results ?? [],
      });

      if (data.ready) {
        stopPolling();
        setPhase(failed > 0 ? 'complete' : 'complete');
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, [stopPolling]);

  const startPolling = useCallback((taskId: string) => {
    setBatchTaskId(taskId);
    setPhase('processing');
    pollBatchStatus(taskId);
    pollRef.current = setInterval(() => pollBatchStatus(taskId), 2500);
  }, [pollBatchStatus]);

  useEffect(() => {
    return () => {
      stopPolling();
      abortRef.current?.abort();
    };
  }, [stopPolling]);

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setErrorMsg('Please select files to upload');
      return;
    }
    if (uploadType === 'jd' && saveToDb && !selectedEmployer) {
      setErrorMsg('Please select an employer for saving JD to database');
      return;
    }

    setPhase('uploading');
    setErrorMsg('');
    setProgress({ total: 0, completed: 0, failed: 0, percentage: 0, results: [] });

    try {
      const formData = new FormData();
      const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip');

      if (isZip) {
        formData.append('file', files[0]);
      } else {
        Array.from(files).forEach(file => formData.append('files', file));
      }

      const endpoint = uploadType === 'cv'
        ? (isZip ? '/api/admin/batch-cv-zip' : '/api/admin/batch-cv')
        : (isZip ? '/api/admin/batch-jd-zip' : '/api/admin/batch-jd');

      let url = endpoint;
      if (uploadType === 'cv' && autoInvite) {
        url = `${endpoint}?auto_invite=true`;
      } else if (uploadType === 'jd' && saveToDb && selectedEmployer) {
        url = `${endpoint}?save_to_db=true&user_id=${selectedEmployer.id}`;
      }

      abortRef.current = new AbortController();
      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(prev => ({ ...prev, total: data.totalFiles || 0 }));
      startPolling(data.batchTaskId);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleCancel = async () => {
    abortRef.current?.abort();
    stopPolling();
    setPhase('idle');
  };

  const handleNewUpload = () => {
    setFiles(null);
    resetState();
    const fileInput = document.querySelector(`.${styles.fileInput}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const getPhaseIndex = (): number => {
    switch (phase) {
      case 'uploading': return 0;
      case 'processing': return 1;
      case 'complete': return 2;
      case 'error': return -1;
      default: return -1;
    }
  };

  const phaseClass = (stepIndex: number) => {
    const current = getPhaseIndex();
    if (phase === 'error' && stepIndex <= 1) return styles.failedPhase;
    if (stepIndex < current) return styles.completedPhase;
    if (stepIndex === current) return styles.activePhase;
    return '';
  };

  const getStatusLabel = (status: string, result?: TaskResult['result']) => {
    if (result?.success === true) return 'Success';
    if (result?.success === false) return 'Failed';
    switch (status) {
      case 'SUCCESS': return 'Success';
      case 'FAILURE': return 'Failed';
      case 'EXTRACTING': return 'Extracting';
      case 'ANALYZING': return 'Analyzing';
      case 'STARTED': return 'Running';
      case 'PENDING': return 'Queued';
      default: return status;
    }
  };

  const getStatusClass = (status: string, result?: TaskResult['result']) => {
    if (result?.success === true) return styles.success;
    if (result?.success === false) return styles.failure;
    if (status === 'SUCCESS') return styles.success;
    if (status === 'FAILURE') return styles.failure;
    if (['EXTRACTING', 'ANALYZING', 'STARTED', 'PROGRESS'].includes(status)) return styles.running;
    return styles.pending;
  };

  const isUploading = phase === 'uploading';
  const isProcessing = phase === 'processing';
  const isComplete = phase === 'complete';
  const isError = phase === 'error';
  const isBusy = isUploading || isProcessing;

  return (
    <AdminPageContainer
      title="Batch Upload"
      description="Upload and process multiple CV or Job Description files at once"
    >
      <div className={styles.uploadCard}>
        <h2 className={styles.cardTitle}>Batch Upload Files</h2>

        {/* Upload Type Selection */}
        <div className={styles.section}>
          <label className={styles.label}>Upload Type</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="cv"
                checked={uploadType === 'cv'}
                onChange={(e) => {
                  setUploadType(e.target.value as 'cv');
                  setSelectedEmployer(null);
                }}
                disabled={isBusy}
              />
              <span>CV / Resume (Structured Extraction)</span>
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                value="jd"
                checked={uploadType === 'jd'}
                onChange={(e) => setUploadType(e.target.value as 'jd')}
                disabled={isBusy}
              />
              <span>Job Description (Comprehensive Analysis)</span>
            </label>
          </div>
        </div>

        {/* CV Options */}
        {uploadType === 'cv' && (
          <div className={styles.section}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={autoInvite}
                onChange={(e) => setAutoInvite(e.target.checked)}
                disabled={isBusy}
              />
              <span>Send invitation email immediately</span>
            </label>
            <div className={styles.hint} style={{ marginTop: '8px', marginLeft: '24px' }}>
              {autoInvite
                ? <>&#10003; Users will be created and invitation emails will be sent</>
                : <>&#10003; Users will be created in Supabase but no email will be sent (you can invite them manually later)</>
              }
            </div>
          </div>
        )}

        {/* JD Options */}
        {uploadType === 'jd' && (
          <>
            <div className={styles.section}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={saveToDb}
                  onChange={(e) => setSaveToDb(e.target.checked)}
                  disabled={isBusy}
                />
                <span>Save extracted data to database</span>
              </label>
              <div className={styles.hint} style={{ marginTop: '8px', marginLeft: '24px' }}>
                {saveToDb
                  ? <>&#10003; Job descriptions will be extracted and saved to the database</>
                  : <>&#10003; Job descriptions will be extracted only (no database save)</>
                }
              </div>
            </div>
            {saveToDb && (
              <div className={styles.section}>
                <SearchableSelect
                  label="Employer (Owner of Job Postings)"
                  placeholder="Search by company or email..."
                  options={employers}
                  value={selectedEmployer}
                  onChange={setSelectedEmployer}
                  onSearch={fetchEmployers}
                  loading={loadingEmployers}
                  required
                  hint="Select which employer account will own these job postings"
                />
              </div>
            )}
          </>
        )}

        {/* File Upload */}
        <div className={styles.section}>
          <label className={styles.label}>
            Select Files
            <span className={styles.hint}>(PDF files or a single ZIP archive)</span>
          </label>
          <input
            type="file"
            accept=".pdf,.zip"
            multiple
            onChange={handleFileChange}
            disabled={isBusy}
            className={styles.fileInput}
          />
          {files && (
            <div className={styles.fileInfo}>
              {files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')
                ? `ZIP archive: ${files[0].name}`
                : `${files.length} file(s) selected`
              }
            </div>
          )}
        </div>

        {/* Error Display */}
        {isError && errorMsg && (
          <div className={styles.error}>{errorMsg}</div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={isBusy || !files || (uploadType === 'jd' && saveToDb && !selectedEmployer)}
          className={styles.uploadBtn}
        >
          {isUploading ? 'Uploading...' : isProcessing ? 'Processing...' : 'Upload & Process'}
        </button>
      </div>

      {/* Progress Tracker */}
      {(isBusy || isComplete) && (
        <div className={styles.progressCard}>
          <div className={styles.progressHeader}>
            <h2 className={styles.progressTitle}>
              {isUploading && 'Uploading files...'}
              {isProcessing && 'Processing files...'}
              {isComplete && progress.failed === 0 && 'All files processed'}
              {isComplete && progress.failed > 0 && 'Processing complete (with errors)'}
            </h2>
            {isBusy && (
              <button onClick={handleCancel} className={styles.cancelBtn}>
                Cancel
              </button>
            )}
          </div>

          {/* Phase Steps */}
          <div className={styles.phaseSteps}>
            <div className={`${styles.phaseStep} ${phaseClass(0)}`}>
              <div className={styles.phaseIcon}>
                {getPhaseIndex() > 0 ? '✓' : '1'}
              </div>
              <span className={styles.phaseLabel}>Upload</span>
            </div>
            <div className={`${styles.phaseStep} ${phaseClass(1)}`}>
              <div className={styles.phaseIcon}>
                {getPhaseIndex() > 1 ? '✓' : '2'}
              </div>
              <span className={styles.phaseLabel}>
                {uploadType === 'cv' ? 'Extract' : 'Analyze'}
              </span>
            </div>
            <div className={`${styles.phaseStep} ${phaseClass(2)}`}>
              <div className={styles.phaseIcon}>
                {isComplete ? '✓' : '3'}
              </div>
              <span className={styles.phaseLabel}>Done</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressBarWrapper}>
            <div className={styles.progressStats}>
              <span className={styles.progressPercent}>
                {isUploading ? '—' : `${progress.percentage}%`}
              </span>
              <span className={styles.progressCount}>
                {isUploading
                  ? 'Sending files to server...'
                  : `${progress.completed} / ${progress.total} files`
                }
              </span>
            </div>
            <div className={styles.progressBarTrack}>
              {isUploading ? (
                <div className={styles.progressBarIndeterminate} />
              ) : (
                <div
                  className={`${styles.progressBarFill} ${
                    isComplete && progress.failed === 0 ? styles.complete : ''
                  } ${isComplete && progress.failed > 0 ? styles.hasErrors : ''}`}
                  style={{ width: `${progress.percentage}%` }}
                />
              )}
            </div>
          </div>

          {/* Status Message */}
          {isProcessing && (
            <div className={`${styles.statusMessage} ${styles.processing}`}>
              <span className={styles.spinner} />
              {progress.completed === 0
                ? `Waiting for tasks to start... (${progress.total} files queued)`
                : `Processing: ${progress.completed} of ${progress.total} files completed`
              }
            </div>
          )}
          {isComplete && progress.failed === 0 && (
            <div className={`${styles.statusMessage} ${styles.complete}`}>
              <span className={styles.statusIcon}>&#10003;</span>
              All {progress.total} files processed successfully!
            </div>
          )}
          {isComplete && progress.failed > 0 && (
            <div className={`${styles.statusMessage} ${styles.error}`}>
              <span className={styles.statusIcon}>&#9888;</span>
              {progress.completed - progress.failed} succeeded, {progress.failed} failed out of {progress.total} files
            </div>
          )}

          {/* Completion Summary */}
          {isComplete && (
            <div className={styles.completionSummary}>
              <div className={`${styles.summaryCard} ${styles.total}`}>
                <div className={styles.summaryCardValue}>{progress.total}</div>
                <div className={styles.summaryCardLabel}>Total Files</div>
              </div>
              <div className={`${styles.summaryCard} ${styles.success}`}>
                <div className={styles.summaryCardValue}>{progress.completed - progress.failed}</div>
                <div className={styles.summaryCardLabel}>Succeeded</div>
              </div>
              <div className={`${styles.summaryCard} ${styles.failed}`}>
                <div className={styles.summaryCardValue}>{progress.failed}</div>
                <div className={styles.summaryCardLabel}>Failed</div>
              </div>
            </div>
          )}

          {/* Per-file Results */}
          {progress.results.length > 0 && (isProcessing || isComplete) && (
            <div className={styles.fileResults}>
              <h3 className={styles.fileResultsTitle}>File Details</h3>
              <div className={styles.fileResultsList}>
                {progress.results.map((r, i) => {
                  const statusLabel = getStatusLabel(r.status, r.result);
                  const statusCls = getStatusClass(r.status, r.result);
                  const filename = r.result?.filename || `File ${i + 1}`;

                  return (
                    <div key={r.task_id || i} className={styles.fileResultItem}>
                      <div className={`${styles.fileStatusIcon} ${statusCls}`}>
                        {statusCls === styles.success && '✓'}
                        {statusCls === styles.failure && '✗'}
                        {statusCls === styles.running && '⟳'}
                        {statusCls === styles.pending && '·'}
                      </div>
                      <span className={styles.fileName}>{filename}</span>
                      <span className={`${styles.fileStatus} ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New Upload Button */}
          {isComplete && (
            <button onClick={handleNewUpload} className={styles.newUploadBtn}>
              Upload More Files
            </button>
          )}
        </div>
      )}
    </AdminPageContainer>
  );
}
