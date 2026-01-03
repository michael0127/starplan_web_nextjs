'use client';

import { useState } from 'react';
import AdminPageContainer from '@/components/admin/AdminPageContainer';
import styles from './page.module.css';

interface UploadResult {
  filename: string;
  success: boolean;
  data?: any;
  error?: string;
  user_id?: string;
}

interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: UploadResult[];
  message?: string;
}

export default function BatchUpload() {
  const [uploadType, setUploadType] = useState<'cv' | 'jd'>('cv');
  const [files, setFiles] = useState<FileList | null>(null);
  const [autoInvite, setAutoInvite] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
    setResult(null);
    setError('');
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      
      // Check if it's a single ZIP file
      const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip');
      
      if (isZip) {
        formData.append('file', files[0]);
      } else {
        Array.from(files).forEach(file => {
          formData.append('files', file);
        });
      }

      const endpoint = uploadType === 'cv' 
        ? (isZip ? '/api/admin/batch-cv-zip' : '/api/admin/batch-cv')
        : (isZip ? '/api/admin/batch-jd-zip' : '/api/admin/batch-jd');

      const url = uploadType === 'cv' && autoInvite 
        ? `${endpoint}?auto_invite=true` 
        : endpoint;

      // Fire and forget - don't wait for response
      fetch(url, {
        method: 'POST',
        body: formData,
      }).catch(err => {
        console.error('Background upload error:', err);
      });

      // Immediately show success message
      const fileCount = isZip ? 'ZIP archive' : `${files.length} file(s)`;
      setResult({
        total: files.length,
        successful: 0,
        failed: 0,
        results: [{
          filename: isZip ? files[0].name : `${files.length} files`,
          success: true,
          data: undefined,
          error: undefined,
        }],
        message: `Upload started! Processing ${fileCount} in the background. You can continue with other tasks.`
      });
      
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

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
                  onChange={(e) => setUploadType(e.target.value as 'cv')}
                  disabled={uploading}
                />
                <span>CV / Resume (Structured Extraction)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  value="jd"
                  checked={uploadType === 'jd'}
                  onChange={(e) => setUploadType(e.target.value as 'jd')}
                  disabled={uploading}
                />
                <span>Job Description (Comprehensive Analysis)</span>
              </label>
            </div>
          </div>

          {/* Auto Invite Option (only for CV) */}
          {uploadType === 'cv' && (
            <div className={styles.section}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={autoInvite}
                  onChange={(e) => setAutoInvite(e.target.checked)}
                  disabled={uploading}
                />
                <span>Auto-invite users via email (send Supabase invitation)</span>
              </label>
            </div>
          )}

          {/* File Upload */}
          <div className={styles.section}>
            <label className={styles.label}>
              Select Files
              <span className={styles.hint}>
                (PDF files or a single ZIP archive)
              </span>
            </label>
            <input
              type="file"
              accept=".pdf,.zip"
              multiple
              onChange={handleFileChange}
              disabled={uploading}
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
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={uploading || !files}
            className={styles.uploadBtn}
          >
            {uploading ? 'Uploading...' : 'Upload & Process'}
          </button>
        </div>

        {/* Results Display */}
        {result && (
          <div className={styles.resultsCard}>
            <h2 className={styles.cardTitle}>✓ Upload Submitted</h2>
            
            {result.message && (
              <div className={styles.successMessage}>
                {result.message}
              </div>
            )}

            <div className={styles.infoBox}>
              <h3>What happens next?</h3>
              <ul>
                <li>Files are being processed in the background</li>
                {uploadType === 'cv' && autoInvite && (
                  <li>Invitation emails will be sent automatically to extracted email addresses</li>
                )}
                <li>Processing time depends on the number of files</li>
                <li>You can check the database or Supabase dashboard for results</li>
                <li>Feel free to continue with other tasks</li>
              </ul>
            </div>

            <div className={styles.uploadInfo}>
              <div className={styles.infoItem}>
                <strong>Upload Type:</strong> {uploadType === 'cv' ? 'CV / Resume' : 'Job Description'}
              </div>
              <div className={styles.infoItem}>
                <strong>Files:</strong> {result.results[0].filename}
              </div>
              {uploadType === 'cv' && (
                <div className={styles.infoItem}>
                  <strong>Auto-invite:</strong> {autoInvite ? 'Enabled ✓' : 'Disabled'}
                </div>
              )}
            </div>
          </div>
        )}
    </AdminPageContainer>
  );
}

