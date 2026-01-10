'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import EmployerNavbar from '@/components/EmployerNavbar';
import styles from './page.module.css';

interface Invitation {
  id: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string | null;
  status: string;
  message: string | null;
  sentAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
  expiresAt: string;
  responsesCount: number;
  isExpired: boolean;
}

interface QuestionResponse {
  type: string;
  questionId: string;
  questionText: string;
  answerType: string;
  options: string[];
  requirement: string;
  expectedAnswers?: string[];
  idealAnswer?: unknown;
  candidateAnswer: unknown;
  hasResponse: boolean;
  matchesExpected?: boolean | null;
  matchesIdeal?: boolean | null;
}

interface InvitationDetail {
  invitation: {
    id: string;
    candidateId: string;
    candidateEmail: string;
    candidateName: string | null;
    status: string;
    message: string | null;
    sentAt: string;
    viewedAt: string | null;
    respondedAt: string | null;
    expiresAt: string;
  };
  questions: {
    system: QuestionResponse[];
    custom: QuestionResponse[];
  };
  summary: {
    totalQuestions: number;
    answeredQuestions: number;
    matchedQuestions: number;
    matchPercentage: number;
  };
}

interface JobPosting {
  id: string;
  jobTitle: string;
  companyName: string;
}

export default function JobInvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selected');
  
  const { loading: userTypeLoading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/login',
  });

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [initialSelectionDone, setInitialSelectionDone] = useState(false);

  useEffect(() => {
    if (isEmployer) {
      fetchInvitations();
      fetchJobPosting();
    }
  }, [isEmployer, jobId]);

  // Auto-select invitation from URL parameter
  useEffect(() => {
    if (selectedId && invitations.length > 0 && !initialSelectionDone) {
      const exists = invitations.find(inv => inv.id === selectedId);
      if (exists) {
        fetchInvitationDetail(selectedId);
        setInitialSelectionDone(true);
      }
    }
  }, [selectedId, invitations, initialSelectionDone]);

  const fetchJobPosting = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/job-postings/${jobId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data) {
        setJobPosting({ id: data.id, jobTitle: data.jobTitle, companyName: data.companyName });
      }
    } catch (err) {
      console.error('Failed to fetch job posting:', err);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/job-postings/${jobId}/invitations`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const data = await response.json();
      if (data.success) {
        setInvitations(data.data.invitations);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitationDetail = async (invitationId: string) => {
    try {
      setLoadingDetail(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/job-postings/${jobId}/invitations/${invitationId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSelectedInvitation(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch invitation detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (inv: Invitation) => {
    if (inv.status === 'COMPLETED') {
      return <span className={`${styles.badge} ${styles.badgeCompleted}`}>Completed</span>;
    }
    if (inv.isExpired) {
      return <span className={`${styles.badge} ${styles.badgeExpired}`}>Expired</span>;
    }
    if (inv.status === 'VIEWED') {
      return <span className={`${styles.badge} ${styles.badgeViewed}`}>Viewed</span>;
    }
    return <span className={`${styles.badge} ${styles.badgePending}`}>Pending</span>;
  };

  const formatAnswer = (answer: unknown): string => {
    if (answer === null || answer === undefined) return '—';
    if (typeof answer === 'boolean') return answer ? 'Yes' : 'No';
    if (Array.isArray(answer)) return answer.join(', ');
    return String(answer);
  };

  if (userTypeLoading || loading) {
    return (
      <div className={styles.pageWrapper}>
        <EmployerNavbar />
        <PageTransition>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Loading invitations...</p>
          </div>
        </PageTransition>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <EmployerNavbar />
      <PageTransition>
        <div className={styles.container}>
          {/* Header */}
          <div className={styles.header}>
            <Link href="/employer/jobs" className={styles.backLink}>
              ← Back to Jobs
            </Link>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Screening Invitations</h1>
              {jobPosting && (
                <p className={styles.subtitle}>{jobPosting.jobTitle} at {jobPosting.companyName}</p>
              )}
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>{error}</div>
          )}

          {/* Main Layout */}
          <div className={styles.mainLayout}>
            {/* Invitations List */}
            <div className={styles.listPanel}>
              <div className={styles.listHeader}>
                <h2>Invited Candidates ({invitations.length})</h2>
              </div>

              {invitations.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No invitations sent yet</p>
                  <Link href="/employer/candidates" className={styles.linkBtn}>
                    Go to Candidates
                  </Link>
                </div>
              ) : (
                <div className={styles.invitationList}>
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className={`${styles.invitationItem} ${selectedInvitation?.invitation.id === inv.id ? styles.itemSelected : ''}`}
                      onClick={() => fetchInvitationDetail(inv.id)}
                    >
                      <div className={styles.itemHeader}>
                        <div className={styles.candidateInfo}>
                          <div className={styles.avatar}>
                            {(inv.candidateName || inv.candidateEmail).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.candidateName}>
                              {inv.candidateName || inv.candidateEmail.split('@')[0]}
                            </div>
                            <div className={styles.candidateEmail}>{inv.candidateEmail}</div>
                          </div>
                        </div>
                        {getStatusBadge(inv)}
                      </div>
                      <div className={styles.itemMeta}>
                        <span>Sent: {formatDate(inv.sentAt)}</span>
                        {inv.respondedAt && (
                          <span>• Responded: {formatDate(inv.respondedAt)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail Panel */}
            <div className={styles.detailPanel}>
              {loadingDetail ? (
                <div className={styles.loadingDetail}>
                  <div className={styles.spinner} />
                  <p>Loading responses...</p>
                </div>
              ) : selectedInvitation ? (
                <>
                  <div className={styles.detailHeader}>
                    <div>
                      <h2 className={styles.detailName}>
                        {selectedInvitation.invitation.candidateName || selectedInvitation.invitation.candidateEmail.split('@')[0]}
                      </h2>
                      <p className={styles.detailEmail}>
                        {selectedInvitation.invitation.candidateEmail}
                      </p>
                    </div>
                    {selectedInvitation.invitation.status === 'COMPLETED' && (
                      <div className={styles.matchScore}>
                        <div className={styles.matchPercentage}>
                          {selectedInvitation.summary.matchPercentage}%
                        </div>
                        <div className={styles.matchLabel}>Match Score</div>
                      </div>
                    )}
                  </div>

                  {selectedInvitation.invitation.status !== 'COMPLETED' ? (
                    <div className={styles.noResponses}>
                      <div className={styles.noResponsesIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 22h14" />
                          <path d="M5 2h14" />
                          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                        </svg>
                      </div>
                      <h3>Awaiting Response</h3>
                      <p>This candidate hasn't submitted their answers yet.</p>
                      <div className={styles.statusInfo}>
                        <div><strong>Status:</strong> {selectedInvitation.invitation.status}</div>
                        <div><strong>Sent:</strong> {formatDate(selectedInvitation.invitation.sentAt)}</div>
                        {selectedInvitation.invitation.viewedAt && (
                          <div><strong>Viewed:</strong> {formatDate(selectedInvitation.invitation.viewedAt)}</div>
                        )}
                        <div><strong>Expires:</strong> {formatDate(selectedInvitation.invitation.expiresAt)}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.summaryBar}>
                        <div className={styles.summaryItem}>
                          <span className={styles.summaryValue}>{selectedInvitation.summary.answeredQuestions}</span>
                          <span className={styles.summaryLabel}>Answered</span>
                        </div>
                        <div className={styles.summaryItem}>
                          <span className={styles.summaryValue}>{selectedInvitation.summary.totalQuestions}</span>
                          <span className={styles.summaryLabel}>Total</span>
                        </div>
                        <div className={styles.summaryItem}>
                          <span className={`${styles.summaryValue} ${styles.matchValue}`}>
                            {selectedInvitation.summary.matchedQuestions}
                          </span>
                          <span className={styles.summaryLabel}>Matched</span>
                        </div>
                      </div>

                      {/* System Questions */}
                      {selectedInvitation.questions.system.length > 0 && (
                        <div className={styles.questionSection}>
                          <h3 className={styles.sectionTitle}>System Screening Questions</h3>
                          {selectedInvitation.questions.system.map((q, idx) => (
                            <div key={`sys-${idx}`} className={styles.questionCard}>
                              <div className={styles.questionHeader}>
                                <span className={styles.questionNumber}>Q{idx + 1}</span>
                                <span className={`${styles.requirementBadge} ${styles[`req_${q.requirement}`]}`}>
                                  {q.requirement}
                                </span>
                                {q.matchesExpected !== null && (
                                  <span className={q.matchesExpected ? styles.matchYes : styles.matchNo}>
                                    {q.matchesExpected ? '✓ Match' : '✗ No Match'}
                                  </span>
                                )}
                              </div>
                              <p className={styles.questionText}>{q.questionText}</p>
                              <div className={styles.answerCompare}>
                                <div className={styles.answerBox}>
                                  <label>Expected Answer:</label>
                                  <div className={styles.answerValue}>
                                    {formatAnswer(q.expectedAnswers)}
                                  </div>
                                </div>
                                <div className={styles.answerBox}>
                                  <label>Candidate's Answer:</label>
                                  <div className={`${styles.answerValue} ${q.matchesExpected ? styles.answerMatch : styles.answerNoMatch}`}>
                                    {formatAnswer(q.candidateAnswer)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Custom Questions */}
                      {selectedInvitation.questions.custom.length > 0 && (
                        <div className={styles.questionSection}>
                          <h3 className={styles.sectionTitle}>Custom Screening Questions</h3>
                          {selectedInvitation.questions.custom.map((q, idx) => (
                            <div key={`cust-${idx}`} className={styles.questionCard}>
                              <div className={styles.questionHeader}>
                                <span className={styles.questionNumber}>Q{idx + 1}</span>
                                <span className={`${styles.requirementBadge} ${styles[`req_${q.requirement}`]}`}>
                                  {q.requirement || 'optional'}
                                </span>
                                {q.matchesIdeal !== null && (
                                  <span className={q.matchesIdeal ? styles.matchYes : styles.matchNo}>
                                    {q.matchesIdeal ? '✓ Match' : '✗ No Match'}
                                  </span>
                                )}
                              </div>
                              <p className={styles.questionText}>{q.questionText}</p>
                              <div className={styles.answerBox}>
                                <label>Candidate's Answer:</label>
                                <div className={`${styles.answerValue} ${q.answerType === 'short-text' ? styles.textAnswer : ''}`}>
                                  {formatAnswer(q.candidateAnswer)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className={styles.selectPrompt}>
                  <div className={styles.selectIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 12H5" />
                      <path d="M12 19l-7-7 7-7" />
                    </svg>
                  </div>
                  <p>Select a candidate to view their responses</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
