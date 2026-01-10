'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SYSTEM_SCREENING_QUESTIONS } from '@/lib/screeningOptions';
import styles from './InviteModal.module.css';

interface Candidate {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
}

interface JobPosting {
  id: string;
  jobTitle: string;
  companyName: string;
  systemScreeningAnswers: Array<{
    questionId: string;
    requirement: string;
    selectedAnswers: string[];
  }>;
  customScreeningQuestions: Array<{
    id: string;
    questionText: string;
    answerType: string;
    options: string[];
    mustAnswer: boolean;
    requirement: string;
  }>;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  jobPosting: JobPosting | null;
  onInviteSent?: (result: { success: boolean; count: number }) => void;
}

export function InviteModal({
  isOpen,
  onClose,
  candidates,
  jobPosting,
  onInviteSent,
}: InviteModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    invitations: Array<{
      candidateName: string | null;
      candidateEmail: string;
      inviteLink: string;
    }>;
  } | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
      setError(null);
      setResult(null);
    }
  }, [isOpen]);

  const handleSendInvitations = async () => {
    if (!jobPosting || candidates.length === 0) return;

    setIsSending(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please log in again.');
        return;
      }

      const response = await fetch(`/api/job-postings/${jobPosting.id}/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateIds: candidates.map((c) => c.candidateId),
          message: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          invitations: data.data.invitations,
        });
        onInviteSent?.({ success: true, count: data.data.totalSent });
      } else {
        setError(data.error || 'Failed to send invitations');
      }
    } catch (err) {
      setError('An error occurred while sending invitations');
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const totalQuestions = 
    (jobPosting?.systemScreeningAnswers?.length || 0) + 
    (jobPosting?.customScreeningQuestions?.length || 0);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {result ? 'Invitations Sent!' : 'Invite Candidates for Screening'}
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
                Successfully sent {result.invitations.length} invitation{result.invitations.length !== 1 ? 's' : ''}!
              </p>
              <div className={styles.invitationsList}>
                {result.invitations.map((inv, idx) => (
                  <div key={idx} className={styles.invitationItem}>
                    <div className={styles.invitationInfo}>
                      <span className={styles.invitationName}>
                        {inv.candidateName || inv.candidateEmail}
                      </span>
                      <div className={styles.inviteLinkWrapper}>
                        <input 
                          type="text" 
                          className={styles.inviteLinkInput}
                          value={inv.inviteLink}
                          readOnly
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <button
                          className={styles.copyLinkBtn}
                          onClick={() => {
                            navigator.clipboard.writeText(inv.inviteLink);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Form state
            <>
              {/* Job Info */}
              <div className={styles.jobInfo}>
                <div className={styles.jobInfoIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className={styles.jobInfoText}>
                  <span className={styles.jobTitle}>{jobPosting?.jobTitle || 'Job Posting'}</span>
                  <span className={styles.companyName}>{jobPosting?.companyName}</span>
                </div>
              </div>

              {/* Selected Candidates */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Selected Candidates ({candidates.length})
                </h3>
                <div className={styles.candidatesList}>
                  {candidates.map((candidate) => (
                    <div key={candidate.candidateId} className={styles.candidateChip}>
                      <span className={styles.candidateAvatar}>
                        {(candidate.candidateName || candidate.candidateEmail).charAt(0).toUpperCase()}
                      </span>
                      <span className={styles.candidateName}>
                        {candidate.candidateName || candidate.candidateEmail.split('@')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Questions Preview */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Screening Questions ({totalQuestions})
                  <span className={styles.reviewNote}>Review before sending</span>
                </h3>
                
                <div className={styles.questionsPreview}>
                  {/* System Screening Questions */}
                  {jobPosting?.systemScreeningAnswers && jobPosting.systemScreeningAnswers.length > 0 && (
                    <div className={styles.questionGroup}>
                      <div className={styles.questionGroupHeader}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        System Questions ({jobPosting.systemScreeningAnswers.length})
                      </div>
                      <div className={styles.questionsList}>
                        {jobPosting.systemScreeningAnswers.map((answer, idx) => {
                          const questionDef = SYSTEM_SCREENING_QUESTIONS.find(q => q.id === answer.questionId);
                          return (
                            <div key={answer.questionId} className={styles.questionItem}>
                              <div className={styles.questionNumber}>{idx + 1}</div>
                              <div className={styles.questionContent}>
                                <div className={styles.questionText}>
                                  {questionDef?.question || answer.questionId}
                                </div>
                                <div className={styles.questionMeta}>
                                  <span className={`${styles.requirementBadge} ${styles[answer.requirement]}`}>
                                    {answer.requirement === 'must-have' ? 'Must Have' : 
                                     answer.requirement === 'preferred' ? 'Preferred' : 'Accept Any'}
                                  </span>
                                  {answer.selectedAnswers.length > 0 && (
                                    <span className={styles.expectedAnswers}>
                                      Expected: {answer.selectedAnswers.slice(0, 2).join(', ')}
                                      {answer.selectedAnswers.length > 2 && ` +${answer.selectedAnswers.length - 2} more`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Custom Screening Questions */}
                  {jobPosting?.customScreeningQuestions && jobPosting.customScreeningQuestions.length > 0 && (
                    <div className={styles.questionGroup}>
                      <div className={styles.questionGroupHeader}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Custom Questions ({jobPosting.customScreeningQuestions.length})
                      </div>
                      <div className={styles.questionsList}>
                        {jobPosting.customScreeningQuestions.map((question, idx) => {
                          const systemQuestionsCount = jobPosting.systemScreeningAnswers?.length || 0;
                          return (
                            <div key={question.id} className={styles.questionItem}>
                              <div className={styles.questionNumber}>{systemQuestionsCount + idx + 1}</div>
                              <div className={styles.questionContent}>
                                <div className={styles.questionText}>
                                  {question.questionText}
                                  {question.mustAnswer && <span className={styles.requiredMark}>*</span>}
                                </div>
                                <div className={styles.questionMeta}>
                                  <span className={styles.answerTypeBadge}>
                                    {question.answerType === 'single' ? 'Single Choice' :
                                     question.answerType === 'multiple' ? 'Multiple Choice' :
                                     question.answerType === 'yes-no' ? 'Yes/No' : 'Short Answer'}
                                  </span>
                                  {question.options && question.options.length > 0 && (
                                    <span className={styles.optionsCount}>
                                      {question.options.length} options
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Message */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  Personal Message <span className={styles.optional}>(optional)</span>
                </h3>
                <textarea
                  className={styles.messageInput}
                  placeholder="Add a personal message to include with the invitation..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
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

              {/* No Questions Warning */}
              {totalQuestions === 0 && (
                <div className={styles.warningMessage}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  No screening questions configured for this job. Please add questions in the job settings first.
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
                onClick={handleSendInvitations}
                disabled={isSending || totalQuestions === 0 || candidates.length === 0}
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
                    Send {candidates.length} Invitation{candidates.length !== 1 ? 's' : ''}
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
