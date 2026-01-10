'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

interface Question {
  type: 'system' | 'custom';
  questionId: string;
  questionText: string;
  answerType: string;
  options: string[];
  requirement?: string;
  mustAnswer?: boolean;
  expectedAnswers?: string[];
}

interface InvitationData {
  invitation: {
    id: string;
    status: string;
    candidateName: string | null;
    candidateEmail: string;
    message: string | null;
    expiresAt: string;
    isCompleted: boolean;
  };
  jobPosting: {
    id: string;
    jobTitle: string;
    companyName: string;
    companyLogo: string | null;
    countryRegion: string;
    workType: string;
  };
  questions: {
    system: Question[];
    custom: Question[];
    total: number;
  };
  existingResponses: Record<string, unknown>;
}

export default function InviteResponsePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InvitationData | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        // Pre-fill with existing responses
        if (result.data.existingResponses) {
          setResponses(result.data.existingResponses);
        }
        if (result.data.invitation.isCompleted) {
          setSubmitted(true);
        }
      } else {
        setError(result.error || 'Failed to load invitation');
      }
    } catch (err) {
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionType: string, questionId: string, value: unknown) => {
    const key = `${questionType}_${questionId}`;
    setResponses((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleMultipleSelect = (questionType: string, questionId: string, option: string) => {
    const key = `${questionType}_${questionId}`;
    const current = (responses[key] as string[]) || [];
    const newValue = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    setResponses((prev) => ({
      ...prev,
      [key]: newValue,
    }));
  };

  const handleSubmit = async () => {
    if (!data) return;

    // Build responses array
    const allQuestions = [...data.questions.system, ...data.questions.custom];
    const responsesArray = allQuestions.map((q) => {
      const key = `${q.type}_${q.questionId}`;
      return {
        questionType: q.type,
        questionId: q.questionId,
        questionText: q.questionText,
        answerType: q.answerType,
        answer: responses[key] || (q.answerType === 'multiple' ? [] : ''),
      };
    });

    setSubmitting(true);

    try {
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responsesArray }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || 'Failed to submit responses');
      }
    } catch (err) {
      setError('Failed to submit responses');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question, index: number) => {
    const key = `${question.type}_${question.questionId}`;
    const currentValue = responses[key];

    return (
      <div key={key} className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <span className={styles.questionNumber}>Q{index + 1}</span>
          {question.mustAnswer && <span className={styles.requiredBadge}>Required</span>}
        </div>
        <h3 className={styles.questionText}>{question.questionText}</h3>

        {question.answerType === 'yes-no' && (
          <div className={styles.optionsGrid}>
            {['Yes', 'No'].map((option) => (
              <label
                key={option}
                className={`${styles.optionCard} ${currentValue === option ? styles.optionSelected : ''}`}
              >
                <input
                  type="radio"
                  name={key}
                  value={option}
                  checked={currentValue === option}
                  onChange={() => handleResponseChange(question.type, question.questionId, option)}
                  className={styles.hiddenInput}
                />
                <span className={styles.optionText}>{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.answerType === 'single' && (
          <div className={styles.optionsList}>
            {question.options.map((option) => (
              <label
                key={option}
                className={`${styles.optionItem} ${currentValue === option ? styles.optionSelected : ''}`}
              >
                <input
                  type="radio"
                  name={key}
                  value={option}
                  checked={currentValue === option}
                  onChange={() => handleResponseChange(question.type, question.questionId, option)}
                  className={styles.hiddenInput}
                />
                <span className={styles.radioCircle} />
                <span className={styles.optionText}>{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.answerType === 'multiple' && (
          <div className={styles.optionsList}>
            {question.options.map((option) => {
              const selected = (currentValue as string[] || []).includes(option);
              return (
                <label
                  key={option}
                  className={`${styles.optionItem} ${selected ? styles.optionSelected : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => handleMultipleSelect(question.type, question.questionId, option)}
                    className={styles.hiddenInput}
                  />
                  <span className={styles.checkboxSquare}>
                    {selected && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className={styles.optionText}>{option}</span>
                </label>
              );
            })}
          </div>
        )}

        {question.answerType === 'short-text' && (
          <textarea
            className={styles.textInput}
            placeholder="Type your answer here..."
            value={(currentValue as string) || ''}
            onChange={(e) => handleResponseChange(question.type, question.questionId, e.target.value)}
            rows={3}
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Loading invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className={styles.errorTitle}>
          {error === 'This invitation has expired' ? 'Invitation Expired' : 'Invalid Invitation'}
        </h1>
        <p className={styles.errorText}>{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className={styles.successContainer}>
        <div className={styles.successIcon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <h1 className={styles.successTitle}>Thank You!</h1>
        <p className={styles.successText}>
          Your responses have been submitted successfully. The employer will review your answers shortly.
        </p>
        <div className={styles.successDetails}>
          <div className={styles.successJob}>
            <span className={styles.successLabel}>Applied Position</span>
            <span className={styles.successValue}>{data?.jobPosting.jobTitle}</span>
          </div>
          <div className={styles.successCompany}>
            <span className={styles.successLabel}>Company</span>
            <span className={styles.successValue}>{data?.jobPosting.companyName}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const allQuestions = [...data.questions.system, ...data.questions.custom];
  const expiresDate = new Date(data.invitation.expiresAt);
  const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoArea}>
            {data.jobPosting.companyLogo ? (
              <Image
                src={data.jobPosting.companyLogo}
                alt={data.jobPosting.companyName}
                width={48}
                height={48}
                className={styles.companyLogo}
              />
            ) : (
              <div className={styles.companyLogoPlaceholder}>
                {data.jobPosting.companyName.charAt(0)}
              </div>
            )}
            <div className={styles.headerText}>
              <h1 className={styles.companyName}>{data.jobPosting.companyName}</h1>
              <p className={styles.jobTitle}>{data.jobPosting.jobTitle}</p>
            </div>
          </div>
          <div className={styles.expiryBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'Expires today'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Welcome Message */}
        <div className={styles.welcomeCard}>
          <h2 className={styles.welcomeTitle}>
            Hi {data.invitation.candidateName || 'there'}! 👋
          </h2>
          <p className={styles.welcomeText}>
            {data.jobPosting.companyName} has invited you to answer some screening questions for the{' '}
            <strong>{data.jobPosting.jobTitle}</strong> position.
          </p>
          {data.invitation.message && (
            <div className={styles.personalMessage}>
              <div className={styles.messageIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p>{data.invitation.message}</p>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className={styles.questionsSection}>
          <div className={styles.questionsHeader}>
            <h2 className={styles.sectionTitle}>Screening Questions</h2>
            <span className={styles.questionsCount}>{allQuestions.length} questions</span>
          </div>

          <div className={styles.questionsList}>
            {allQuestions.map((question, index) => renderQuestion(question, index))}
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.submitSection}>
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className={styles.btnSpinner} />
                Submitting...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Submit My Answers
              </>
            )}
          </button>
          <p className={styles.submitNote}>
            You can update your answers until the invitation expires.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Powered by <strong>StarPlan</strong> — AI-Powered Job Matching</p>
      </footer>
    </div>
  );
}
