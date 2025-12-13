'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { CustomQuestionBuilder } from '@/components/CustomQuestionBuilder';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import { 
  getRecommendedCategories, 
  getTopRecommendedCategory 
} from '@/lib/categoryRecommendation';
import { 
  getAllCategoryNames,
  getSkillsForCategory 
} from '@/lib/jobCategories';
import {
  COUNTRIES_REGIONS,
  EXPERIENCE_LEVELS,
  WORK_TYPES,
  PAY_TYPES,
  CURRENCIES,
  getSuggestedCurrency,
  type Currency,
} from '@/lib/jobConstants';
import {
  WORK_AUTH_OPTIONS,
  SYSTEM_SCREENING_QUESTIONS,
  type AnswerRequirement,
  type CustomQuestionType,
  type SystemScreeningAnswer,
  type CustomScreeningQuestion,
} from '@/lib/screeningOptions';
import styles from './page.module.css';

// 步骤定义
const STEPS = [
  { id: 1, name: 'Classify', label: 'Job Classification' },
  { id: 2, name: 'Write', label: 'Job Details' },
  { id: 3, name: 'Screening', label: 'Screening & Filters' },
  { id: 4, name: 'Payment', label: 'Review & Payment' }
];

// 表单数据类型
interface JobFormData {
  // Step 1: Classify
  jobTitle: string;
  category: string;
  categorySkills: string[]; // Skills associated with the category
  isCategoryManuallySelected: boolean; // Track if user manually selected category
  countryRegion: string;
  experienceLevel: string;
  experienceYearsFrom: number;
  experienceYearsTo: number | 'Unlimited';
  workType: string;
  payType: string;
  currency: Currency;
  payFrom: string;
  payTo: string;
  showSalaryOnAd: boolean;
  salaryDisplayText: string;
  
  // Step 2: Write
  companyName: string;
  jobDescription: string;
  jobSummary: string;
  keySellingPoint1: string;
  keySellingPoint2: string;
  keySellingPoint3: string;
  companyLogo: string;
  companyCoverImage: string;
  videoLink: string;
  
  // Step 3: Screening
  selectedCountries: string[]; // Multiple countries/regions can be selected
  workAuthByCountry: Record<string, string>; // Country -> selected work auth option
  systemScreeningAnswers: SystemScreeningAnswer[];
  customScreeningQuestions: CustomScreeningQuestion[];
  applicationDeadline: string;
}

export default function CreateJobAd() {
  const mounted = usePageAnimation();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [recommendedCategories, setRecommendedCategories] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [showCustomQuestionBuilder, setShowCustomQuestionBuilder] = useState(false);
  const [editingCustomQuestion, setEditingCustomQuestion] = useState<CustomScreeningQuestion | null>(null);
  
  // 使用权限检查 hook
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/companies',
  });

  // 表单数据
  const [formData, setFormData] = useState<JobFormData>({
    jobTitle: '',
    category: '',
    categorySkills: [],
    isCategoryManuallySelected: false,
    countryRegion: 'Australia',
    experienceLevel: 'Junior',
    experienceYearsFrom: 0,
    experienceYearsTo: 3,
    workType: 'Full-time',
    payType: 'Annual salary',
    currency: CURRENCIES[0], // Default to AUD
    payFrom: '',
    payTo: '',
    showSalaryOnAd: true,
    salaryDisplayText: '',
    companyName: '',
    jobDescription: '',
    jobSummary: '',
    keySellingPoint1: '',
    keySellingPoint2: '',
    keySellingPoint3: '',
    companyLogo: '',
    companyCoverImage: '',
    videoLink: '',
    selectedCountries: [],
    workAuthByCountry: {},
    systemScreeningAnswers: [],
    customScreeningQuestions: [],
    applicationDeadline: '',
  });

  // Job title 变化时触发智能推荐
  useEffect(() => {
    if (formData.jobTitle && formData.jobTitle.trim().length > 0) {
      const recommendations = getRecommendedCategories(formData.jobTitle);
      const categoryNames = recommendations.map(r => r.category);
      setRecommendedCategories(categoryNames);
      
      // 只有在未手动选择时，才自动设置推荐的 category
      if (!formData.isCategoryManuallySelected && categoryNames.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: categoryNames[0]
        }));
      }
    } else {
      setRecommendedCategories([]);
    }
  }, [formData.jobTitle, formData.isCategoryManuallySelected]);

  // Country/Region 变化时自动建议货币
  useEffect(() => {
    if (formData.countryRegion) {
      const suggestedCurrency = getSuggestedCurrency(formData.countryRegion);
      setFormData(prev => ({
        ...prev,
        currency: suggestedCurrency
      }));
    }
  }, [formData.countryRegion]);

  // Experience Level 变化时自动建议年限
  useEffect(() => {
    const level = EXPERIENCE_LEVELS.find(l => l.level === formData.experienceLevel);
    if (level) {
      setFormData(prev => ({
        ...prev,
        experienceYearsFrom: level.suggestedYearsFrom,
        experienceYearsTo: level.suggestedYearsTo
      }));
    }
  }, [formData.experienceLevel]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/companies');
  };

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCategorySelect = (category: string) => {
    const skills = getSkillsForCategory(category);
    setFormData(prev => ({
      ...prev,
      category,
      categorySkills: skills,
      isCategoryManuallySelected: true
    }));
    setShowCustomInput(false);
    setCustomCategoryInput('');
    setIsEditingSkills(false);
    setEditedSkills([]);
  };

  const handleCustomCategorySubmit = () => {
    if (customCategoryInput.trim()) {
      setFormData(prev => ({
        ...prev,
        category: customCategoryInput.trim(),
        categorySkills: [], // No predefined skills for custom category
        isCategoryManuallySelected: true
      }));
      setShowCustomInput(false);
      setCustomCategoryInput('');
      setIsEditingSkills(false);
      setEditedSkills([]);
    }
  };

  const handleDropdownChange = (value: string) => {
    if (value === '__custom__') {
      setShowCustomInput(true);
      setCustomCategoryInput('');
      setIsCategoryExpanded(false);
    } else {
      handleCategorySelect(value);
      setIsCategoryExpanded(false);
    }
  };

  const toggleCategoryExpand = () => {
    setIsCategoryExpanded(!isCategoryExpanded);
  };

  const handleSkillsDoubleClick = () => {
    setIsEditingSkills(true);
    setEditedSkills([...formData.categorySkills]);
  };

  const handleSkillsChange = (value: string) => {
    // Split by comma or semicolon
    const skills = value.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
    setEditedSkills(skills);
  };

  const handleSkillsSave = () => {
    setFormData(prev => ({
      ...prev,
      categorySkills: editedSkills
    }));
    setIsEditingSkills(false);
  };

  const handleSkillsCancel = () => {
    setIsEditingSkills(false);
    setEditedSkills([]);
  };

  const handleAddNewSkill = () => {
    const trimmedSkill = newSkillInput.trim();
    if (trimmedSkill && !formData.categorySkills.includes(trimmedSkill)) {
      setFormData(prev => ({
        ...prev,
        categorySkills: [...prev.categorySkills, trimmedSkill]
      }));
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      categorySkills: prev.categorySkills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleNewSkillKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddNewSkill();
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.countryRegion) {
      newErrors.countryRegion = 'Country/Region is required';
    }
    
    // Experience years validation
    if (formData.experienceYearsTo !== 'Unlimited') {
      if (formData.experienceYearsFrom > formData.experienceYearsTo) {
        newErrors.experienceYears = 'From must be ≤ To';
      }
    }
    
    // Pay range validation
    if (formData.payFrom && formData.payTo) {
      const from = parseFloat(formData.payFrom);
      const to = parseFloat(formData.payTo);
      if (from > to) {
        newErrors.payRange = 'From must be ≤ To';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.jobDescription.trim()) {
      newErrors.jobDescription = 'Job description is required';
    }
    if (!formData.jobSummary.trim()) {
      newErrors.jobSummary = 'Job summary is required';
    }
    
    // YouTube link validation (optional, but if provided must be valid)
    if (formData.videoLink.trim()) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
      if (!youtubeRegex.test(formData.videoLink)) {
        newErrors.videoLink = 'Please enter a valid YouTube URL';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, companyLogo: 'Please upload an image file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, companyLogo: 'Image size must be less than 5MB' }));
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setFormData(prev => ({ ...prev, companyLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
      
      // Clear error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.companyLogo;
        return newErrors;
      });
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, companyCoverImage: 'Please upload an image file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, companyCoverImage: 'Image size must be less than 5MB' }));
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
        setFormData(prev => ({ ...prev, companyCoverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
      
      // Clear error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.companyCoverImage;
        return newErrors;
      });
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview('');
    setFormData(prev => ({ ...prev, companyLogo: '' }));
  };

  const handleRemoveCover = () => {
    setCoverPreview('');
    setFormData(prev => ({ ...prev, companyCoverImage: '' }));
  };

  // Page 3: Work Authorization handlers
  const handleCountryToggle = (country: string) => {
    setFormData(prev => {
      const newSelectedCountries = prev.selectedCountries.includes(country)
        ? prev.selectedCountries.filter(c => c !== country)
        : [...prev.selectedCountries, country];
      
      // If unchecking, remove work auth for that country
      const newWorkAuthByCountry = { ...prev.workAuthByCountry };
      if (!newSelectedCountries.includes(country)) {
        delete newWorkAuthByCountry[country];
      }
      
      return {
        ...prev,
        selectedCountries: newSelectedCountries,
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

  // Page 3: System Screening handlers
  const handleSystemScreeningChange = (
    questionId: string,
    requirement: AnswerRequirement,
    answers: string[]
  ) => {
    setFormData(prev => {
      const existingIndex = prev.systemScreeningAnswers.findIndex(a => a.questionId === questionId);
      const newAnswers = [...prev.systemScreeningAnswers];
      
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = { questionId, requirement, selectedAnswers: answers };
      } else {
        newAnswers.push({ questionId, requirement, selectedAnswers: answers });
      }
      
      return {
        ...prev,
        systemScreeningAnswers: newAnswers,
      };
    });
  };

  // Page 3: Custom Question handlers
  const handleAddCustomQuestion = (question: CustomScreeningQuestion) => {
    setFormData(prev => ({
      ...prev,
      customScreeningQuestions: [...prev.customScreeningQuestions, { ...question, id: Date.now().toString() }],
    }));
    setShowCustomQuestionBuilder(false);
    setEditingCustomQuestion(null);
  };

  const handleEditCustomQuestion = (question: CustomScreeningQuestion) => {
    setEditingCustomQuestion(question);
    setShowCustomQuestionBuilder(true);
  };

  const handleUpdateCustomQuestion = (updatedQuestion: CustomScreeningQuestion) => {
    setFormData(prev => ({
      ...prev,
      customScreeningQuestions: prev.customScreeningQuestions.map(q =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      ),
    }));
    setShowCustomQuestionBuilder(false);
    setEditingCustomQuestion(null);
  };

  const handleDeleteCustomQuestion = (questionId: string) => {
    setFormData(prev => ({
      ...prev,
      customScreeningQuestions: prev.customScreeningQuestions.filter(q => q.id !== questionId),
    }));
  };
  
  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      return;
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    // TODO: 实现提交逻辑
    console.log('Submitting job ad:', formData);
  };

  if (loading || !isEmployer) {
    return (
      <PageTransition>
        <div className={styles.container}>
          <div className={styles.loading}>Loading...</div>
        </div>
      </PageTransition>
    );
  }

  const allCategories = getAllCategoryNames();

  return (
    <PageTransition>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <Link href="/employer/dashboard">
                <img src="/img/logo.png" alt="StarPlan" />
              </Link>
            </div>
            <nav className={styles.nav}>
              <Link href="/employer/dashboard" className={styles.navLink}>
                Dashboard
              </Link>
              <Link href="/employer/jobs" className={styles.navLink}>
                Job Posts
              </Link>
              <div className={styles.userMenu}>
                <span className={styles.userEmail}>{user?.email}</span>
                <button onClick={handleSignOut} className={styles.signOutBtn}>
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className={styles.main}>
          <div className={styles.contentWrapper}>
            {/* Page Title */}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Create a job ad</h1>
              <p className={styles.pageSubtitle}>
                Follow the steps below to create and publish your job posting
              </p>
            </div>

            {/* Progress Steps */}
            <div className={styles.progressSteps}>
              {STEPS.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`${styles.stepItem} ${
                    currentStep === step.id ? styles.stepActive : ''
                  } ${currentStep > step.id ? styles.stepCompleted : ''}`}
                >
                  <div className={styles.stepCircle}>
                    {currentStep > step.id ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13 4L6 11L3 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>
                  <div className={styles.stepLabel}>
                    <div className={styles.stepName}>{step.name}</div>
                    <div className={styles.stepDescription}>{step.label}</div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={styles.stepConnector}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Form Content */}
            <div className={styles.formCard}>
              {/* Step 1: Classify */}
              {currentStep === 1 && (
                <div className={styles.stepContent}>
                  <h2 className={styles.stepTitle}>Job Classification</h2>
                  <p className={styles.stepDescription}>
                    Provide the essential details to help candidates find your position.
                  </p>

                  {/* FR-C1: Job Title */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Job title <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      className={`${styles.input} ${errors.jobTitle ? styles.inputError : ''}`}
                      placeholder="e.g. Machine Learning Engineer, Senior Data Scientist"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    />
                    {errors.jobTitle && (
                      <span className={styles.errorText}>{errors.jobTitle}</span>
                    )}
                    <span className={styles.hint}>
                      Use a clear job title to help candidates understand the role
                    </span>
                  </div>

                  {/* FR-C2: Category with智能推荐 */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Category <span className={styles.required}>*</span>
                    </label>
                    
                    {/* Show recommended categories if available */}
                    {recommendedCategories.length > 0 && !showCustomInput && (
                      <div className={styles.recommendedSection}>
                        {!formData.isCategoryManuallySelected && (
                          <div className={styles.suggestionBadge}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 2L10 6L14 6.5L11 9.5L12 14L8 11.5L4 14L5 9.5L2 6.5L6 6L8 2Z" fill="currentColor"/>
                            </svg>
                            Suggested based on your job title
                          </div>
                        )}
                        {formData.isCategoryManuallySelected && (
                          <div className={styles.selectedBadge}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Selected by employer
                          </div>
                        )}
                        
                        <div className={styles.categoryGrid}>
                          {recommendedCategories.slice(0, 4).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              className={`${styles.categoryCard} ${
                                formData.category === cat ? styles.categoryCardActive : ''
                              }`}
                              onClick={() => handleCategorySelect(cat)}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Custom input mode */}
                    {showCustomInput ? (
                      <div className={styles.customInputWrapper}>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="Enter your custom category"
                          value={customCategoryInput}
                          onChange={(e) => setCustomCategoryInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCustomCategorySubmit();
                            }
                          }}
                          autoFocus
                        />
                        <div className={styles.customInputActions}>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={() => {
                              setShowCustomInput(false);
                              setCustomCategoryInput('');
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={handleCustomCategorySubmit}
                            disabled={!customCategoryInput.trim()}
                          >
                            Add Custom Category
                          </button>
                        </div>
                        <span className={styles.hint}>
                          Enter any category that best describes your position
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Category dropdown with collapsible scroll */}
                        <div className={styles.categoryDropdownWrapper}>
                          {/* Collapsed single-line view */}
                          {!isCategoryExpanded ? (
                            <div 
                              className={styles.categoryCollapsed}
                              onClick={toggleCategoryExpand}
                            >
                              <select
                                className={`${styles.select} ${errors.category ? styles.inputError : ''}`}
                                value={formData.category && allCategories.includes(formData.category) ? formData.category : ''}
                                onChange={(e) => handleDropdownChange(e.target.value)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCategoryExpand();
                                }}
                              >
                                <option value="">Select from categories or create custom...</option>
                                {allCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                                <option value="__custom__">➕ Create Custom Category</option>
                              </select>
                              <div className={styles.expandHint}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Click to expand scrollable list</span>
                              </div>
                            </div>
                          ) : (
                            /* Expanded scrollable list view */
                            <div className={styles.categoryExpanded}>
                              <div className={styles.expandedHeader}>
                                <span>Select a category (scrollable list)</span>
                                <button
                                  type="button"
                                  className={styles.collapseBtn}
                                  onClick={toggleCategoryExpand}
                                >
                                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M15 12.5L10 7.5L5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Collapse
                                </button>
                              </div>
                              <select
                                className={`${styles.select} ${styles.scrollableSelect} ${errors.category ? styles.inputError : ''}`}
                                value={formData.category && allCategories.includes(formData.category) ? formData.category : ''}
                                onChange={(e) => handleDropdownChange(e.target.value)}
                                size={8}
                              >
                                <option value="">Select from categories or create custom...</option>
                                {allCategories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                                <option value="__custom__">➕ Create Custom Category</option>
                              </select>
                            </div>
                          )}
                        </div>
                        
                        {/* Show current custom category if set */}
                        {formData.category && !allCategories.includes(formData.category) && (
                          <div className={styles.customCategoryBadge}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            <span>Custom: {formData.category}</span>
                            <button
                              type="button"
                              className={styles.removeCustomBtn}
                              onClick={() => setFormData(prev => ({ ...prev, category: '', categorySkills: [] }))}
                              title="Remove custom category"
                            >
                              ×
                            </button>
                          </div>
                        )}
                        
                        {errors.category && (
                          <span className={styles.errorText}>{errors.category}</span>
                        )}
                        <span className={styles.hint}>
                          Select from 115 predefined categories or create your own custom category
                        </span>
                      </>
                    )}
                    
                    {/* Skills display/edit section */}
                    {formData.category && (
                      <div className={styles.skillsSection}>
                        <div className={styles.skillsHeader}>
                          <label className={styles.label}>Associated Skills</label>
                          {!isEditingSkills && formData.categorySkills.length > 0 && (
                            <span className={styles.hint}>
                              Double-click to edit skills
                            </span>
                          )}
                        </div>
                        
                        {isEditingSkills ? (
                          <div className={styles.skillsEditWrapper}>
                            <textarea
                              className={styles.textarea}
                              rows={4}
                              placeholder="Enter skills separated by commas (e.g. Python, Machine Learning, TensorFlow)"
                              value={editedSkills.join(', ')}
                              onChange={(e) => handleSkillsChange(e.target.value)}
                              autoFocus
                            />
                            <div className={styles.skillsEditActions}>
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={handleSkillsCancel}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                className={styles.btnPrimary}
                                onClick={handleSkillsSave}
                              >
                                Save Skills
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.skillsDisplayContainer}>
                            {/* Display existing skills with remove buttons */}
                            {formData.categorySkills.length > 0 ? (
                              <div className={styles.skillsTags}>
                                {formData.categorySkills.map((skill, index) => (
                                  <span key={index} className={styles.skillTag}>
                                    {skill}
                                    <button
                                      type="button"
                                      className={styles.removeSkillBtn}
                                      onClick={() => handleRemoveSkill(skill)}
                                      title="Remove skill"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className={styles.noSkills}>
                                No skills added yet. Add skills using the input below or double-click to edit.
                              </div>
                            )}
                            
                            {/* Add new skill input */}
                            <div className={styles.addSkillWrapper}>
                              <input
                                type="text"
                                className={styles.addSkillInput}
                                placeholder="Add a skill (e.g. Python, React, Machine Learning)"
                                value={newSkillInput}
                                onChange={(e) => setNewSkillInput(e.target.value)}
                                onKeyPress={handleNewSkillKeyPress}
                              />
                              <button
                                type="button"
                                className={styles.btnAddSkill}
                                onClick={handleAddNewSkill}
                                disabled={!newSkillInput.trim()}
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                                Add Skill
                              </button>
                            </div>
                            
                            {/* Hint for double-click edit */}
                            <div 
                              className={styles.bulkEditHint}
                              onClick={handleSkillsDoubleClick}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <span>Or click here to edit all skills at once</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* FR-C3: Countries/Regions */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Countries/Regions <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={`${styles.select} ${errors.countryRegion ? styles.inputError : ''}`}
                      value={formData.countryRegion}
                      onChange={(e) => handleInputChange('countryRegion', e.target.value)}
                    >
                      {COUNTRIES_REGIONS.map((country) => (
                        <option key={country.value} value={country.value}>
                          {country.flag} {country.label}
                        </option>
                      ))}
                    </select>
                    {errors.countryRegion && (
                      <span className={styles.errorText}>{errors.countryRegion}</span>
                    )}
                    <span className={styles.hint}>
                      This will determine work rights screening questions in Step 3
                    </span>
                  </div>

                  {/* FR-C4: Experience Level */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Experience Level <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={formData.experienceLevel}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                    >
                      {EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.level} value={level.level}>
                          {level.level} - {level.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Required Working Time */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Required experience (years) - From
                      </label>
                      <input
                        type="number"
                        min="0"
                        className={`${styles.input} ${errors.experienceYears ? styles.inputError : ''}`}
                        value={formData.experienceYearsFrom}
                        onChange={(e) => handleInputChange('experienceYearsFrom', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        To
                      </label>
                      <div className={styles.toInputWrapper}>
                        <input
                          type="number"
                          min="0"
                          className={`${styles.input} ${errors.experienceYears ? styles.inputError : ''}`}
                          value={formData.experienceYearsTo === 'Unlimited' ? '' : formData.experienceYearsTo}
                          onChange={(e) => handleInputChange('experienceYearsTo', parseInt(e.target.value) || 0)}
                          placeholder="Or select unlimited"
                          disabled={formData.experienceYearsTo === 'Unlimited'}
                        />
                        <label className={styles.checkboxInline}>
                          <input
                            type="checkbox"
                            checked={formData.experienceYearsTo === 'Unlimited'}
                            onChange={(e) => handleInputChange('experienceYearsTo', e.target.checked ? 'Unlimited' : 0)}
                          />
                          <span>Unlimited</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  {errors.experienceYears && (
                    <span className={styles.errorText}>{errors.experienceYears}</span>
                  )}

                  {/* FR-C5: Work Type */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Work type <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.radioGroup}>
                      {WORK_TYPES.map((type) => (
                        <label key={type} className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="workType"
                            value={type}
                            checked={formData.workType === type}
                            onChange={(e) => handleInputChange('workType', e.target.value)}
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* FR-C6: Pay Type */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Pay type <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={formData.payType}
                      onChange={(e) => handleInputChange('payType', e.target.value)}
                    >
                      {PAY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FR-C7: Pay Range */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Pay range <span className={styles.required}>*</span>
                    </label>
                    
                    {/* Currency selector */}
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label className={styles.labelSmall}>Currency</label>
                        <select
                          className={styles.select}
                          value={formData.currency.code}
                          onChange={(e) => {
                            const currency = CURRENCIES.find(c => c.code === e.target.value);
                            if (currency) handleInputChange('currency', currency);
                          }}
                        >
                          {CURRENCIES.map((curr) => (
                            <option key={curr.code} value={curr.code}>
                              {curr.symbol} {curr.code} - {curr.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Pay range inputs */}
                    <div className={styles.salaryGroup}>
                      <input
                        type="number"
                        min="0"
                        className={`${styles.input} ${errors.payRange ? styles.inputError : ''}`}
                        placeholder="From"
                        value={formData.payFrom}
                        onChange={(e) => handleInputChange('payFrom', e.target.value)}
                      />
                      <span className={styles.salaryDivider}>to</span>
                      <input
                        type="number"
                        min="0"
                        className={`${styles.input} ${errors.payRange ? styles.inputError : ''}`}
                        placeholder="To"
                        value={formData.payTo}
                        onChange={(e) => handleInputChange('payTo', e.target.value)}
                      />
                    </div>
                    {errors.payRange && (
                      <span className={styles.errorText}>{errors.payRange}</span>
                    )}
                  </div>

                  {/* FR-C8: Pay shown on ad */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Pay shown on ad (optional)
                    </label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="showSalary"
                          checked={formData.showSalaryOnAd}
                          onChange={() => handleInputChange('showSalaryOnAd', true)}
                        />
                        <span>Show salary on ad</span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="showSalary"
                          checked={!formData.showSalaryOnAd}
                          onChange={() => handleInputChange('showSalaryOnAd', false)}
                        />
                        <span>Hide salary on ad</span>
                      </label>
                    </div>
                    
                    {formData.showSalaryOnAd && (
                      <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                        <label className={styles.labelSmall}>
                          Custom salary display text (optional)
                        </label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder='e.g. "$50,000 + annual bonus"'
                          value={formData.salaryDisplayText}
                          onChange={(e) => handleInputChange('salaryDisplayText', e.target.value)}
                        />
                        <span className={styles.hint}>
                          Leave empty to show the pay range you entered above
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Write */}
              {currentStep === 2 && (
                <div className={styles.stepContent}>
                  <h2 className={styles.stepTitle}>Job Details</h2>
                  <p className={styles.stepDescription}>
                    Describe the role and what makes it attractive to candidates.
                  </p>

                  {/* FR-W0: Company Name */}
                  <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Company Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        className={`${styles.input} ${errors.companyName ? styles.inputError : ''}`}
                        placeholder="Enter your company name"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      />
                      {errors.companyName && (
                        <span className={styles.errorText}>{errors.companyName}</span>
                      )}
                    </div>
                  </div>

                  {/* FR-W1: Job Description - Rich Text Editor */}
                  <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Job Description <span className={styles.required}>*</span>
                      </label>
                      <span className={styles.hint}>
                        Provide a detailed description of the role, responsibilities, and requirements
                      </span>
                      <textarea
                        className={`${styles.textarea} ${styles.richTextarea} ${errors.jobDescription ? styles.inputError : ''}`}
                        placeholder="Describe the role in detail. Include key responsibilities, day-to-day tasks, and what success looks like in this position..."
                        value={formData.jobDescription}
                        onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                        rows={12}
                      />
                      {errors.jobDescription && (
                        <span className={styles.errorText}>{errors.jobDescription}</span>
                      )}
                      <div className={styles.charCount}>
                        {formData.jobDescription.length} characters
                      </div>
                    </div>
                  </div>

                  {/* FR-W2: Job Summary */}
                  <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Job Summary <span className={styles.required}>*</span>
                      </label>
                      <span className={styles.hint}>
                        A short, compelling summary that appears in search results (150-200 characters recommended)
                      </span>
                      <textarea
                        className={`${styles.textarea} ${errors.jobSummary ? styles.inputError : ''}`}
                        placeholder="e.g., Join our AI team to build cutting-edge machine learning solutions that impact millions of users worldwide."
                        value={formData.jobSummary}
                        onChange={(e) => setFormData(prev => ({ ...prev, jobSummary: e.target.value }))}
                        rows={3}
                        maxLength={250}
                      />
                      {errors.jobSummary && (
                        <span className={styles.errorText}>{errors.jobSummary}</span>
                      )}
                      <div className={styles.charCount}>
                        {formData.jobSummary.length} / 250 characters
                      </div>
                    </div>
                  </div>

                  {/* FR-W3: Key Selling Points */}
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Key Selling Points</h3>
                    <p className={styles.sectionDescription}>
                      Highlight 3 key benefits or unique aspects that make this role attractive (optional)
                    </p>
                    
                    <div className={styles.sellingPointsGrid}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Selling Point 1</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g., Competitive salary + equity"
                          value={formData.keySellingPoint1}
                          onChange={(e) => setFormData(prev => ({ ...prev, keySellingPoint1: e.target.value }))}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Selling Point 2</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g., Work on cutting-edge AI projects"
                          value={formData.keySellingPoint2}
                          onChange={(e) => setFormData(prev => ({ ...prev, keySellingPoint2: e.target.value }))}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>Selling Point 3</label>
                        <input
                          type="text"
                          className={styles.input}
                          placeholder="e.g., Flexible remote work policy"
                          value={formData.keySellingPoint3}
                          onChange={(e) => setFormData(prev => ({ ...prev, keySellingPoint3: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* FR-W4: Company Branding - Optional */}
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Company Branding (Optional)</h3>
                    <p className={styles.sectionDescription}>
                      Upload your company logo and cover image to make your job ad stand out
                    </p>
                    
                    {/* Company Logo */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Company Logo</label>
                      <span className={styles.hint}>
                        Recommended: Square image, at least 200x200px (PNG, JPG, max 5MB)
                      </span>
                      
                      {!logoPreview ? (
                        <div className={styles.uploadArea}>
                          <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="logo-upload" className={styles.uploadLabel}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                              <path d="M24 16V32M16 24H32" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                              <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            <span className={styles.uploadText}>Click to upload logo</span>
                            <span className={styles.uploadHint}>or drag and drop</span>
                          </label>
                        </div>
                      ) : (
                        <div className={styles.imagePreview}>
                          <img src={logoPreview} alt="Logo preview" className={styles.logoPreviewImage} />
                          <button
                            type="button"
                            className={styles.removeImageBtn}
                            onClick={handleRemoveLogo}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      )}
                      {errors.companyLogo && (
                        <span className={styles.errorText}>{errors.companyLogo}</span>
                      )}
                    </div>

                    {/* Cover Image */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Cover Image</label>
                      <span className={styles.hint}>
                        Recommended: 1200x400px landscape image (PNG, JPG, max 5MB)
                      </span>
                      
                      {!coverPreview ? (
                        <div className={styles.uploadArea}>
                          <input
                            type="file"
                            id="cover-upload"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            style={{ display: 'none' }}
                          />
                          <label htmlFor="cover-upload" className={styles.uploadLabel}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                              <path d="M8 36L16 28L24 36L32 28L40 36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <rect x="6" y="6" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2"/>
                              <circle cx="18" cy="18" r="3" fill="currentColor"/>
                            </svg>
                            <span className={styles.uploadText}>Click to upload cover image</span>
                            <span className={styles.uploadHint}>or drag and drop</span>
                          </label>
                        </div>
                      ) : (
                        <div className={styles.imagePreview}>
                          <img src={coverPreview} alt="Cover preview" className={styles.coverPreviewImage} />
                          <button
                            type="button"
                            className={styles.removeImageBtn}
                            onClick={handleRemoveCover}
                          >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Remove
                          </button>
                        </div>
                      )}
                      {errors.companyCoverImage && (
                        <span className={styles.errorText}>{errors.companyCoverImage}</span>
                      )}
                    </div>
                  </div>

                  {/* FR-W5: Video Link (YouTube) - Optional */}
                  <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Video Link (Optional)</label>
                      <span className={styles.hint}>
                        Add a YouTube video link to showcase your company or role
                      </span>
                      <div className={styles.inputWithIcon}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={styles.inputIcon}>
                          <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M8 7L13 10L8 13V7Z" fill="currentColor"/>
                        </svg>
                        <input
                          type="url"
                          className={`${styles.input} ${styles.inputWithIconPadding} ${errors.videoLink ? styles.inputError : ''}`}
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={formData.videoLink}
                          onChange={(e) => setFormData(prev => ({ ...prev, videoLink: e.target.value }))}
                        />
                      </div>
                      {errors.videoLink && (
                        <span className={styles.errorText}>{errors.videoLink}</span>
                      )}
                      {formData.videoLink && !errors.videoLink && (
                        <div className={styles.videoPreviewHint}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13 4L6 11L3 8" stroke="#2ed573" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>Valid YouTube URL</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 & 4 - Keep existing implementation */}
              {/* Step 3: Screening & Filters */}
              {currentStep === 3 && (
                <div className={styles.stepContent}>
                  <h2 className={styles.stepTitle}>Screening & Filters</h2>
                  <p className={styles.stepDescription}>
                    Set up screening questions and work authorization requirements for applicants.
                  </p>

                  {/* FR-S1: Work Authorization by Country/Region */}
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Work Authorization Requirements</h3>
                    <p className={styles.sectionDescription}>
                      Select countries/regions and specify required work authorization status
                    </p>

                    {/* Countries/Regions Selection */}
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Countries/Regions</label>
                      <span className={styles.hint}>
                        Select all locations where candidates can work from
                      </span>
                      <div className={styles.countriesGrid}>
                        {COUNTRIES_REGIONS.map((country) => (
                          <label
                            key={country.value}
                            className={`${styles.countryCard} ${
                              formData.selectedCountries.includes(country.value) ? styles.countryCardActive : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.selectedCountries.includes(country.value)}
                              onChange={() => handleCountryToggle(country.value)}
                            />
                            <span className={styles.countryFlag}>{country.flag}</span>
                            <span className={styles.countryName}>{country.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Work Auth Options for Selected Countries */}
                    {formData.selectedCountries.map((country) => (
                      <div key={country} className={styles.workAuthSection}>
                        <h4 className={styles.workAuthTitle}>
                          {COUNTRIES_REGIONS.find(c => c.value === country)?.flag}{' '}
                          {country} - Work Authorization
                        </h4>
                        <p className={styles.workAuthDescription}>
                          Select ONE work authorization status that candidates must have
                        </p>
                        <div className={styles.workAuthOptions}>
                          {WORK_AUTH_OPTIONS[country as keyof typeof WORK_AUTH_OPTIONS]?.map((option, index) => (
                            <label
                              key={index}
                              className={`${styles.workAuthOption} ${
                                formData.workAuthByCountry[country] === option ? styles.workAuthOptionActive : ''
                              }`}
                            >
                              <input
                                type="radio"
                                name={`work-auth-${country}`}
                                checked={formData.workAuthByCountry[country] === option}
                                onChange={() => handleWorkAuthSelect(country, option)}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* FR-S2: System Screening Questions */}
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>System Screening Questions</h3>
                    <p className={styles.sectionDescription}>
                      Configure standard screening questions with requirement levels
                    </p>

                    {SYSTEM_SCREENING_QUESTIONS.map((question) => {
                      const answer = formData.systemScreeningAnswers.find(a => a.questionId === question.id);
                      
                      return (
                        <div key={question.id} className={styles.screeningQuestion}>
                          <h4 className={styles.questionTitle}>{question.question}</h4>
                          
                          {/* Requirement Level */}
                          <div className={styles.requirementToggle}>
                            {(['must-have', 'preferred', 'accept-any'] as AnswerRequirement[]).map((req) => (
                              <button
                                key={req}
                                type="button"
                                className={`${styles.requirementBtn} ${
                                  answer?.requirement === req ? styles.requirementBtnActive : ''
                                }`}
                                onClick={() => handleSystemScreeningChange(question.id, req, answer?.selectedAnswers || [])}
                              >
                                {req === 'must-have' && '⭐ Must Have'}
                                {req === 'preferred' && '✓ Preferred'}
                                {req === 'accept-any' && '○ Accept Any'}
                              </button>
                            ))}
                          </div>

                          {/* Answer Options */}
                          {question.type === 'multiple' && (
                            <div className={styles.answerOptions}>
                              {question.options.map((option) => (
                                <label key={option} className={styles.checkboxOption}>
                                  <input
                                    type="checkbox"
                                    checked={answer?.selectedAnswers.includes(option) || false}
                                    onChange={(e) => {
                                      const current = answer?.selectedAnswers || [];
                                      const newAnswers = e.target.checked
                                        ? [...current, option]
                                        : current.filter(a => a !== option);
                                      handleSystemScreeningChange(
                                        question.id,
                                        answer?.requirement || 'accept-any',
                                        newAnswers
                                      );
                                    }}
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {question.type === 'single' && (
                            <div className={styles.answerOptions}>
                              {question.options.map((option) => (
                                <label key={option} className={styles.radioOption}>
                                  <input
                                    type="radio"
                                    name={`question-${question.id}`}
                                    checked={answer?.selectedAnswers[0] === option}
                                    onChange={() => {
                                      handleSystemScreeningChange(
                                        question.id,
                                        answer?.requirement || 'accept-any',
                                        [option]
                                      );
                                    }}
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* FR-S3: Custom Screening Questions */}
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>Custom Screening Questions</h3>
                    <p className={styles.sectionDescription}>
                      Add your own custom questions to screen candidates
                    </p>

                    {/* Existing Custom Questions */}
                    {formData.customScreeningQuestions.map((question) => (
                      <div key={question.id} className={styles.customQuestionCard}>
                        <div className={styles.customQuestionHeader}>
                          <h4>{question.questionText}</h4>
                          <div className={styles.customQuestionActions}>
                            <button
                              type="button"
                              className={styles.editBtn}
                              onClick={() => handleEditCustomQuestion(question)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteCustomQuestion(question.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className={styles.customQuestionDetails}>
                          <span className={styles.questionBadge}>
                            Type: {question.answerType}
                          </span>
                          {question.mustAnswer && (
                            <span className={styles.questionBadge}>Required</span>
                          )}
                          {question.idealAnswer && (
                            <span className={styles.questionBadge}>Has Ideal Answer</span>
                          )}
                          {question.disqualifyIfNotIdeal && (
                            <span className={styles.questionBadge}>Auto-Disqualify</span>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add Question Button/Builder */}
                    {!showCustomQuestionBuilder && (
                      <button
                        type="button"
                        className={styles.addQuestionBtn}
                        onClick={() => setShowCustomQuestionBuilder(true)}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Add Custom Question
                      </button>
                    )}

                    {showCustomQuestionBuilder && (
                      <CustomQuestionBuilder
                        onSave={editingCustomQuestion ? handleUpdateCustomQuestion : handleAddCustomQuestion}
                        onCancel={() => {
                          setShowCustomQuestionBuilder(false);
                          setEditingCustomQuestion(null);
                        }}
                        initialQuestion={editingCustomQuestion}
                      />
                    )}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className={styles.stepContent}>
                  <h2 className={styles.stepTitle}>Review & Payment</h2>
                  <p className={styles.stepDescription}>
                    Review your job ad and proceed with payment.
                  </p>
                  <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Step 4 content (existing implementation)
                  </p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className={styles.formActions}>
                {currentStep > 1 && (
                  <button 
                    className={styles.btnSecondary}
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                {currentStep < STEPS.length ? (
                  <button 
                    className={styles.btnPrimary}
                    onClick={handleNext}
                  >
                    Continue
                  </button>
                ) : (
                  <button 
                    className={styles.btnPrimary}
                    onClick={handleSubmit}
                  >
                    Publish Job Ad
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
