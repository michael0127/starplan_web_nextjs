'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import EmployerNavbar from '@/components/EmployerNavbar';
import { PageTransition } from '@/components/PageTransition';
import styles from './page.module.css';

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  experienceLevel: string | null;
  experienceYears: number | null;
  personal: {
    phone: string | null;
    email: string | null;
    linkedin: string | null;
    github: string | null;
  };
  workExperience: Array<{
    title: string | null;
    company: string | null;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean | null;
    description: string | null;
  }>;
  education: Array<{
    school: string | null;
    degree: string | null;
    field: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean | null;
  }>;
  skills: {
    technical: string[];
    soft: string[];
  };
  cv: {
    id: string;
    fileUrl: string;
    uploadedAt: string;
  } | null;
  application: {
    id: string;
    jobTitle: string;
    companyName: string;
    appliedAt: string;
    passedHardGate: boolean;
  } | null;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const candidateId = params.id as string;

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      router.push('/login');
      return;
    }

    const fetchCandidate = async () => {
      try {
        const response = await fetch(`/api/employer/candidates/${candidateId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch candidate');
        }

        const data = await response.json();
        setCandidate(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidate();
  }, [candidateId, session, sessionLoading, router]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Present';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (sessionLoading || loading) {
    return (
      <PageTransition>
        <div className={styles.container}>
          <EmployerNavbar />
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading candidate profile...</p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className={styles.container}>
          <EmployerNavbar />
          <div className={styles.errorState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h2>Error Loading Profile</h2>
            <p>{error}</p>
            <button onClick={() => router.back()} className={styles.backBtn}>
              Go Back
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!candidate) {
    return (
      <PageTransition>
        <div className={styles.container}>
          <EmployerNavbar />
          <div className={styles.errorState}>
            <h2>Candidate Not Found</h2>
            <button onClick={() => router.back()} className={styles.backBtn}>
              Go Back
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className={styles.container}>
        <EmployerNavbar userEmail={session?.user?.email} />
        
        {/* Header with back button */}
        <div className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back to Candidates
          </button>
        </div>

        {/* Main content - Two column layout */}
        <div className={styles.mainContent}>
          {/* Left Panel - Profile Info */}
          <div className={styles.leftPanel}>
            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.avatarLarge}>
                {candidate.avatarUrl ? (
                  <img src={candidate.avatarUrl} alt={candidate.name} />
                ) : (
                  <span>{getInitials(candidate.name)}</span>
                )}
              </div>
              <h1 className={styles.candidateName}>{candidate.name}</h1>
              {candidate.headline && (
                <p className={styles.headline}>{candidate.headline}</p>
              )}
              {candidate.location && (
                <p className={styles.location}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {candidate.location}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Contact Information
              </h3>
              <div className={styles.contactList}>
                <div className={styles.contactItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span>{candidate.personal.email || candidate.email}</span>
                </div>
                {candidate.personal.phone && (
                  <div className={styles.contactItem}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                    <span>{candidate.personal.phone}</span>
                  </div>
                )}
                {candidate.personal.linkedin && (
                  <a href={candidate.personal.linkedin} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>LinkedIn Profile</span>
                  </a>
                )}
                {candidate.personal.github && (
                  <a href={candidate.personal.github} target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>GitHub Profile</span>
                  </a>
                )}
              </div>
            </div>

            {/* Work Experience */}
            {candidate.workExperience.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                  </svg>
                  Work Experience
                </h3>
                <div className={styles.timeline}>
                  {candidate.workExperience.map((exp, index) => (
                    <div key={index} className={styles.timelineItem}>
                      <div className={styles.timelineDot}></div>
                      <div className={styles.timelineContent}>
                        <h4 className={styles.expTitle}>{exp.title || 'Position'}</h4>
                        <p className={styles.expCompany}>{exp.company || 'Company'}</p>
                        <p className={styles.expDate}>
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                        </p>
                        {exp.location && (
                          <p className={styles.expLocation}>{exp.location}</p>
                        )}
                        {exp.description && (
                          <p className={styles.expDescription}>{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {candidate.education.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                  </svg>
                  Education
                </h3>
                <div className={styles.educationList}>
                  {candidate.education.map((edu, index) => (
                    <div key={index} className={styles.educationItem}>
                      <h4 className={styles.schoolName}>{edu.school || 'Institution'}</h4>
                      <p className={styles.degree}>
                        {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                      </p>
                      <p className={styles.eduDate}>
                        {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {(candidate.skills.technical.length > 0 || candidate.skills.soft.length > 0) && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                  Skills
                </h3>
                {candidate.skills.technical.length > 0 && (
                  <div className={styles.skillGroup}>
                    <h4 className={styles.skillGroupTitle}>Technical Skills</h4>
                    <div className={styles.skillTags}>
                      {candidate.skills.technical.map((skill, index) => (
                        <span key={index} className={styles.skillTag}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {candidate.skills.soft.length > 0 && (
                  <div className={styles.skillGroup}>
                    <h4 className={styles.skillGroupTitle}>Soft Skills</h4>
                    <div className={styles.skillTags}>
                      {candidate.skills.soft.map((skill, index) => (
                        <span key={index} className={`${styles.skillTag} ${styles.softSkill}`}>{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - CV Viewer */}
          <div className={styles.rightPanel}>
            <div className={styles.cvHeader}>
              <h3 className={styles.cvTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Resume / CV
              </h3>
              {candidate.cv && (
                <a 
                  href={candidate.cv.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.downloadBtn}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download
                </a>
              )}
            </div>
            
            <div className={styles.cvViewer}>
              {candidate.cv?.fileUrl ? (
                (() => {
                  const fileUrl = candidate.cv.fileUrl.toLowerCase();
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
                  
                  if (isImage) {
                    return (
                      <div className={styles.cvPreview}>
                        <img 
                          src={candidate.cv.fileUrl} 
                          alt="CV Preview"
                          className={styles.cvImage}
                        />
                      </div>
                    );
                  }
                  
                  // For PDF, DOC, DOCX - use Google Docs Viewer
                  return (
                    <iframe 
                      src={`https://docs.google.com/viewer?url=${encodeURIComponent(candidate.cv.fileUrl)}&embedded=true`}
                      className={styles.pdfViewer}
                      title="Candidate CV"
                    />
                  );
                })()
              ) : (
                <div className={styles.noCv}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  <p>No CV uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

