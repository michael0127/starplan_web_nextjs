'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

interface OnboardingData {
  jobFunctions: string[];  // 改为数组支持多选
  jobTypes: string[];
  location: string;
  withinUS: boolean;
  remoteOpen: boolean;
  h1bSponsorship: boolean;
}

// 职位分类数据（AI技术相关）
const jobCategories = [
  {
    name: 'Software/Internet/AI',
    subcategories: [
      {
        title: 'Backend Engineering',
        positions: ['Backend Engineer', 'Full Stack Engineer', 'Python Engineer', 'Java Engineer', 'C/C++ Engineer', '.Net Engineer', 'Golang Engineer', 'Salesforce Developer', 'Blockchain Engineer']
      },
      {
        title: 'Data & Analytics',
        positions: ['Data Analyst', 'Data Scientist', 'Data Engineer', 'Business/BI Analyst', 'Power BI Developer', 'ETL Developer', 'Data Warehouse Engineer']
      },
      {
        title: 'Machine Learning & AI',
        positions: ['Machine Learning Engineer', 'AI Engineer', 'Machine Learning/AI Researcher', 'Machine Learning, Deep Learning', 'LLM Engineer']
      },
      {
        title: 'Frontend & Mobile',
        positions: ['Frontend Engineer', 'React Developer', 'Vue.js Developer', 'Angular Developer', 'iOS Developer', 'Android Developer', 'React Native Developer']
      },
      {
        title: 'DevOps & Cloud',
        positions: ['DevOps Engineer', 'Cloud Engineer', 'AWS Engineer', 'Azure Engineer', 'Site Reliability Engineer', 'Platform Engineer']
      },
      {
        title: 'QA & Testing',
        positions: ['QA Engineer', 'Test Automation Engineer', 'SDET', 'Manual Tester', 'Performance Test Engineer']
      }
    ]
  },
  {
    name: 'Product & Design',
    subcategories: [
      {
        title: 'Product Management',
        positions: ['Product Manager', 'Senior Product Manager', 'Product Owner', 'Technical Product Manager', 'AI Product Manager']
      },
      {
        title: 'Design',
        positions: ['UX Designer', 'UI Designer', 'Product Designer', 'UX Researcher', 'Interaction Designer']
      }
    ]
  },
  {
    name: 'Research & Science',
    subcategories: [
      {
        title: 'Research',
        positions: ['Research Scientist', 'AI Researcher', 'Machine Learning Researcher', 'Computer Vision Researcher', 'NLP Researcher']
      }
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [showJobDropdown, setShowJobDropdown] = useState(false);
  const [customJobInput, setCustomJobInput] = useState('');
  const [processingStep, setProcessingStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    jobFunctions: [],
    jobTypes: ['Full-time'],
    location: '',
    withinUS: true,
    remoteOpen: true,
    h1bSponsorship: false,
  });

  // 检查用户是否已认证
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showJobDropdown && !target.closest(`.${styles.jobFunctionWrapper}`)) {
        setShowJobDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showJobDropdown]);

  const handleJobTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter((t) => t !== type)
        : [...prev.jobTypes, type],
    }));
  };

  const handleJobFunctionToggle = (position: string) => {
    setFormData((prev) => {
      const isSelected = prev.jobFunctions.includes(position);
      return {
        ...prev,
        jobFunctions: isSelected
          ? prev.jobFunctions.filter(job => job !== position)
          : [...prev.jobFunctions, position]
      };
    });
  };

  const handleRemoveJobFunction = (position: string) => {
    setFormData((prev) => ({
      ...prev,
      jobFunctions: prev.jobFunctions.filter(job => job !== position)
    }));
  };

  const handleAddCustomJob = () => {
    const trimmed = customJobInput.trim();
    if (trimmed && !formData.jobFunctions.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        jobFunctions: [...prev.jobFunctions, trimmed]
      }));
      setCustomJobInput('');
    }
  };

  const handleCustomJobKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomJob();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSize = file.size / 1024 / 1024; // Convert to MB
      if (fileSize > 10) {
        setError('File size must not exceed 10MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        setError('Only PDF and Word documents are allowed');
        return;
      }
      setUploadedFile(file);
      setError('');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (formData.jobFunctions.length === 0) {
        setError('Please select at least one job function');
        return;
      }
      if (formData.jobTypes.length === 0) {
        setError('Please select at least one job type');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleStartMatching = async () => {
    if (!uploadedFile) {
      setError('Please upload your resume');
      return;
    }

    setIsProcessing(true);
    setError('');

    // 动态更新处理步骤文字
    const steps = [
      'Analyzing your resume...',
      'Identifying your job preferences...',
      'Preparing personalized matches...'
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setProcessingStep(stepIndex);
    }, 1000);

    // 3秒后自动跳转，不等待后台操作完成
    setTimeout(() => {
      clearInterval(stepInterval);
      router.push('/explore');
    }, 3000);

    // 后台异步执行上传和保存操作
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No session found');
          return;
        }

        // 1. 保存onboarding数据
        const onboardingResponse = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            jobFunction: formData.jobFunctions.join(', '),
            jobTypes: formData.jobTypes,
            location: formData.withinUS ? 'Within the US' : 'International',
            remoteOpen: formData.remoteOpen,
            h1bSponsorship: formData.h1bSponsorship,
          }),
        });

        if (!onboardingResponse.ok) {
          const errorData = await onboardingResponse.json();
          console.error('Onboarding save failed:', errorData.error);
          return;
        }

        // 2. 上传简历
        const resumeFormData = new FormData();
        resumeFormData.append('resume', uploadedFile);

        const resumeResponse = await fetch('/api/user/resume', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: resumeFormData,
        });

        if (!resumeResponse.ok) {
          const errorData = await resumeResponse.json();
          console.error('Resume upload failed:', errorData.error);
          return;
        }

        console.log('Onboarding and resume upload completed successfully');
      } catch (err) {
        console.error('Background upload error:', err);
      }
    })();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.logo}>
          <Image 
            src="/img/logo.png" 
            alt="StarPlan Logo" 
            width={180} 
            height={38}
            priority
          />
        </div>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3C2.73478 14 2.48043 13.8946 2.29289 13.7071C2.10536 13.5196 2 13.2652 2 13V3C2 2.73478 2.10536 2.48043 2.29289 2.29289C2.48043 2.10536 2.73478 2 3 2H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 11L14 8L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout
        </button>
      </div>

      <div className={styles.content}>
        {!isProcessing && (
          <div className={styles.mainCard}>
            {step === 1 && (
              <>
                <div className={styles.header}>
                  <h1 className={styles.title}>
                    Hi, I&apos;m Daisy, your AI Copilot for job search.
                  </h1>
                  <p className={styles.subtitle}>
                    To get started, what type of role are you looking for?
                  </p>
                </div>

                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span> Job Function <span className={styles.hint}>(select multiple or add custom)</span>
                    </label>

                    <div className={styles.jobFunctionWrapper}>
                      <div className={styles.inputWithTags}>
                        {/* 已选择的职位标签（在输入框内） */}
                        {formData.jobFunctions.map((job, idx) => (
                          <div key={idx} className={styles.inlineJobTag}>
                            {job}
                            <button
                              type="button"
                              className={styles.removeJobBtn}
                              onClick={() => handleRemoveJobFunction(job)}
                              aria-label={`Remove ${job}`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          placeholder={formData.jobFunctions.length === 0 ? "Type to add custom or click to select from list" : "Add more..."}
                          value={customJobInput}
                          onChange={(e) => setCustomJobInput(e.target.value)}
                          onFocus={() => setShowJobDropdown(true)}
                          onKeyPress={handleCustomJobKeyPress}
                          className={styles.inlineInput}
                          autoComplete="off"
                        />
                      </div>
                      {showJobDropdown && (
                        <div className={styles.jobDropdown}>
                          <div className={styles.jobCategories}>
                            {jobCategories.map((category, idx) => (
                              <div
                                key={idx}
                                className={`${styles.categoryItem} ${selectedCategory === idx ? styles.categoryItemActive : ''}`}
                                onClick={() => setSelectedCategory(idx)}
                              >
                                {category.name}
                                <span className={styles.arrow}>›</span>
                              </div>
                            ))}
                          </div>
                          <div className={styles.jobPositions}>
                            {jobCategories[selectedCategory].subcategories.map((sub, subIdx) => (
                              <div key={subIdx} className={styles.positionGroup}>
                                <div className={styles.positionTitle}>{sub.title}</div>
                                <div className={styles.positionList}>
                                  {sub.positions.map((position, posIdx) => (
                                    <button
                                      key={posIdx}
                                      type="button"
                                      className={`${styles.positionTag} ${
                                        formData.jobFunctions.includes(position) ? styles.positionTagSelected : ''
                                      }`}
                                      onClick={() => handleJobFunctionToggle(position)}
                                    >
                                      {formData.jobFunctions.includes(position) && (
                                        <span className={styles.checkmark}>✓</span>
                                      )}
                                      {position}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span> Job Type
                    </label>
                    <div className={styles.checkboxGroup}>
                      {['Full-time', 'Contract', 'Part-time', 'Internship'].map((type) => (
                        <label key={type} className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={formData.jobTypes.includes(type)}
                            onChange={() => handleJobTypeToggle(type)}
                          />
                          <span className={styles.checkboxLabel}>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Location</label>
                    <div className={styles.locationGroup}>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={formData.withinUS}
                          onChange={(e) => setFormData({ ...formData, withinUS: e.target.checked })}
                        />
                        <span className={styles.checkboxLabel}>Within the US</span>
                      </label>
                      <label className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={formData.remoteOpen}
                          onChange={(e) => setFormData({ ...formData, remoteOpen: e.target.checked })}
                        />
                        <span className={styles.checkboxLabel}>
                          Open to Remote
                          <span className={styles.tooltipIcon}>?</span>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Work Authorization
                      <span className={styles.tooltipIcon}>?</span>
                    </label>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={formData.h1bSponsorship}
                        onChange={(e) => setFormData({ ...formData, h1bSponsorship: e.target.checked })}
                      />
                      <span className={styles.checkboxLabel}>H1B sponsorship</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className={styles.header}>
                  <h1 className={styles.title}>
                    One last step, let&apos;s level up your search by uploading your resume.
                  </h1>
                </div>

                <div className={styles.uploadSection}>
                  <div className={styles.privacyNotice}>
                    <p>
                      Data privacy is the top priority at StarPlan. Your resume will only be used for job matching and will never be shared with third parties. For details, please see our{' '}
                      <a href="/privacy" className={styles.link}>Privacy Policy</a>.
                    </p>
                  </div>

                  <div className={styles.uploadArea}>
                    <input
                      type="file"
                      id="resume-upload"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className={styles.fileInput}
                    />
                    <label htmlFor="resume-upload" className={styles.uploadLabel}>
                      <div className={styles.uploadIcon}>
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                          <rect x="15" y="10" width="50" height="60" rx="4" stroke="#4A5BF4" strokeWidth="2" fill="white"/>
                          <line x1="25" y1="20" x2="45" y2="20" stroke="#4A5BF4" strokeWidth="2"/>
                          <line x1="25" y1="28" x2="55" y2="28" stroke="#4A5BF4" strokeWidth="2"/>
                          <line x1="25" y1="36" x2="55" y2="36" stroke="#4A5BF4" strokeWidth="2"/>
                          <circle cx="55" cy="55" r="15" fill="#4A5BF4"/>
                          <path d="M55 48L55 62M48 55L62 55" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <h3 className={styles.uploadTitle}>
                        {uploadedFile ? uploadedFile.name : 'Upload Your Resume'}
                      </h3>
                      <p className={styles.uploadHint}>
                        Files should be in <strong>PDF</strong> or <strong>Word</strong> format and must not exceed <strong>10MB</strong> in size.
                      </p>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className={styles.footer}>
              <div className={styles.progressDots}>
                <span className={`${styles.dot} ${step >= 1 ? styles.active : ''}`}></span>
                <span className={`${styles.dot} ${step >= 2 ? styles.active : ''}`}></span>
              </div>
              {step === 1 && (
                <button onClick={handleNext} className={styles.primaryButton}>
                  Next
                </button>
              )}
              {step === 2 && (
                <button 
                  onClick={handleStartMatching} 
                  className={styles.primaryButton}
                  disabled={isProcessing || !uploadedFile}
                >
                  Start Matching
                </button>
              )}
            </div>
            
            {error && (
              <div className={styles.errorMessage}>{error}</div>
            )}
          </div>
        )}

        {isProcessing && (
          <div className={styles.processingCard}>
            <div className={styles.processingIcon}>
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <rect x="20" y="15" width="60" height="70" rx="4" stroke="#4A5BF4" strokeWidth="2" fill="white"/>
                <line x1="30" y1="25" x2="55" y2="25" stroke="#4A5BF4" strokeWidth="2"/>
                <line x1="30" y1="35" x2="70" y2="35" stroke="#4A5BF4" strokeWidth="2"/>
                <line x1="30" y1="45" x2="70" y2="45" stroke="#4A5BF4" strokeWidth="2"/>
              </svg>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
            <p className={styles.processingText}>
              {processingStep === 0 && 'Analyzing your resume...'}
              {processingStep === 1 && 'Identifying your job preferences...'}
              {processingStep === 2 && 'Preparing personalized matches...'}
            </p>
            <div className={styles.featuresBox}>
              <div className={styles.featureBadge}>Feature Highlights</div>
              <h2 className={styles.featuresTitle}>
                Generate Custom<br />Resume For Each Job
              </h2>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
