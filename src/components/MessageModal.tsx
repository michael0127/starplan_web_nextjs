'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './MessageModal.module.css';

interface Candidate {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
}

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  companyName?: string;
  onMessageSent?: (result: { success: boolean; count: number }) => void;
}

export function MessageModal({
  isOpen,
  onClose,
  candidates,
  companyName,
  onMessageSent,
}: MessageModalProps) {
  const [subject, setSubject] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    totalSent: number;
    totalFailed: number;
  } | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSubject('');
      setCcEmails('');
      setError(null);
      setResult(null);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!editorRef.current || candidates.length === 0) return;

    const htmlContent = editorRef.current.innerHTML;
    
    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!htmlContent.trim() || htmlContent === '<br>') {
      setError('Please enter a message');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please log in again.');
        return;
      }

      // Parse CC emails
      const ccEmailList = ccEmails
        .split(/[,;\s]+/)
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientIds: candidates.map(c => c.candidateId),
          subject: subject.trim(),
          htmlContent,
          ccEmails: ccEmailList.length > 0 ? ccEmailList : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          totalSent: data.data.totalSent,
          totalFailed: data.data.totalFailed,
        });
        onMessageSent?.({ success: true, count: data.data.totalSent });
        
        // Log any individual failures
        if (data.data.results) {
          const failedResults = data.data.results.filter((r: { success: boolean; error?: string }) => !r.success);
          if (failedResults.length > 0) {
            console.log('Some emails failed:', failedResults);
          }
        }
      } else {
        console.error('Email send error:', data);
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      setError('An error occurred while sending the message');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Rich text editor commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {result ? 'Message Sent!' : 'Send Message'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {result ? (
            // Success state
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className={styles.successText}>
                Successfully sent {result.totalSent} message{result.totalSent !== 1 ? 's' : ''}!
              </p>
              {result.totalFailed > 0 && (
                <p className={styles.failedText}>
                  {result.totalFailed} message{result.totalFailed !== 1 ? 's' : ''} failed to send.
                </p>
              )}
            </div>
          ) : (
            // Form state
            <>
              {/* Recipients */}
              <div className={styles.section}>
                <label className={styles.label}>To</label>
                <div className={styles.recipientsList}>
                  {candidates.map((candidate) => (
                    <div key={candidate.candidateId} className={styles.recipientChip}>
                      <span className={styles.recipientAvatar}>
                        {(candidate.candidateName || candidate.candidateEmail).charAt(0).toUpperCase()}
                      </span>
                      <span className={styles.recipientName}>
                        {candidate.candidateName || candidate.candidateEmail.split('@')[0]}
                      </span>
                      <span className={styles.recipientEmail}>
                        &lt;{candidate.candidateEmail}&gt;
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CC Emails */}
              <div className={styles.section}>
                <label className={styles.label}>
                  CC <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Enter CC email addresses, separated by commas"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                />
              </div>

              {/* Subject */}
              <div className={styles.section}>
                <label className={styles.label}>Subject</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Enter email subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Rich Text Editor */}
              <div className={styles.section}>
                <label className={styles.label}>Message</label>
                <div className={styles.editorContainer}>
                  {/* Toolbar */}
                  <div className={styles.toolbar}>
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => execCommand('bold')}
                      title="Bold"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => execCommand('italic')}
                      title="Italic"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="19" y1="4" x2="10" y2="4" />
                        <line x1="14" y1="20" x2="5" y2="20" />
                        <line x1="15" y1="4" x2="9" y2="20" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => execCommand('underline')}
                      title="Underline"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
                        <line x1="4" y1="21" x2="20" y2="21" />
                      </svg>
                    </button>
                    
                    <div className={styles.toolbarDivider} />
                    
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => execCommand('insertUnorderedList')}
                      title="Bullet List"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <circle cx="4" cy="6" r="1" fill="currentColor" />
                        <circle cx="4" cy="12" r="1" fill="currentColor" />
                        <circle cx="4" cy="18" r="1" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => execCommand('insertOrderedList')}
                      title="Numbered List"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="10" y1="6" x2="21" y2="6" />
                        <line x1="10" y1="12" x2="21" y2="12" />
                        <line x1="10" y1="18" x2="21" y2="18" />
                        <text x="3" y="8" fontSize="8" fill="currentColor">1</text>
                        <text x="3" y="14" fontSize="8" fill="currentColor">2</text>
                        <text x="3" y="20" fontSize="8" fill="currentColor">3</text>
                      </svg>
                    </button>
                    
                    <div className={styles.toolbarDivider} />
                    
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => {
                        const url = prompt('Enter link URL:');
                        if (url) execCommand('createLink', url);
                      }}
                      title="Insert Link"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </button>
                    
                    <div className={styles.toolbarDivider} />
                    
                    <button
                      type="button"
                      className={styles.toolbarBtn}
                      onClick={() => execCommand('removeFormat')}
                      title="Clear Formatting"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7V4h16v3" />
                        <path d="M9 20h6" />
                        <path d="M12 4v16" />
                        <path d="M3 21l18-18" stroke="#dc2626" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Editor */}
                  <div
                    ref={editorRef}
                    className={styles.editor}
                    contentEditable
                    data-placeholder="Write your message here..."
                    onFocus={(e) => {
                      if (e.currentTarget.innerHTML === '' || e.currentTarget.innerHTML === '<br>') {
                        e.currentTarget.innerHTML = '';
                      }
                    }}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className={styles.errorMessage}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          {result ? (
            <button className={styles.doneBtn} onClick={onClose}>
              Done
            </button>
          ) : (
            <>
              <button className={styles.cancelBtn} onClick={onClose} disabled={isSending}>
                Cancel
              </button>
              <button
                className={styles.sendBtn}
                onClick={handleSendMessage}
                disabled={isSending || candidates.length === 0}
              >
                {isSending ? (
                  <>
                    <span className={styles.spinner}></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send Message
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
