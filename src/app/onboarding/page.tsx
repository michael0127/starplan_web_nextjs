'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Fuse from 'fuse.js';
import { supabase } from '@/lib/supabase';
import { useUserType } from '@/hooks/useUserType';
import { COUNTRIES_REGIONS, EXPERIENCE_LEVELS, WORK_TYPES, PAY_TYPES, CURRENCIES } from '@/lib/jobConstants';
import { WORK_AUTH_OPTIONS } from '@/lib/screeningOptions';
import { getLocationOptions, searchCities, getAllCitiesForCountry, COUNTRY_FLAGS } from '@/lib/locationData';
import type { Currency } from '@/lib/jobConstants';
import styles from './page.module.css';

interface OnboardingData {
  // Categories & Skills
  categories: string[];
  categorySkills: string[];
  
  // Experience
  experienceLevel: string;
  experienceYearsFrom: number;
  experienceYearsTo: number | 'Unlimited';
  
  // Work Type
  workTypes: string[];
  remoteOpen: boolean;
  
  // Salary Expectations
  payType: string;
  currency: Currency;
  salaryExpectationFrom: string;
  salaryExpectationTo: string;
  
  // Work Authorization
  workAuthCountries: string[];
  workAuthByCountry: Record<string, string>;
  
  // Preferred Locations
  preferredLocations: Array<{ country: string; cities: string[] }>;
  
  // Legacy fields (kept for backward compatibility)
  jobTypes: string[];
  location: string;
  withinUS: boolean;
}

// Categories from CSV - extracted categories list
const ALL_CATEGORIES = [
  'Machine Learning Engineer (Artificial Intelligence / Machine Learning)',
  'Deep Learning Engineer (Artificial Intelligence / Machine Learning)',
  'Generative AI Engineer (Artificial Intelligence / Machine Learning)',
  'Multi-Agent Systems Engineer (Artificial Intelligence / Machine Learning)',
  'Reinforcement Learning Engineer (Artificial Intelligence / Machine Learning)',
  'NLP Engineer (Artificial Intelligence / Machine Learning)',
  'Computer Vision Engineer (Artificial Intelligence / Machine Learning)',
  'Speech/Audio AI Engineer (Artificial Intelligence / Machine Learning)',
  'AI Research Scientist (Artificial Intelligence / Machine Learning)',
  'Applied AI Scientist (Artificial Intelligence / Machine Learning)',
  'AI Ethics & Policy Specialist (Artificial Intelligence / Machine Learning)',
  'AI Product Manager (Artificial Intelligence / Machine Learning)',
  'AI Data Curator / Data Labeling Ops (Artificial Intelligence / Machine Learning)',
  'AI Infrastructure Engineer (MLOps/LLMOps) (Artificial Intelligence / Machine Learning)',
  'Data Scientist (Data Science & Analytics)',
  'Data Analyst (Data Science & Analytics)',
  'Quantitative Analyst (Data Science & Analytics)',
  'BI Analyst (Data Science & Analytics)',
  'Statistician (Data Science & Analytics)',
  'Data Visualization Engineer (Data Science & Analytics)',
  'Experimentation / Causal Inference Scientist (Data Science & Analytics)',
  'Decision Scientist (Data Science & Analytics)',
  'Data Engineer (Data Engineering)',
  'Big Data Engineer (Data Engineering)',
  'ETL Developer (Data Engineering)',
  'Database Engineer (Data Engineering)',
  'Analytics Engineer (Data Engineering)',
  'Data Platform Engineer (Data Engineering)',
  'Backend Engineer (Software Engineering)',
  'Frontend Engineer (Software Engineering)',
  'Full Stack Engineer (Software Engineering)',
  'Systems Engineer (Software Engineering)',
  'Embedded Engineer (Software Engineering)',
  'Cloud Software Engineer (Software Engineering)',
  'Mobile Engineer (iOS/Android) (Software Engineering)',
  'API Engineer (Software Engineering)',
  'DevOps Engineer (Software Engineering)',
  'Site Reliability Engineer (SRE) (Software Engineering)',
  'Platform Engineer (Software Engineering)',
  'Cloud Architect (Cloud & Infrastructure)',
  'Cloud Engineer (Cloud & Infrastructure)',
  'Cloud Security Engineer (Cloud & Infrastructure)',
  'Infrastructure Engineer (Cloud & Infrastructure)',
  'Network Engineer (Cloud & Infrastructure)',
  'Kubernetes Engineer (Cloud & Infrastructure)',
  'Cybersecurity Engineer (Security & Cybersecurity)',
  'Security Analyst (Security & Cybersecurity)',
  'Security Architect (Security & Cybersecurity)',
  'Penetration Tester / Ethical Hacker (Security & Cybersecurity)',
  'Threat Intelligence Analyst (Security & Cybersecurity)',
  'Application Security Engineer (Security & Cybersecurity)',
  'Cloud Security Specialist (Security & Cybersecurity)',
  'Governance Risk & Compliance (GRC) (Security & Cybersecurity)',
  'Technical Product Manager (Product & Project Roles)',
  'AI Product Manager (Product & Project Roles)',
  'Technical Program Manager (Product & Project Roles)',
  'Scrum Master (Product & Project Roles)',
  'Product Analyst (Product & Project Roles)',
  'UX Researcher (Product & Project Roles)',
  'UI/UX Designer (Product & Project Roles)',
  'Service Designer (Product & Project Roles)',
  'Robotics Engineer (Robotics & Autonomous Systems)',
  'Autonomous Systems Engineer (Robotics & Autonomous Systems)',
  'Mechatronics Engineer (Robotics & Autonomous Systems)',
  'Sensor Fusion Engineer (Robotics & Autonomous Systems)',
  'Robot Learning Engineer (Robotics & Autonomous Systems)',
  'Hardware/Embedded Robotics Engineer (Robotics & Autonomous Systems)',
  'Hardware Engineer (Hardware & Semiconductor)',
  'FPGA Engineer (Hardware & Semiconductor)',
  'ASIC Engineer (Hardware & Semiconductor)',
  'Chip Design Engineer (Hardware & Semiconductor)',
  'Computer Architect (Hardware & Semiconductor)',
  'Embedded Systems Engineer (Hardware & Semiconductor)',
  'IoT Engineer (Hardware & Semiconductor)',
  'CTO (Tech Leadership)',
  'VP Engineering (Tech Leadership)',
  'Head of AI (Tech Leadership)',
  'Head of Product (Tech Leadership)',
  'Chief Data Officer (Tech Leadership)',
  'Chief Information Security Officer (Tech Leadership)',
  'AI Team Lead / Engineering Manager (Tech Leadership)',
  'Tech Lead / Staff Engineer / Principal Engineer (Tech Leadership)',
  'Systems Administrator (IT & Systems)',
  'IT Support / Helpdesk (IT & Systems)',
  'Network Administrator (IT & Systems)',
  'IT Operations Specialist (IT & Systems)',
  'Systems Analyst (IT & Systems)',
  'ERP/CRM Engineer (IT & Systems)',
  'AI for Finance (Tech in Business Functions)',
  'AI in Marketing (Tech in Business Functions)',
  'AI in Operations (Tech in Business Functions)',
  'AI in HR (Tech in Business Functions)',
  'AI in Supply Chain (Tech in Business Functions)',
  'LLM Application Developer (GenerativeAI)',
  'AI Agent Engineer (GenerativeAI)',
  'AI Workflow Automation Engineer (GenerativeAI)',
  'Prompt Engineer (GenerativeAI)',
  'Synthetic Data Engineer (GenerativeAI)',
  'Digital Twin Engineer (GenerativeAI)',
  'AI Safety & Alignment Researcher (GenerativeAI)',
  'Human-AI Interaction Engineer (GenerativeAI)',
  'AI Quality & Evaluation Engineer (GenerativeAI)',
  'Autonomous Agent Safety Analyst (GenerativeAI)',
  'AI Compliance / Audit Engineer (GenerativeAI)',
  'Product Designer (Design)',
  'UX Designer (Design)',
  'UI Designer (Design)',
  'Interaction Designer (Design)',
  'Visual Designer (Design)',
  'Design Researcher (Design)',
  'Design Systems Designer (Design)',
  'Motion Designer (Design)',
  'Creative Technologist (Design)',
  'AI UX Designer (Design)',
];

// Work authorization options are imported from screeningOptions.ts

// Get location options from the comprehensive city database
// This provides 151,000+ cities from open source data
const LOCATION_OPTIONS = getLocationOptions();

export default function OnboardingPage() {
  const router = useRouter();
  
  // 权限检查：只允许 CANDIDATE 访问
  const { loading: userTypeLoading, isCandidate } = useUserType({
    required: 'CANDIDATE',
    redirectTo: '/employer/dashboard',
  });
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [citySearchTerms, setCitySearchTerms] = useState<Record<string, string>>({});
  const [processingStep, setProcessingStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingData>({
    categories: [],
    categorySkills: [],
    experienceLevel: 'Junior',
    experienceYearsFrom: 0,
    experienceYearsTo: 3,
    workTypes: [],
    remoteOpen: false,
    payType: 'Annual salary',
    currency: CURRENCIES[0],
    salaryExpectationFrom: '',
    salaryExpectationTo: '',
    workAuthCountries: [],
    workAuthByCountry: {},
    preferredLocations: [],
    // Legacy fields
    jobTypes: [],
    location: '',
    withinUS: false,
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

  // Category selection handler
  const handleCategorySelect = (category: string) => {
    setFormData(prev => {
      const isSelected = prev.categories.includes(category);
      const newCategories = isSelected
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      
      return {
        ...prev,
        categories: newCategories,
      };
    });
  };

  // Configure Fuse.js for fuzzy search (same as Job Posting)
  const fuse = useMemo(() => {
    const searchData = ALL_CATEGORIES.map(cat => ({ category: cat }));
    return new Fuse(searchData, {
      keys: ['category'],
      threshold: 0.4, // 0 = perfect match, 1 = match anything
      includeScore: true,
      minMatchCharLength: 2,
      ignoreLocation: true, // Search in entire string, not just beginning
    });
  }, []);

  // Filter categories using Fuse.js fuzzy search
  const filteredCategories = useMemo(() => {
    if (categorySearchTerm.trim() === '') {
      return ALL_CATEGORIES;
    }
    
    const results = fuse.search(categorySearchTerm);
    return results.map(result => result.item.category);
  }, [categorySearchTerm, fuse]);

  // Work type selection handler
  const handleWorkTypeToggle = (type: string) => {
    setFormData(prev => {
      const isSelected = prev.workTypes.includes(type);
      return {
      ...prev,
        workTypes: isSelected
          ? prev.workTypes.filter(t => t !== type)
          : [...prev.workTypes, type],
      };
    });
  };

  // Work authorization handlers
  const handleWorkAuthCountryToggle = (country: string) => {
    setFormData(prev => {
      const isSelected = prev.workAuthCountries.includes(country);
      const newCountries = isSelected
        ? prev.workAuthCountries.filter(c => c !== country)
        : [...prev.workAuthCountries, country];
      
      // If unchecking, remove work auth for that country
      const newWorkAuthByCountry = { ...prev.workAuthByCountry };
      if (!newCountries.includes(country)) {
        delete newWorkAuthByCountry[country];
      }
      
      return {
        ...prev,
        workAuthCountries: newCountries,
        workAuthByCountry: newWorkAuthByCountry,
      };
    });
  };

  const handleWorkAuthSelect = (country: string, authOption: string) => {
    setFormData(prev => ({
      ...prev,
      workAuthByCountry: {
        ...prev.workAuthByCountry,
        [country]: authOption,
      },
    }));
  };

  // Experience level handler
  const handleExperienceLevelChange = (level: string) => {
    const selectedLevel = EXPERIENCE_LEVELS.find(l => l.level === level);
    if (selectedLevel) {
      setFormData(prev => ({
        ...prev,
        experienceLevel: level,
        experienceYearsFrom: selectedLevel.suggestedYearsFrom,
        experienceYearsTo: selectedLevel.suggestedYearsTo,
      }));
    }
  };

  // Preferred location handlers
  const handleLocationCountryToggle = (country: string) => {
    setFormData(prev => {
      const existingIndex = prev.preferredLocations.findIndex(loc => loc.country === country);
      
      if (existingIndex >= 0) {
        // Remove country and its cities
        return {
          ...prev,
          preferredLocations: prev.preferredLocations.filter((_, idx) => idx !== existingIndex)
        };
      } else {
        // Add country with empty cities
        return {
          ...prev,
          preferredLocations: [...prev.preferredLocations, { country, cities: [] }]
        };
    }
    });
  };

  const handleLocationCityToggle = (country: string, city: string) => {
    setFormData(prev => {
      const locationIndex = prev.preferredLocations.findIndex(loc => loc.country === country);
      
      if (locationIndex < 0) return prev;
      
      const updatedLocations = [...prev.preferredLocations];
      const currentCities = updatedLocations[locationIndex].cities;
      
      if (currentCities.includes(city)) {
        // Remove city
        updatedLocations[locationIndex] = {
          ...updatedLocations[locationIndex],
          cities: currentCities.filter(c => c !== city)
        };
      } else {
        // Add city
        updatedLocations[locationIndex] = {
          ...updatedLocations[locationIndex],
          cities: [...currentCities, city]
        };
      }
      
      return {
        ...prev,
        preferredLocations: updatedLocations
      };
    });
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
      if (formData.categories.length === 0) {
        setError('Please select at least one job category');
        return;
      }
      if (formData.workTypes.length === 0) {
        setError('Please select at least one work type');
        return;
      }
      if (formData.workAuthCountries.length === 0) {
        setError('Please select at least one country for work authorization');
        return;
      }
      // Validate that each selected country has work auth specified
      for (const country of formData.workAuthCountries) {
        if (!formData.workAuthByCountry[country]) {
          setError(`Please select work authorization type for ${country}`);
          return;
        }
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
            categories: formData.categories,
            categorySkills: formData.categorySkills,
            experienceLevel: formData.experienceLevel,
            experienceYearsFrom: formData.experienceYearsFrom,
            experienceYearsTo: formData.experienceYearsTo.toString(),
            workTypes: formData.workTypes,
            remoteOpen: formData.remoteOpen,
            payType: formData.payType,
            currency: typeof formData.currency === 'object' ? formData.currency.code : formData.currency,
            salaryExpectationFrom: formData.salaryExpectationFrom,
            salaryExpectationTo: formData.salaryExpectationTo,
            workAuthCountries: formData.workAuthCountries,
            workAuthByCountry: formData.workAuthByCountry,
            preferredLocations: formData.preferredLocations,
            // Legacy fields for backward compatibility
            jobTypes: formData.workTypes,
            location: formData.preferredLocations.length > 0 
              ? formData.preferredLocations.map(loc => 
                  loc.cities.length > 0 
                    ? `${loc.country} (${loc.cities.join(', ')})` 
                    : loc.country
                ).join('; ')
              : '',
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

  // 如果正在加载用户类型或不是 candidate，显示加载状态
  if (userTypeLoading || !isCandidate) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          Loading...
        </div>
      </div>
    );
  }

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
                  {/* 1. Categories */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span> Job Categories
                    </label>
                    <div style={{ marginBottom: '8px' }}>
                      {!isCategoryExpanded ? (
                        <div 
                          onClick={() => setIsCategoryExpanded(true)}
                          style={{ 
                            padding: '12px', 
                            border: '1px solid #ddd', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            backgroundColor: '#f9f9f9'
                          }}
                        >
                          {formData.categories.length === 0 ? (
                            <span style={{ color: '#999' }}>Click to select categories...</span>
                          ) : (
                            <span>{formData.categories.length} categor{formData.categories.length === 1 ? 'y' : 'ies'} selected</span>
                          )}
                        </div>
                        ) : (
                          <div style={{ 
                            border: '1px solid #ddd', 
                            borderRadius: '8px',
                            backgroundColor: 'white'
                          }}>
                            {/* Header with collapse button */}
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              padding: '12px',
                              borderBottom: '1px solid #e0e0e0'
                            }}>
                              <span style={{ fontWeight: 500 }}>Select categories</span>
                            <button
                              type="button"
                                onClick={() => {
                                  setIsCategoryExpanded(false);
                                  setCategorySearchTerm('');
                                }}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  color: '#4A5BF4',
                                  fontWeight: 500
                                }}
                            >
                                Collapse ▲
                            </button>
                          </div>
                            
                            {/* Search input */}
                            <div style={{ padding: '12px', borderBottom: '1px solid #e0e0e0' }}>
                        <input
                          type="text"
                                placeholder="🔍 Search categories..."
                                value={categorySearchTerm}
                                onChange={(e) => setCategorySearchTerm(e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '10px 12px',
                                  border: '1px solid #ddd',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#4A5BF4'}
                                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                              />
                              {categorySearchTerm && (
                                <div style={{ 
                                  fontSize: '13px', 
                                  color: '#666', 
                                  marginTop: '6px' 
                                }}>
                                  Found {filteredCategories.length} categor{filteredCategories.length === 1 ? 'y' : 'ies'}
                      </div>
                              )}
                            </div>
                            
                            {/* Scrollable category list */}
                            <div style={{ 
                              maxHeight: '300px', 
                              overflowY: 'auto',
                              padding: '12px'
                            }}>
                              {filteredCategories.length > 0 ? (
                                filteredCategories.map((cat) => (
                                  <label key={cat} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '8px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    marginBottom: '4px',
                                    backgroundColor: formData.categories.includes(cat) ? '#f0f4ff' : 'transparent'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!formData.categories.includes(cat)) {
                                      e.currentTarget.style.backgroundColor = '#f9f9f9';
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!formData.categories.includes(cat)) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                  }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={formData.categories.includes(cat)}
                                      onChange={() => handleCategorySelect(cat)}
                                      style={{ marginRight: '8px' }}
                                    />
                                    <span style={{ fontSize: '14px' }}>{cat}</span>
                                  </label>
                                ))
                              ) : (
                                <div style={{ 
                                  textAlign: 'center', 
                                  padding: '20px', 
                                  color: '#999',
                                  fontSize: '14px'
                                }}>
                                  No categories found matching &quot;{categorySearchTerm}&quot;
                              </div>
                              )}
                          </div>
                          </div>
                        )}
                    </div>
                    {formData.categories.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                        {formData.categories.map((cat) => (
                          <span key={cat} style={{ 
                            padding: '6px 12px', 
                            backgroundColor: '#4A5BF4', 
                            color: 'white', 
                            borderRadius: '16px',
                            fontSize: '13px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            {cat}
                                    <button
                                      type="button"
                              onClick={() => handleCategorySelect(cat)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: 'white', 
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: 1
                              }}
                            >
                              ×
                                    </button>
                          </span>
                                  ))}
                                </div>
                      )}
                              </div>

                  {/* 2. Experience Level */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span> Experience Level
                    </label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => handleExperienceLevelChange(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '12px', 
                        border: '1px solid #ddd', 
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    >
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.level} value={level.level}>
                          {level.level} ({level.description})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Work Type */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span> Work Type
                    </label>
                    <div className={styles.checkboxGroup}>
                      {WORK_TYPES.map((type) => (
                        <label key={type} className={styles.checkbox}>
                          <input
                            type="checkbox"
                            checked={formData.workTypes.includes(type)}
                            onChange={() => handleWorkTypeToggle(type)}
                          />
                          <span className={styles.checkboxLabel}>{type}</span>
                        </label>
                      ))}
                    </div>
                    <label className={styles.checkbox} style={{ marginTop: '12px' }}>
                        <input
                          type="checkbox"
                          checked={formData.remoteOpen}
                          onChange={(e) => setFormData({ ...formData, remoteOpen: e.target.checked })}
                        />
                      <span className={styles.checkboxLabel}>Open to Remote Work</span>
                      </label>
                  </div>

                  {/* 4. Salary Expectations */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Salary Expectations (Optional)</label>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <select
                        value={formData.payType}
                        onChange={(e) => setFormData({ ...formData, payType: e.target.value })}
                        style={{ 
                          flex: 1, 
                          padding: '12px', 
                          border: '1px solid #ddd', 
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        {PAY_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <select
                        value={typeof formData.currency === 'object' ? formData.currency.code : formData.currency}
                        onChange={(e) => {
                          const selected = CURRENCIES.find(c => c.code === e.target.value);
                          if (selected) setFormData({ ...formData, currency: selected });
                        }}
                        style={{ 
                          width: '120px', 
                          padding: '12px', 
                          border: '1px solid #ddd', 
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        {CURRENCIES.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.symbol} {curr.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="From"
                        value={formData.salaryExpectationFrom}
                        onChange={(e) => setFormData({ ...formData, salaryExpectationFrom: e.target.value })}
                        style={{ 
                          flex: 1, 
                          padding: '12px', 
                          border: '1px solid #ddd', 
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      <span>to</span>
                      <input
                        type="text"
                        placeholder="To"
                        value={formData.salaryExpectationTo}
                        onChange={(e) => setFormData({ ...formData, salaryExpectationTo: e.target.value })}
                        style={{ 
                          flex: 1, 
                          padding: '12px', 
                          border: '1px solid #ddd', 
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  {/* 5. Preferred Locations */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Preferred Locations (Optional)</label>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                      Select countries and specific cities where you&apos;d like to work
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {LOCATION_OPTIONS.map((location) => {
                        const isCountrySelected = formData.preferredLocations.some(loc => loc.country === location.country);
                        const selectedCities = formData.preferredLocations.find(loc => loc.country === location.country)?.cities || [];
                        
                        return (
                          <div
                            key={location.country}
                            style={{
                              padding: '16px',
                              background: 'white',
                              border: isCountrySelected ? '2px solid #4A5BF4' : '2px solid #e0e0e0',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <label style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px',
                              cursor: 'pointer'
                            }}>
                        <input
                          type="checkbox"
                                checked={isCountrySelected}
                                onChange={() => handleLocationCountryToggle(location.country)}
                                style={{ 
                                  width: '18px', 
                                  height: '18px', 
                                  accentColor: '#4A5BF4',
                                  cursor: 'pointer'
                                }}
                        />
                              <span style={{ fontSize: '24px' }}>{location.flag}</span>
                              <span style={{ 
                                fontSize: '14px', 
                                fontWeight: 600, 
                                color: '#252525',
                                flex: 1
                              }}>
                                {location.country}
                              </span>
                              {isCountrySelected && selectedCities.length > 0 && (
                                <span style={{ 
                                  fontSize: '13px', 
                                  color: '#4A5BF4',
                                  fontWeight: 500
                                }}>
                                  {selectedCities.length} {selectedCities.length === 1 ? 'city' : 'cities'} selected
                                </span>
                              )}
                      </label>
                            
                            {isCountrySelected && (
                              <div style={{ 
                                marginTop: '16px',
                                paddingTop: '16px',
                                borderTop: '1px solid #e0e0e0'
                              }}>
                                <p style={{ 
                                  fontSize: '14px', 
                                  fontWeight: 500,
                                  color: '#252525',
                                  marginBottom: '12px'
                                }}>
                                  Select specific cities (optional):
                                </p>
                                
                                {/* City Search Input */}
                                <div style={{ marginBottom: '12px' }}>
                                  <input
                                    type="text"
                                    placeholder={`🔍 Search cities in ${location.country}...`}
                                    value={citySearchTerms[location.country] || ''}
                                    onChange={(e) => setCitySearchTerms(prev => ({
                                      ...prev,
                                      [location.country]: e.target.value
                                    }))}
                                    style={{
                                      width: '100%',
                                      padding: '10px 12px',
                                      border: '1px solid #ddd',
                                      borderRadius: '8px',
                                      fontSize: '14px',
                                      outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#4A5BF4'}
                                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                                  />
                                  {citySearchTerms[location.country] && (
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                      Showing results for &quot;{citySearchTerms[location.country]}&quot;
                                    </div>
                                  )}
                                </div>
                                
                                {/* Selected Cities Display */}
                                {selectedCities.length > 0 && (
                                  <div style={{ 
                                    marginBottom: '12px',
                                    padding: '8px 12px',
                                    background: 'rgba(74, 91, 244, 0.08)',
                                    borderRadius: '8px'
                                  }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                                      Selected ({selectedCities.length}):
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {selectedCities.map((city) => (
                                        <span
                                          key={city}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 10px',
                                            background: '#4A5BF4',
                                            color: 'white',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                          }}
                                        >
                                          {city}
                                          <button
                                            type="button"
                                            onClick={() => handleLocationCityToggle(location.country, city)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              color: 'white',
                                              cursor: 'pointer',
                                              padding: '0 2px',
                                              fontSize: '14px',
                                              lineHeight: 1
                                            }}
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* City Options - with search filtering */}
                                <div style={{ 
                                  display: 'flex', 
                                  flexWrap: 'wrap', 
                                  gap: '8px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  padding: '4px'
                                }}>
                                  {searchCities(location.country, citySearchTerms[location.country] || '', 30)
                                    .filter(city => !selectedCities.includes(city))
                                    .map((city, idx) => (
                                    <label
                                      key={`${city}-${idx}`}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 12px',
                                        background: '#f5f5f5',
                                        color: '#252525',
                                        borderRadius: '16px',
                                        fontSize: '13px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        border: '1px solid #e0e0e0',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#e8e8e8';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#f5f5f5';
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={false}
                                        onChange={() => handleLocationCityToggle(location.country, city)}
                                        style={{ display: 'none' }}
                                      />
                                      {city}
                                    </label>
                                  ))}
                                </div>
                                
                                {selectedCities.length === 0 && !citySearchTerms[location.country] && (
                                  <p style={{ 
                                    fontSize: '12px', 
                                    color: '#999', 
                                    marginTop: '8px',
                                    fontStyle: 'italic'
                                  }}>
                                    No cities selected - you&apos;re open to any location in {location.country}
                                  </p>
                                )}
                                
                                <p style={{ 
                                  fontSize: '11px', 
                                  color: '#999', 
                                  marginTop: '8px'
                                }}>
                                  💡 Type to search from all cities in {location.country}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                    {formData.preferredLocations.length > 0 && (
                      <div style={{ 
                        marginTop: '12px',
                        padding: '12px',
                        background: '#f9f9f9',
                        borderRadius: '8px'
                      }}>
                        <div style={{ fontSize: '13px', color: '#666', fontWeight: 500, marginBottom: '8px' }}>
                          Selected locations:
                        </div>
                        <div style={{ fontSize: '13px', color: '#252525' }}>
                          {formData.preferredLocations.map((loc, idx) => (
                            <div key={idx} style={{ marginBottom: '4px' }}>
                              • {loc.country}
                              {loc.cities.length > 0 && (
                                <span style={{ color: '#666' }}> — {loc.cities.join(', ')}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 6. Work Authorization */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span> Work Authorization
                    </label>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                      Select the countries/regions where you have work authorization and specify your authorization status
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {COUNTRIES_REGIONS.slice(0, -1).map((country) => (
                        <div
                          key={country.value}
                          style={{
                            padding: '16px',
                            background: 'white',
                            border: formData.workAuthCountries.includes(country.value) 
                              ? '2px solid #4A5BF4' 
                              : '2px solid #e0e0e0',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <label style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            cursor: 'pointer'
                          }}>
                      <input
                        type="checkbox"
                              checked={formData.workAuthCountries.includes(country.value)}
                              onChange={() => handleWorkAuthCountryToggle(country.value)}
                              style={{ 
                                width: '18px', 
                                height: '18px', 
                                accentColor: '#4A5BF4',
                                cursor: 'pointer'
                              }}
                      />
                            <span style={{ fontSize: '24px' }}>{country.flag}</span>
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: 600, 
                              color: '#252525',
                              flex: 1
                            }}>
                              {country.label}
                            </span>
                    </label>
                          
                          {formData.workAuthCountries.includes(country.value) && (
                            <div style={{ 
                              marginTop: '16px',
                              paddingTop: '16px',
                              borderTop: '1px solid #e0e0e0'
                            }}>
                              <p style={{ 
                                fontSize: '14px', 
                                fontWeight: 500,
                                color: '#252525',
                                marginBottom: '12px'
                              }}>
                                Select your work authorization status:
                              </p>
                              <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '8px'
                              }}>
                                {(WORK_AUTH_OPTIONS[country.value as keyof typeof WORK_AUTH_OPTIONS] || []).map((option, index) => (
                                  <label
                                    key={index}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '12px',
                                      padding: '12px 16px',
                                      background: formData.workAuthByCountry[country.value] === option 
                                        ? 'rgba(74, 91, 244, 0.05)' 
                                        : 'white',
                                      border: formData.workAuthByCountry[country.value] === option 
                                        ? '2px solid #4A5BF4' 
                                        : '2px solid #e0e0e0',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                      if (formData.workAuthByCountry[country.value] !== option) {
                                        e.currentTarget.style.borderColor = '#4A5BF4';
                                        e.currentTarget.style.background = 'rgba(74, 91, 244, 0.02)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (formData.workAuthByCountry[country.value] !== option) {
                                        e.currentTarget.style.borderColor = '#e0e0e0';
                                        e.currentTarget.style.background = 'white';
                                      }
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`work-auth-${country.value}`}
                                      checked={formData.workAuthByCountry[country.value] === option}
                                      onChange={() => handleWorkAuthSelect(country.value, option)}
                                      style={{ 
                                        marginTop: '3px',
                                        width: '18px', 
                                        height: '18px', 
                                        accentColor: '#4A5BF4',
                                        cursor: 'pointer',
                                        flexShrink: 0
                                      }}
                                    />
                                    <span style={{ 
                                      fontSize: '14px', 
                                      color: '#252525',
                                      lineHeight: '1.6'
                                    }}>
                                      {option}
                                    </span>
                    </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
