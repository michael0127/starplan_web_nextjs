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
  job_posting_id?: string;  // For JD uploads (JobPosting ID)
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
  const [autoInvite, setAutoInvite] = useState(false);  // For CV: send invitation email
  const [saveToDb, setSaveToDb] = useState(false);  // For JD: save to database
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

      // Build URL with appropriate query parameters
      let url = endpoint;
      if (uploadType === 'cv' && autoInvite) {
        url = `${endpoint}?auto_invite=true`;
      } else if (uploadType === 'jd' && saveToDb) {
        // For JD, we need user_id when saving to database
        // Using admin user ID: hello@starplan.ai
        const userId = 'f5c8cfd7-493a-4edb-95bb-1a737bb947bb';
        url = `${endpoint}?save_to_db=true&user_id=${userId}`;
      }

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

          {/* CV Options */}
          {uploadType === 'cv' && (
            <div className={styles.section}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={autoInvite}
                  onChange={(e) => setAutoInvite(e.target.checked)}
                  disabled={uploading}
                />
                <span>Send invitation email immediately</span>
              </label>
              <div className={styles.hint} style={{ marginTop: '8px', marginLeft: '24px' }}>
                {autoInvite ? (
                  <>✓ Users will be created and invitation emails will be sent</>
                ) : (
                  <>✓ Users will be created in Supabase but no email will be sent (you can invite them manually later)</>
                )}
              </div>
            </div>
          )}

          {/* JD Options */}
          {uploadType === 'jd' && (
            <div className={styles.section}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={saveToDb}
                  onChange={(e) => setSaveToDb(e.target.checked)}
                  disabled={uploading}
                />
                <span>Save extracted data to database</span>
              </label>
              <div className={styles.hint} style={{ marginTop: '8px', marginLeft: '24px' }}>
                {saveToDb ? (
                  <>✓ Job descriptions will be extracted and saved to the database</>
                ) : (
                  <>✓ Job descriptions will be extracted only (no database save)</>
                )}
              </div>
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
                {uploadType === 'cv' && (
                  <>
                    <li>User accounts will be created in Supabase</li>
                    {autoInvite ? (
                      <li>Invitation emails will be sent automatically to extracted email addresses</li>
                    ) : (
                      <li>No invitation emails will be sent (you can manually invite users later from Supabase dashboard)</li>
                    )}
                  </>
                )}
                {uploadType === 'jd' && (
                  <>
                    <li>Job descriptions will be analyzed and extracted</li>
                    {saveToDb ? (
                      <li>Extracted data will be saved to the database</li>
                    ) : (
                      <li>Data will be extracted only (not saved to database)</li>
                    )}
                  </>
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
              {uploadType === 'jd' && (
                <div className={styles.infoItem}>
                  <strong>Save to Database:</strong> {saveToDb ? 'Enabled ✓' : 'Disabled'}
                </div>
              )}
            </div>
          </div>
        )}
    </AdminPageContainer>
  );
}

