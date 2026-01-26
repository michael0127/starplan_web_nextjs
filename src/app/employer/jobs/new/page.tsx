'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PageTransition } from '@/components/PageTransition';
import { CustomQuestionBuilder } from '@/components/CustomQuestionBuilder';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { useSession } from '@/hooks/useSession';
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
  GATE_REQUIREMENT_CONFIG,
  type AnswerRequirement,
  type CustomQuestionType,
  type SystemScreeningAnswer,
  type CustomScreeningQuestion,
} from '@/lib/screeningOptions';
import { getStripeProductConfig, formatCurrency } from '@/lib/stripeProducts';
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
  categories: string[]; // Multiple categories can be selected
  categorySkills: string[]; // Skills associated with the categories
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
  workAuthByCountry: Record<string, string[]>; // Country -> selected work auth options (multi-select)
  workAuthEnabled: boolean; // Whether work authorization screening is enabled
  systemScreeningAnswers: SystemScreeningAnswer[];
  customScreeningQuestions: CustomScreeningQuestion[];
  applicationDeadline: string;
}

function CreateJobAdForm() {
  const mounted = usePageAnimation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const stepParam = searchParams.get('step');
  const paymentStatus = searchParams.get('payment');
  const { session, loading: sessionLoading } = useSession(); // ✅ 使用缓存的 session
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam) : 1);
  const [isLoadingEdit, setIsLoadingEdit] = useState(!!editId);
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentJobPostingId, setCurrentJobPostingId] = useState<string | null>(editId);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPurchaseComplete, setIsPurchaseComplete] = useState(false);
  const [isAlreadyPaid, setIsAlreadyPaid] = useState(false);  // Track if job was already paid for
  
  // JD 文件上传状态
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdUploadStatus, setJdUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  const [jdUploadProgress, setJdUploadProgress] = useState(0);
  const [jdUploadError, setJdUploadError] = useState<string | null>(null);
  const [jdTaskId, setJdTaskId] = useState<string | null>(null);
  const jdFileInputRef = useRef<HTMLInputElement>(null);
  
  // 使用权限检查 hook
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/companies',
  });

  // 表单数据
  const [formData, setFormData] = useState<JobFormData>({
    jobTitle: '',
    categories: [],
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
    workAuthEnabled: true, // Work authorization screening enabled by default
    systemScreeningAnswers: [],
    customScreeningQuestions: [],
    applicationDeadline: '',
  });

  // Load job data for editing - optimized with useSession
  useEffect(() => {
    const loadEditData = async () => {
      if (!editId || !user || !session) return; // ✅ 使用缓存的 session
      
      setIsLoadingEdit(true);
      try {
        const response = await fetch(`/api/job-postings/${editId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        const data = await response.json();
        
        if (data.success) {
          const job = data.data;
          
          // Convert currency string back to object
          const currencyObj = CURRENCIES.find(c => c.code === job.currency) || CURRENCIES[0];
          
          setFormData({
            jobTitle: job.jobTitle,
            categories: job.categories,
            categorySkills: job.categorySkills,
            isCategoryManuallySelected: job.isCategoryManuallySelected,
            countryRegion: job.countryRegion,
            experienceLevel: job.experienceLevel,
            experienceYearsFrom: job.experienceYearsFrom,
            experienceYearsTo: job.experienceYearsTo === 'Unlimited' ? 'Unlimited' : parseInt(job.experienceYearsTo),
            workType: job.workType,
            payType: job.payType,
            currency: currencyObj,
            payFrom: job.payFrom,
            payTo: job.payTo,
            showSalaryOnAd: job.showSalaryOnAd,
            salaryDisplayText: job.salaryDisplayText || '',
            companyName: job.companyName,
            jobDescription: job.jobDescription,
            jobSummary: job.jobSummary,
            keySellingPoint1: job.keySellingPoint1 || '',
            keySellingPoint2: job.keySellingPoint2 || '',
            keySellingPoint3: job.keySellingPoint3 || '',
            companyLogo: job.companyLogo || '',
            companyCoverImage: job.companyCoverImage || '',
            videoLink: job.videoLink || '',
            selectedCountries: job.selectedCountries,
            workAuthByCountry: job.workAuthByCountry || {},
            // Infer workAuthEnabled from data: if there are selected countries or work auth options, assume enabled
            workAuthEnabled: job.selectedCountries?.length > 0 || Object.keys(job.workAuthByCountry || {}).length > 0,
            systemScreeningAnswers: (job.systemScreeningAnswers || []).map((a: SystemScreeningAnswer) => ({
              ...a,
              enabled: true, // All saved questions are enabled (disabled ones were not saved)
            })),
            customScreeningQuestions: job.customScreeningQuestions || [],
            applicationDeadline: job.applicationDeadline || '',
          });
          
          // Set previews for images
          if (job.companyLogo) setLogoPreview(job.companyLogo);
          if (job.companyCoverImage) setCoverPreview(job.companyCoverImage);
          
          // Check if job has already been paid for
          if (job.purchase && job.purchase.paymentStatus === 'SUCCEEDED') {
            setIsAlreadyPaid(true);
            setIsPurchaseComplete(true);  // Also mark purchase as complete
          }
        }
      } catch (error) {
        console.error('Error loading job data:', error);
      } finally {
        setIsLoadingEdit(false);
      }
    };
    
    loadEditData();
  }, [editId, user, session]); // ✅ 添加 session 依赖

  // Load company settings for new job postings (not edit mode)
  useEffect(() => {
    const loadCompanySettings = async () => {
      // Only load if it's a new job (not editing) and user is logged in
      if (editId || !user || !session) return;
      
      try {
        const response = await fetch('/api/employer/company', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
          const company = data.data;
          
          // Update form data with company settings as defaults
          setFormData(prev => {
            // Only set values that are currently empty
            const updates: Partial<typeof prev> = {};
            if (!prev.companyName && company.companyName) updates.companyName = company.companyName;
            if (!prev.companyLogo && company.companyLogo) updates.companyLogo = company.companyLogo;
            if (!prev.companyCoverImage && company.companyCoverImage) updates.companyCoverImage = company.companyCoverImage;
            if (!prev.videoLink && company.videoLink) updates.videoLink = company.videoLink;
            // Sync company description to jobSummary (Company Summary)
            if (!prev.jobSummary && company.description) updates.jobSummary = company.description;
            
            return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
          });
          
          // Set previews for images from company settings
          if (company.companyLogo) setLogoPreview(prev => prev || company.companyLogo);
          if (company.companyCoverImage) setCoverPreview(prev => prev || company.companyCoverImage);
        }
      } catch (error) {
        console.error('Error loading company settings:', error);
      }
    };
    
    loadCompanySettings();
  }, [editId, user, session]);

  // Job title 变化时触发智能推荐（不自动选择，需用户手动选择才能显示推荐的skills）
  useEffect(() => {
    if (formData.jobTitle && formData.jobTitle.trim().length > 0 && !editId) {
      const recommendations = getRecommendedCategories(formData.jobTitle);
      const categoryNames = recommendations.map(r => r.category);
      setRecommendedCategories(categoryNames);
      // 不再自动选择推荐的category，让用户手动选择
    } else {
      setRecommendedCategories([]);
    }
  }, [formData.jobTitle, editId]);

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

  // Handle payment cancellation
  useEffect(() => {
    if (paymentStatus === 'canceled') {
      setPurchaseError('Payment was canceled. You can try again when ready.');
      // Clear the payment status from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      window.history.replaceState({}, '', url.toString());
    }
  }, [paymentStatus]);

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

  // Step 3: 自动选择 Step 1 中的国家 + Remote
  // 当 countryRegion 改变时，重置 selectedCountries 只包含当前有效的国家
  useEffect(() => {
    if (currentStep === 3) {
      const validCountries = [formData.countryRegion, 'Remote'];
      
      setFormData(prev => {
        // 过滤掉不再有效的国家
        const filteredSelectedCountries = prev.selectedCountries.filter(country => 
          validCountries.includes(country)
        );
        
        // 如果当前国家还没选中，自动选中
        if (!filteredSelectedCountries.includes(formData.countryRegion)) {
          filteredSelectedCountries.push(formData.countryRegion);
        }
        
        // 清理 workAuthByCountry 中不再有效的国家
        const cleanedWorkAuthByCountry: Record<string, string[]> = {};
        for (const country of filteredSelectedCountries) {
          if (prev.workAuthByCountry[country]) {
            cleanedWorkAuthByCountry[country] = prev.workAuthByCountry[country];
          }
        }
        
        return {
          ...prev,
          selectedCountries: filteredSelectedCountries,
          workAuthByCountry: cleanedWorkAuthByCountry
        };
      });
    }
  }, [currentStep, formData.countryRegion]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/companies');
  };

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Real-time salary range validation
      if (field === 'payFrom' || field === 'payTo') {
        const from = parseFloat(field === 'payFrom' ? value : prev.payFrom);
        const to = parseFloat(field === 'payTo' ? value : prev.payTo);
        
        if (!isNaN(from) && !isNaN(to)) {
          if (from > to) {
            setErrors(prevErrors => ({
              ...prevErrors,
              payRange: 'Minimum salary must be ≤ Maximum salary'
            }));
          } else {
            // Clear payRange error when valid
            setErrors(prevErrors => {
              const { payRange, ...rest } = prevErrors;
              return rest;
            });
          }
        } else {
          // Clear error if either field is empty/invalid
          setErrors(prevErrors => {
            const { payRange, ...rest } = prevErrors;
            return rest;
          });
        }
      }
      
      // Real-time experience years validation
      if (field === 'experienceYearsFrom' || field === 'experienceYearsTo') {
        const from = field === 'experienceYearsFrom' ? value : prev.experienceYearsFrom;
        const to = field === 'experienceYearsTo' ? value : prev.experienceYearsTo;
        
        if (to !== 'Unlimited' && typeof from === 'number' && typeof to === 'number') {
          if (from > to) {
            setErrors(prevErrors => ({
              ...prevErrors,
              experienceYears: 'Minimum years must be ≤ Maximum years'
            }));
          } else {
            // Clear experienceYears error when valid
            setErrors(prevErrors => {
              const { experienceYears, ...rest } = prevErrors;
              return rest;
            });
          }
        } else {
          // Clear error if "Unlimited" is selected
          setErrors(prevErrors => {
            const { experienceYears, ...rest } = prevErrors;
            return rest;
          });
        }
      }
      
      return newData;
    });
    
    // Clear error for this field (except range fields which are handled above)
    const rangeFields = ['payFrom', 'payTo', 'experienceYearsFrom', 'experienceYearsTo'];
    if (errors[field] && !rangeFields.includes(field)) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData(prev => {
      const isSelected = prev.categories.includes(category);
      const newCategories = isSelected
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      
      // 收集所有选中 categories 的技能
      const allSkills = newCategories.flatMap(cat => getSkillsForCategory(cat));
      // 去重
      const uniqueSkills = Array.from(new Set(allSkills));
      
      return {
      ...prev,
        categories: newCategories,
        categorySkills: uniqueSkills,
      isCategoryManuallySelected: true
      };
    });
    setShowCustomInput(false);
    setCustomCategoryInput('');
    setIsEditingSkills(false);
    setEditedSkills([]);
  };

  const handleCustomCategorySubmit = () => {
    if (customCategoryInput.trim()) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, customCategoryInput.trim()],
        categorySkills: prev.categorySkills, // Keep existing skills
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

  // JD 文件上传处理
  const handleJdFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
        setJdUploadError('Only PDF and DOCX files are supported');
        return;
      }
      setJdFile(file);
      setJdUploadError(null);
      handleJdUpload(file);
    }
  };

  const handleJdFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx')) {
        setJdUploadError('Only PDF and DOCX files are supported');
        return;
      }
      setJdFile(file);
      setJdUploadError(null);
      handleJdUpload(file);
    }
  };

  const handleJdDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const fillFormFromJdData = (data: Record<string, unknown>) => {
    // 从 JD 分析结果填充表单
    setFormData(prev => {
      const updates: Partial<JobFormData> = {};
      
      // 直接映射字段
      if (data.jobTitle) updates.jobTitle = String(data.jobTitle);
      if (data.companyName) updates.companyName = String(data.companyName);
      if (data.jobDescription) updates.jobDescription = String(data.jobDescription);
      if (data.jobSummary) updates.jobSummary = String(data.jobSummary);
      if (data.keySellingPoint1) updates.keySellingPoint1 = String(data.keySellingPoint1);
      if (data.keySellingPoint2) updates.keySellingPoint2 = String(data.keySellingPoint2);
      if (data.keySellingPoint3) updates.keySellingPoint3 = String(data.keySellingPoint3);
      
      // 数组字段
      if (Array.isArray(data.categories) && data.categories.length > 0) {
        updates.categories = data.categories as string[];
        updates.isCategoryManuallySelected = true;
      }
      if (Array.isArray(data.categorySkills)) {
        updates.categorySkills = data.categorySkills as string[];
      }
      
      // 枚举字段 - 需要匹配现有选项
      if (data.countryRegion) {
        const country = String(data.countryRegion);
        const matchedCountry = COUNTRIES_REGIONS.find(c => c.value === country);
        if (matchedCountry) {
          updates.countryRegion = matchedCountry.value;
        }
      }
      
      if (data.experienceLevel) {
        const level = String(data.experienceLevel);
        const matchedLevel = EXPERIENCE_LEVELS.find(l => 
          l.level.toUpperCase() === level.toUpperCase() || 
          l.level === level
        );
        if (matchedLevel) {
          updates.experienceLevel = matchedLevel.level;
        }
      }
      
      if (data.experienceYearsFrom !== undefined) {
        updates.experienceYearsFrom = Number(data.experienceYearsFrom) || 0;
      }
      if (data.experienceYearsTo !== undefined) {
        const yearsTo = data.experienceYearsTo;
        if (yearsTo === 'Unlimited' || yearsTo === 'unlimited') {
          updates.experienceYearsTo = 'Unlimited';
        } else {
          updates.experienceYearsTo = Number(yearsTo) || 0;
        }
      }
      
      if (data.workType) {
        const workType = String(data.workType);
        const matchedType = WORK_TYPES.find(t => 
          t.toUpperCase().replace(/[_-]/g, '') === workType.toUpperCase().replace(/[_-]/g, '') ||
          t === workType
        );
        if (matchedType) {
          updates.workType = matchedType;
        }
      }
      
      if (data.payType) {
        const payType = String(data.payType);
        const matchedPayType = PAY_TYPES.find(p => 
          p.toUpperCase().replace(/[_\s]/g, '') === payType.toUpperCase().replace(/[_\s]/g, '') ||
          p === payType
        );
        if (matchedPayType) {
          updates.payType = matchedPayType;
        }
      }
      
      if (data.currency) {
        const currencyCode = String(data.currency).toUpperCase();
        const matchedCurrency = CURRENCIES.find(c => c.code.toUpperCase() === currencyCode);
        if (matchedCurrency) {
          updates.currency = matchedCurrency;
        }
      }
      
      if (data.payFrom) updates.payFrom = String(data.payFrom);
      if (data.payTo) updates.payTo = String(data.payTo);
      if (data.showSalaryOnAd !== undefined) updates.showSalaryOnAd = Boolean(data.showSalaryOnAd);
      
      return { ...prev, ...updates };
    });
  };

  const handleJdUpload = async (file: File) => {
    if (!session) {
      setJdUploadError('Please login to upload files');
      return;
    }
    
    setJdUploadStatus('uploading');
    setJdUploadProgress(10);
    setJdUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // 上传文件并启动分析任务
      const uploadResponse = await fetch('/api/employer/jd-upload?save_to_db=true&create_job_posting=true&create_as_draft=true&create_successful_payment=false', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      
      const uploadData = await uploadResponse.json();
      
      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'Failed to upload file');
      }
      
      setJdUploadProgress(30);
      setJdUploadStatus('analyzing');
      setJdTaskId(uploadData.taskId);
      
      // 轮询任务状态 - 两阶段：先等外层任务完成获取 batch_task_id，再轮询批量任务状态
      const pollInterval = 2000; // 2 秒
      const maxAttempts = 60; // 最多 2 分钟
      let attempts = 0;
      let batchTaskId: string | null = null;
      
      const pollStatus = async () => {
        attempts++;
        
        try {
          // 如果还没有 batch_task_id，先查询外层任务
          if (!batchTaskId) {
            const statusResponse = await fetch(`/api/tasks/${uploadData.taskId}`);
            const statusData = await statusResponse.json();
            
            if (!statusResponse.ok) {
              throw new Error(statusData.error || 'Failed to get task status');
            }
            
            // 模拟进度
            setJdUploadProgress(Math.min(50, 30 + attempts * 2));
            
            if (statusData.data?.ready) {
              // 外层任务完成，获取 batch_task_id
              if (statusData.data.result?.batch_task_id) {
                batchTaskId = statusData.data.result.batch_task_id;
                // 继续轮询批量任务
                setTimeout(pollStatus, pollInterval);
              } else {
                throw new Error('Failed to get batch task ID');
              }
            } else if (statusData.data?.status === 'FAILURE') {
              throw new Error(statusData.data.error || 'Task failed');
            } else if (attempts < maxAttempts) {
              setTimeout(pollStatus, pollInterval);
            } else {
              throw new Error('Analysis timeout');
            }
          } else {
            // 查询批量任务状态
            const batchResponse = await fetch(`/api/tasks/${batchTaskId}?batch=true`);
            const batchData = await batchResponse.json();
            
            if (!batchResponse.ok) {
              throw new Error(batchData.error || 'Failed to get batch status');
            }
            
            // 更新进度
            if (batchData.completed !== undefined && batchData.total) {
              setJdUploadProgress(50 + (batchData.completed / batchData.total) * 45);
            } else {
              setJdUploadProgress(Math.min(90, 50 + attempts * 2));
            }
            
            if (batchData.ready) {
              // 批量任务完成，获取第一个结果
              const firstResult = batchData.results?.[0];
              
              if (firstResult?.result?.success) {
                setJdUploadProgress(100);
                setJdUploadStatus('success');
                
                // 填充表单数据
                if (firstResult.result.data) {
                  fillFormFromJdData(firstResult.result.data);
                }
                
                // 如果创建了 JobPosting，保存 ID
                if (firstResult.result.job_posting_id) {
                  setCurrentJobPostingId(firstResult.result.job_posting_id);
                }
              } else {
                throw new Error(firstResult?.result?.error || firstResult?.error || 'Analysis failed');
              }
            } else if (attempts < maxAttempts) {
              setTimeout(pollStatus, pollInterval);
            } else {
              throw new Error('Analysis timeout');
            }
          }
        } catch (error) {
          setJdUploadStatus('error');
          setJdUploadError(error instanceof Error ? error.message : 'Analysis failed');
        }
      };
      
      // 开始轮询
      setTimeout(pollStatus, pollInterval);
      
    } catch (error) {
      setJdUploadStatus('error');
      setJdUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    }
  };

  const handleJdUploadReset = () => {
    setJdFile(null);
    setJdUploadStatus('idle');
    setJdUploadProgress(0);
    setJdUploadError(null);
    setJdTaskId(null);
    if (jdFileInputRef.current) {
      jdFileInputRef.current.value = '';
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    if (formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required';
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
      newErrors.jobSummary = 'Company summary is required';
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
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
    
    try {
      // Create a preview using object URL for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      
      // Get session for API call
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'logo');
      if (currentJobPostingId) {
        formData.append('jobPostingId', currentJobPostingId);
      }
      
      // Upload via API route
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload logo');
      }
      
      const data = await response.json();
      
      // Update form data with URL
      setFormData(prev => ({ ...prev, companyLogo: data.data.url }));
      
      // Clear error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.companyLogo;
        return newErrors;
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setErrors(prev => ({ 
        ...prev, 
        companyLogo: error instanceof Error ? error.message : 'Failed to upload logo'
      }));
      setLogoPreview('');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
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
    
    try {
      // Create a preview using object URL for immediate feedback
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
      
      // Get session for API call
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'cover');
      if (currentJobPostingId) {
        formData.append('jobPostingId', currentJobPostingId);
      }
      
      // Upload via API route
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload cover image');
      }
      
      const data = await response.json();
      
      // Update form data with URL
      setFormData(prev => ({ ...prev, companyCoverImage: data.data.url }));
      
      // Clear error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.companyCoverImage;
        return newErrors;
      });
    } catch (error) {
      console.error('Error uploading cover image:', error);
      setErrors(prev => ({ 
        ...prev, 
        companyCoverImage: error instanceof Error ? error.message : 'Failed to upload cover image'
      }));
      setCoverPreview('');
    }
  };

  const handleRemoveLogo = async () => {
    // If there's a URL stored, try to delete from storage via API
    if (formData.companyLogo && formData.companyLogo.includes('supabase')) {
      try {
        if (!session) {
          console.warn('No session available for deletion');
        } else {
          await fetch('/api/upload-image', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              url: formData.companyLogo,
              type: 'logo'
            }),
          });
        }
      } catch (error) {
        console.error('Error deleting logo from storage:', error);
      }
    }
    
    // Revoke object URL if it exists
    if (logoPreview && logoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview);
    }
    
    setLogoPreview('');
    setFormData(prev => ({ ...prev, companyLogo: '' }));
  };

  const handleRemoveCover = async () => {
    // If there's a URL stored, try to delete from storage via API
    if (formData.companyCoverImage && formData.companyCoverImage.includes('supabase')) {
      try {
        if (!session) {
          console.warn('No session available for deletion');
        } else {
          await fetch('/api/upload-image', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              url: formData.companyCoverImage,
              type: 'cover'
            }),
          });
        }
      } catch (error) {
        console.error('Error deleting cover from storage:', error);
      }
    }
    
    // Revoke object URL if it exists
    if (coverPreview && coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview);
    }
    
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
      // If adding, initialize with empty array
      const newWorkAuthByCountry = { ...prev.workAuthByCountry };
      if (!newSelectedCountries.includes(country)) {
        delete newWorkAuthByCountry[country];
      } else if (!newWorkAuthByCountry[country]) {
        newWorkAuthByCountry[country] = [];
      }
      
      return {
        ...prev,
        selectedCountries: newSelectedCountries,
        workAuthByCountry: newWorkAuthByCountry,
      };
    });
  };

  const handleWorkAuthToggle = (country: string, authOption: string) => {
    setFormData(prev => {
      const currentOptions = prev.workAuthByCountry[country] || [];
      const isSelected = currentOptions.includes(authOption);
      
      const newOptions = isSelected
        ? currentOptions.filter(opt => opt !== authOption)
        : [...currentOptions, authOption];
      
      return {
        ...prev,
        workAuthByCountry: {
          ...prev.workAuthByCountry,
          [country]: newOptions,
        },
      };
    });
  };

  // Page 3: System Screening handlers
  const handleSystemScreeningChange = (
    questionId: string,
    requirement: AnswerRequirement,
    answers: string[],
    enabled?: boolean
  ) => {
    setFormData(prev => {
      const existingIndex = prev.systemScreeningAnswers.findIndex(a => a.questionId === questionId);
      const newAnswers = [...prev.systemScreeningAnswers];
      
      if (existingIndex >= 0) {
        const existingEnabled = newAnswers[existingIndex].enabled;
        newAnswers[existingIndex] = { 
          questionId, 
          requirement, 
          selectedAnswers: answers,
          enabled: enabled !== undefined ? enabled : existingEnabled ?? true,
        };
      } else {
        newAnswers.push({ 
          questionId, 
          requirement, 
          selectedAnswers: answers,
          enabled: enabled !== undefined ? enabled : true,
        });
      }
      
      return {
        ...prev,
        systemScreeningAnswers: newAnswers,
      };
    });
  };

  // Toggle system screening question enabled state
  const handleToggleSystemQuestion = (questionId: string, enabled: boolean) => {
    setFormData(prev => {
      const existingIndex = prev.systemScreeningAnswers.findIndex(a => a.questionId === questionId);
      const newAnswers = [...prev.systemScreeningAnswers];
      
      if (existingIndex >= 0) {
        newAnswers[existingIndex] = { 
          ...newAnswers[existingIndex],
          enabled,
        };
      } else {
        // If question doesn't exist yet, create it with default values
        newAnswers.push({ 
          questionId, 
          requirement: 'accept-any' as AnswerRequirement, 
          selectedAnswers: [],
          enabled,
        });
      }
      
      return {
        ...prev,
        systemScreeningAnswers: newAnswers,
      };
    });
  };

  // Toggle work authorization screening
  const handleToggleWorkAuth = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      workAuthEnabled: enabled,
      // Clear work auth data if disabled
      ...(enabled ? {} : { selectedCountries: [], workAuthByCountry: {} }),
    }));
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

  // 保存职位（返回 job ID 或 null）
  const saveJobPosting = async (status: 'DRAFT' | 'PUBLISHED' = 'DRAFT'): Promise<string | null> => {
    try {
      if (!session) {
        throw new Error('Please login to save your job posting');
      }
      
      const payload = {
        ...formData,
        id: currentJobPostingId || undefined,
        currency: typeof formData.currency === 'object' ? formData.currency.code : formData.currency,
        status,
      };
      
      const response = await fetch('/api/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Server Error Response:', text);
        return null;
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.id) {
        // Update state
        if (!currentJobPostingId) {
          setCurrentJobPostingId(data.data.id);
        }
        // Return the job ID
        return data.data.id;
      }
      return null;
    } catch (error) {
      console.error('Error saving job posting:', error);
      return null;
    }
  };

  // Helper to prepare payload for API - filters disabled questions and handles workAuth
  const preparePayloadForApi = (status: 'DRAFT' | 'PUBLISHED') => {
    // Filter out disabled system screening answers
    const enabledSystemAnswers = formData.systemScreeningAnswers.filter(a => a.enabled !== false);
    
    // Only include work auth data if enabled
    const workAuthData = formData.workAuthEnabled 
      ? {
          selectedCountries: formData.selectedCountries,
          workAuthByCountry: formData.workAuthByCountry,
        }
      : {
          selectedCountries: [],
          workAuthByCountry: {},
        };

    return {
      ...formData,
      id: editId || undefined,
      currency: typeof formData.currency === 'object' ? formData.currency.code : formData.currency,
      status,
      // Override with filtered/conditional data
      systemScreeningAnswers: enabledSystemAnswers,
      ...workAuthData,
    };
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // ✅ 使用缓存的 session，无需重新获取
      if (!session) {
        throw new Error('Please login to save your job posting');
      }
      
      const payload = preparePayloadForApi('DRAFT');
      
      const response = await fetch('/api/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      
      // Check if response is ok
      if (!response.ok) {
        const text = await response.text();
        console.error('Server Error Response:', text);
        throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update currentJobPostingId if this is a new job posting
        if (data.data?.id && !currentJobPostingId) {
          setCurrentJobPostingId(data.data.id);
        }
        setSaveMessage({ type: 'success', text: 'Draft saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        // Log detailed error for debugging
        console.error('API Error:', data);
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to save draft';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to save draft'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 发布职位
  const handlePublish = async () => {
    // 最终验证
    if (!validateStep1() || !validateStep2()) {
      setSaveMessage({ type: 'error', text: 'Please complete all required fields' });
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // ✅ 使用缓存的 session，无需重新获取
      if (!session) {
        throw new Error('Please login to publish your job posting');
      }
      
      const payload = preparePayloadForApi('PUBLISHED');
      
      const response = await fetch('/api/job-postings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      
      // Check if response is ok
      if (!response.ok) {
        const text = await response.text();
        console.error('Server Error Response:', text);
        throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update currentJobPostingId if this is a new job posting
        if (data.data?.id && !currentJobPostingId) {
          setCurrentJobPostingId(data.data.id);
        }
        setSaveMessage({ type: 'success', text: 'Job posted successfully!' });
        // 跳转到 jobs 页面
        setTimeout(() => {
          router.push('/employer/jobs');
        }, 1500);
      } else {
        // Log detailed error for debugging
        console.error('API Error:', data);
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to publish job';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error publishing job:', error);
      setSaveMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to publish job'
      });
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    await handlePublish();
  };

  if (loading || !isEmployer || sessionLoading || isLoadingEdit) {
    return (
      <PageTransition>
        <div className={styles.container}>
          <div className={styles.loading}>
            {isLoadingEdit ? 'Loading job data...' : sessionLoading ? 'Initializing...' : 'Loading...'}
          </div>
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

                  {/* JD 文件上传区域 - 仅在非编辑模式下显示 */}
                  {!editId && (
                    <div className={styles.jdUploadSection}>
                      <div className={styles.jdUploadHeader}>
                        <div className={styles.jdUploadIcon}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                          </svg>
                        </div>
                        <div className={styles.jdUploadTitle}>
                          <h3>Upload your JD file to auto-fill</h3>
                          <span className={styles.optionalBadge}>Optional</span>
                        </div>
                      </div>
                      <p className={styles.jdUploadDescription}>
                        Upload a PDF or DOCX file and our AI will extract the job details to pre-fill the form for you.
                      </p>
                      
                      {jdUploadStatus === 'idle' && (
                        <div 
                          className={styles.jdDropzone}
                          onDrop={handleJdFileDrop}
                          onDragOver={handleJdDragOver}
                          onClick={() => jdFileInputRef.current?.click()}
                        >
                          <input
                            ref={jdFileInputRef}
                            type="file"
                            accept=".pdf,.docx"
                            onChange={handleJdFileSelect}
                            className={styles.hiddenInput}
                          />
                          <div className={styles.dropzoneIcon}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </div>
                          <p className={styles.dropzoneText}>
                            <span className={styles.dropzoneHighlight}>Click to upload</span> or drag and drop
                          </p>
                          <p className={styles.dropzoneHint}>PDF or DOCX (max 10MB)</p>
                        </div>
                      )}
                      
                      {(jdUploadStatus === 'uploading' || jdUploadStatus === 'analyzing') && (
                        <div className={styles.jdProgressContainer}>
                          <div className={styles.jdProgressHeader}>
                            <div className={styles.jdFileName}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span>{jdFile?.name}</span>
                            </div>
                            <span className={styles.jdProgressPercent}>{Math.round(jdUploadProgress)}%</span>
                          </div>
                          <div className={styles.jdProgressBar}>
                            <div 
                              className={styles.jdProgressFill} 
                              style={{ width: `${jdUploadProgress}%` }}
                            />
                          </div>
                          <p className={styles.jdProgressStatus}>
                            {jdUploadStatus === 'uploading' ? 'Uploading...' : 'Analyzing your JD file with AI...'}
                          </p>
                        </div>
                      )}
                      
                      {jdUploadStatus === 'success' && (
                        <div className={styles.jdSuccessContainer}>
                          <div className={styles.jdSuccessIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                          </div>
                          <div className={styles.jdSuccessText}>
                            <h4>JD analyzed successfully!</h4>
                            <p>Form fields have been pre-filled. Review and edit as needed.</p>
                          </div>
                          <button 
                            type="button"
                            className={styles.jdUploadAgainBtn}
                            onClick={handleJdUploadReset}
                          >
                            Upload different file
                          </button>
                        </div>
                      )}
                      
                      {jdUploadStatus === 'error' && (
                        <div className={styles.jdErrorContainer}>
                          <div className={styles.jdErrorIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="15" y1="9" x2="9" y2="15" />
                              <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                          </div>
                          <div className={styles.jdErrorText}>
                            <h4>Analysis failed</h4>
                            <p>{jdUploadError || 'Something went wrong. Please try again.'}</p>
                          </div>
                          <button 
                            type="button"
                            className={styles.jdRetryBtn}
                            onClick={handleJdUploadReset}
                          >
                            Try again
                          </button>
                        </div>
                      )}
                      
                      <div className={styles.jdDivider}>
                        <span>OR fill in manually</span>
                      </div>
                    </div>
                  )}

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
                            <label
                              key={cat}
                              className={`${styles.categoryCard} ${
                                formData.categories.includes(cat) ? styles.categoryCardActive : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.categories.includes(cat)}
                                onChange={() => handleCategorySelect(cat)}
                                style={{ marginRight: '8px' }}
                              />
                              <span>{cat}</span>
                            </label>
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
                        {/* Category multiselect with collapsible scroll */}
                        <div className={styles.categoryDropdownWrapper}>
                          {/* Collapsed single-line view */}
                          {!isCategoryExpanded ? (
                            <div 
                              className={styles.categoryCollapsed}
                              onClick={toggleCategoryExpand}
                            >
                              <div className={`${styles.select} ${errors.categories ? styles.inputError : ''}`}>
                                {formData.categories.length === 0 ? (
                                  <span style={{ color: '#999' }}>Select categories or create custom...</span>
                                ) : (
                                  <span>{formData.categories.length} categor{formData.categories.length === 1 ? 'y' : 'ies'} selected</span>
                                )}
                              </div>
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
                                <span>Select categories (scrollable list, multiple selection)</span>
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
                              <div className={`${styles.scrollableSelect} ${errors.categories ? styles.inputError : ''}`}>
                                {allCategories.map((cat) => (
                                  <label key={cat} className={styles.categoryOption}>
                                    <input
                                      type="checkbox"
                                      checked={formData.categories.includes(cat)}
                                      onChange={() => handleCategorySelect(cat)}
                                    />
                                    <span>{cat}</span>
                                  </label>
                                ))}
                                <div className={styles.categoryOption} style={{ borderTop: '2px solid #e0e0e0', marginTop: '8px', paddingTop: '8px' }}>
                                  <button
                                    type="button"
                                    className={styles.btnSecondary}
                                    onClick={() => {
                                      setShowCustomInput(true);
                                      setIsCategoryExpanded(false);
                                    }}
                                    style={{ width: '100%' }}
                                  >
                                    ➕ Create Custom Category
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Show current custom categories and selected categories */}
                        {formData.categories.length > 0 && (
                          <div className={styles.selectedCategoriesWrapper}>
                            <label className={styles.label}>Selected Categories:</label>
                            <div className={styles.selectedCategoriesList}>
                              {formData.categories.map((cat) => (
                                <div key={cat} className={styles.customCategoryBadge}>
                                  {!allCategories.includes(cat) && (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                                  )}
                                  <span>{!allCategories.includes(cat) ? `Custom: ${cat}` : cat}</span>
                            <button
                              type="button"
                              className={styles.removeCustomBtn}
                                    onClick={() => handleCategorySelect(cat)}
                                    title="Remove category"
                            >
                              ×
                            </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {errors.categories && (
                          <span className={styles.errorText}>{errors.categories}</span>
                        )}
                        <span className={styles.hint}>
                          Select from 115 predefined categories or create your own custom category
                        </span>
                      </>
                    )}
                    
                    {/* Skills display/edit section */}
                    {formData.categories.length > 0 && (
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
                        max={formData.experienceYearsTo !== 'Unlimited' ? formData.experienceYearsTo : undefined}
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
                          min={formData.experienceYearsFrom}
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
                        max={formData.payTo && !isNaN(parseFloat(formData.payTo)) ? parseFloat(formData.payTo) : undefined}
                        className={`${styles.input} ${errors.payRange ? styles.inputError : ''}`}
                        placeholder="Min"
                        value={formData.payFrom}
                        onChange={(e) => handleInputChange('payFrom', e.target.value)}
                      />
                      <span className={styles.salaryDivider}>to</span>
                      <input
                        type="number"
                        min={formData.payFrom && !isNaN(parseFloat(formData.payFrom)) ? parseFloat(formData.payFrom) : 0}
                        className={`${styles.input} ${errors.payRange ? styles.inputError : ''}`}
                        placeholder="Max"
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

                  {/* FR-W2: Company Summary - synced from Settings > About Your Company */}
                  <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Company Summary <span className={styles.required}>*</span>
                      </label>
                      <span className={styles.hint}>
                        This is synced from Settings → About Your Company. You can edit it here for this job posting.
                      </span>
                      <textarea
                        className={`${styles.textarea} ${errors.jobSummary ? styles.inputError : ''}`}
                        placeholder="Share your company's mission, culture, and what makes it a great place to work..."
                        value={formData.jobSummary}
                        onChange={(e) => setFormData(prev => ({ ...prev, jobSummary: e.target.value }))}
                        rows={3}
                        maxLength={2000}
                      />
                      {errors.jobSummary && (
                        <span className={styles.errorText}>{errors.jobSummary}</span>
                      )}
                      <div className={styles.charCount}>
                        {formData.jobSummary.length} / 2000 characters
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

                  {/* FR-S1: Work Authorization Screening (Optional Module) */}
                  <div className={`${styles.formSection} ${!formData.workAuthEnabled ? styles.formSectionDisabled : ''}`}>
                    <div className={styles.sectionHeader}>
                      <div className={styles.sectionTitleRow}>
                        <h3 className={styles.sectionTitle}>
                          <span className={styles.screeningBadge}>Screening</span>
                          Work Authorization Requirements
                        </h3>
                        <label className={styles.masterToggle}>
                          <input
                            type="checkbox"
                            checked={formData.workAuthEnabled}
                            onChange={(e) => handleToggleWorkAuth(e.target.checked)}
                          />
                          <span className={styles.toggleSlider}></span>
                          <span className={styles.toggleLabel}>
                            {formData.workAuthEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      </div>
                      <p className={styles.sectionDescription}>
                        {formData.workAuthEnabled 
                          ? 'Screen candidates based on their work authorization status for specific countries/regions.'
                          : 'Work authorization screening is disabled. Enable to filter candidates by work authorization status.'}
                      </p>
                    </div>

                    {formData.workAuthEnabled && (
                      <>
                        {/* Countries/Regions Selection */}
                        <div className={styles.formGroup}>
                          <label className={styles.label}>Countries/Regions</label>
                          <span className={styles.hint}>
                            Based on your job location selection in Step 1
                          </span>
                          <div className={styles.countriesGrid}>
                            {COUNTRIES_REGIONS
                              .filter(country => 
                                country.value === formData.countryRegion || country.value === 'Remote'
                              )
                              .map((country) => (
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
                              Select work authorization status(es) that candidates must have (multi-select)
                            </p>
                            <div className={styles.workAuthOptions}>
                              {WORK_AUTH_OPTIONS[country as keyof typeof WORK_AUTH_OPTIONS]?.map((option, index) => (
                                <label
                                  key={index}
                                  className={`${styles.workAuthOption} ${
                                    (formData.workAuthByCountry[country] || []).includes(option) ? styles.workAuthOptionActive : ''
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={(formData.workAuthByCountry[country] || []).includes(option)}
                                    onChange={() => handleWorkAuthToggle(country, option)}
                                  />
                                  <span>{option}</span>
                                </label>
                              ))}
                            </div>
                            {(formData.workAuthByCountry[country] || []).length > 0 && (
                              <div className={styles.selectedAuthCount}>
                                {(formData.workAuthByCountry[country] || []).length} option(s) selected
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>

                  {/* FR-S2: System Screening Questions */}
                  <div className={styles.formSection}>
                    <h3 className={styles.sectionTitle}>System Screening Questions</h3>
                    <p className={styles.sectionDescription}>
                      Configure standard screening questions with requirement levels. Toggle questions on/off to include them in screening.
                    </p>

                    {SYSTEM_SCREENING_QUESTIONS.map((question) => {
                      const answer = formData.systemScreeningAnswers.find(a => a.questionId === question.id);
                      const isEnabled = answer?.enabled ?? true;
                      const currentRequirement = answer?.requirement || 'accept-any';
                      
                      return (
                        <div 
                          key={question.id} 
                          className={`${styles.screeningQuestion} ${!isEnabled ? styles.screeningQuestionDisabled : ''}`}
                        >
                          {/* Question Header with Enable Toggle */}
                          <div className={styles.questionHeader}>
                            <label className={styles.questionEnableToggle}>
                              <input
                                type="checkbox"
                                checked={isEnabled}
                                onChange={(e) => handleToggleSystemQuestion(question.id, e.target.checked)}
                              />
                              <span className={styles.toggleSlider}></span>
                            </label>
                            <h4 className={styles.questionTitle}>{question.question}</h4>
                          </div>

                          {/* Answer Options - Only show when enabled */}
                          {isEnabled && (
                            <>
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
                                          currentRequirement,
                                          newAnswers,
                                          isEnabled
                                        );
                                      }}
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                              
                              {(answer?.selectedAnswers?.length || 0) > 0 && (
                                <div className={styles.selectedAuthCount}>
                                  {answer?.selectedAnswers.length} option(s) selected
                                </div>
                              )}

                              {/* Requirement Level - Now below options */}
                              <div className={styles.gateSection}>
                                <label className={styles.gateLabel}>Requirement Level (Gate)</label>
                                <div className={styles.requirementToggle}>
                                  {(['must-have', 'preferred', 'accept-any'] as AnswerRequirement[]).map((req) => (
                                    <button
                                      key={req}
                                      type="button"
                                      className={`${styles.requirementBtn} ${
                                        currentRequirement === req ? styles.requirementBtnActive : ''
                                      } ${styles[`requirementBtn${req.replace('-', '')}`] || ''}`}
                                      onClick={() => handleSystemScreeningChange(question.id, req, answer?.selectedAnswers || [], isEnabled)}
                                    >
                                      {GATE_REQUIREMENT_CONFIG[req].label}
                                    </button>
                                  ))}
                                </div>
                                
                                {/* Gate Explanation */}
                                <div className={styles.gateExplanation}>
                                  <span className={styles.gateExplanationIcon}>ℹ️</span>
                                  <div className={styles.gateExplanationText}>
                                    <strong>{GATE_REQUIREMENT_CONFIG[currentRequirement].shortLabel}:</strong>{' '}
                                    {GATE_REQUIREMENT_CONFIG[currentRequirement].description}
                                    <span className={styles.gateImpact}>
                                      {GATE_REQUIREMENT_CONFIG[currentRequirement].impactText}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {/* Disabled state message */}
                          {!isEnabled && (
                            <div className={styles.disabledMessage}>
                              This question is disabled and will not be included in screening.
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
                    Review your job posting and complete payment to publish.
                  </p>
                  
                  <div className={styles.paymentContainer}>
                    {/* Left: Job Review */}
                    <div className={styles.reviewSection}>
                      <div className={styles.reviewHeader}>
                        <h3>Review Your Job Posting</h3>
                      </div>

                      <div className={styles.reviewCard}>
                        <div className={styles.jobHeader}>
                          <h4>{formData.jobTitle}</h4>
                          <p className={styles.companyName}>{formData.companyName}</p>
                        </div>

                        <div className={styles.jobDetails}>
                          <div className={styles.detailRow}>
                            <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                            <span className={styles.detailLabel}>Location</span>
                            <span className={styles.detailValue}>{formData.countryRegion}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>
                            <span className={styles.detailLabel}>Work Type</span>
                            <span className={styles.detailValue}>{formData.workType}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                            <span className={styles.detailLabel}>Experience</span>
                            <span className={styles.detailValue}>{formData.experienceLevel}</span>
                          </div>
                          <div className={styles.detailRow}>
                            <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                            <span className={styles.detailLabel}>Salary</span>
                            <span className={styles.detailValue}>
                              {formData.showSalaryOnAd 
                                ? `${formData.currency.symbol}${formData.payFrom} - ${formData.currency.symbol}${formData.payTo}`
                                : formData.salaryDisplayText || 'Not disclosed'}
                            </span>
                          </div>
                          {formData.categories.length > 0 && (
                            <div className={styles.detailRow}>
                              <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                              <span className={styles.detailLabel}>Categories</span>
                              <span className={styles.detailValue}>
                                {formData.categories.join(', ')}
                              </span>
                            </div>
                          )}
                          {formData.applicationDeadline && (
                            <div className={styles.detailRow}>
                              <svg className={styles.detailIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                              <span className={styles.detailLabel}>Deadline</span>
                              <span className={styles.detailValue}>
                                {new Date(formData.applicationDeadline).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Company Summary */}
                        {formData.jobSummary && (
                          <div className={styles.reviewSubSection}>
                            <div className={styles.reviewSubHeader}>
                              <svg className={styles.reviewSubIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <path d="M3 9h18" />
                                <path d="M9 21V9" />
                              </svg>
                              <h5>Company Summary</h5>
                            </div>
                            <p className={styles.reviewSummaryText}>{formData.jobSummary}</p>
                          </div>
                        )}

                        {/* Skills */}
                        {formData.categorySkills.length > 0 && (
                          <div className={styles.reviewSubSection}>
                            <div className={styles.reviewSubHeader}>
                              <svg className={styles.reviewSubIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              <h5>Required Skills</h5>
                            </div>
                            <div className={styles.reviewSkillsTags}>
                              {formData.categorySkills.map((skill, index) => (
                                <span key={index} className={styles.reviewSkillTag}>{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Selling Points */}
                        {(formData.keySellingPoint1 || formData.keySellingPoint2 || formData.keySellingPoint3) && (
                          <div className={styles.reviewSubSection}>
                            <div className={styles.reviewSubHeader}>
                              <svg className={styles.reviewSubIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                              <h5>Key Highlights</h5>
                            </div>
                            <ul className={styles.reviewHighlightsList}>
                              {formData.keySellingPoint1 && <li>{formData.keySellingPoint1}</li>}
                              {formData.keySellingPoint2 && <li>{formData.keySellingPoint2}</li>}
                              {formData.keySellingPoint3 && <li>{formData.keySellingPoint3}</li>}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment */}
                    <div className={styles.paymentSection}>
                      {isAlreadyPaid ? (
                        // Already paid - allow direct update
                        <div className={styles.pricingCard}>
                          <div className={styles.pricingHeader}>
                            <h3>Already Paid</h3>
                            <span className={styles.badge} style={{ background: '#10b981' }}>
                              Payment Complete
                            </span>
                          </div>

                          <div className={styles.alreadyPaidInfo}>
                            <div className={styles.successIcon} style={{ 
                              width: 64, 
                              height: 64, 
                              background: '#10b981', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              margin: '0 auto 16px'
                            }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                            <p style={{ textAlign: 'center', color: '#555', marginBottom: 24 }}>
                              This job posting has already been paid for. You can update and publish without additional payment.
                            </p>
                          </div>

                          <div className={styles.features}>
                            <h4>Your package includes:</h4>
                            <ul>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> 30 days of visibility</li>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Unlimited applications</li>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Advanced screening tools</li>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Candidate matching</li>
                            </ul>
                          </div>

                          {purchaseError && (
                            <div className={styles.errorMessage}>
                              <p>{purchaseError}</p>
                            </div>
                          )}

                          <button
                            className={styles.purchaseButton}
                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            onClick={async () => {
                              setPurchaseLoading(true);
                              setPurchaseError(null);
                              
                              try {
                                // Save and publish directly without payment
                                const savedId = await saveJobPosting('PUBLISHED');
                                if (savedId) {
                                  router.push('/employer/jobs?success=true&job=' + savedId);
                                } else {
                                  throw new Error('Failed to save job posting');
                                }
                              } catch (err) {
                                console.error('Update error:', err);
                                setPurchaseError(err instanceof Error ? err.message : 'Failed to update job posting');
                                setPurchaseLoading(false);
                              }
                            }}
                            disabled={purchaseLoading}
                          >
                            {purchaseLoading ? (
                              <>
                                <span className={styles.spinner}></span>
                                Updating...
                              </>
                            ) : (
                              <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Update & Publish
                              </>
                            )}
                          </button>

                          <div className={styles.securePayment}>
                            <svg className={styles.shieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            <span>No additional payment required</span>
                          </div>
                        </div>
                      ) : !isPurchaseComplete ? (
                        <div className={styles.pricingCard}>
                          <div className={styles.pricingHeader}>
                            <h3>Complete Payment</h3>
                            <span className={styles.badge}>
                              {['Intern', 'Junior'].includes(formData.experienceLevel) 
                                ? 'Junior Package' 
                                : 'Senior Package'}
                            </span>
                          </div>

                          <div className={styles.priceDisplay}>
                            <div className={styles.priceAmount}>
                              {formatCurrency(
                                getStripeProductConfig(formData.experienceLevel).amount,
                                getStripeProductConfig(formData.experienceLevel).currency
                              )}
                            </div>
                            <div className={styles.priceLabel}>one-time payment</div>
                          </div>

                          <div className={styles.packageInfo}>
                            <p className={styles.packageNote}>
                              {['Intern', 'Junior'].includes(formData.experienceLevel)
                                ? 'Perfect for entry-level positions'
                                : 'Ideal for experienced professionals'}
                  </p>
                </div>

                          <div className={styles.features}>
                            <h4>What's included:</h4>
                            <ul>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> 30 days of visibility</li>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Unlimited applications</li>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Advanced screening tools</li>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Candidate matching</li>
                              <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Email notifications</li>
                              {!['Intern', 'Junior'].includes(formData.experienceLevel) && (
                                <>
                                  <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Featured placement</li>
                                  <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Priority support</li>
                                  <li><svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> Enhanced analytics</li>
                                </>
                              )}
                            </ul>
                          </div>

                          <div className={styles.pricingBreakdown}>
                            <div className={styles.breakdownRow}>
                              <span>Job Posting Package</span>
                              <span>{formatCurrency(
                                getStripeProductConfig(formData.experienceLevel).amount,
                                getStripeProductConfig(formData.experienceLevel).currency
                              )}</span>
                            </div>
                            <div className={styles.breakdownRow}>
                              <span>Platform Fee</span>
                              <span>Included</span>
                            </div>
                            <div className={styles.breakdownTotal}>
                              <span>Total</span>
                              <span>{formatCurrency(
                                getStripeProductConfig(formData.experienceLevel).amount,
                                getStripeProductConfig(formData.experienceLevel).currency
                              )}</span>
                            </div>
                          </div>

                          {purchaseError && (
                            <div className={styles.errorMessage}>
                              <p>{purchaseError}</p>
                            </div>
                          )}

                          <button
                            className={styles.purchaseButton}
                            onClick={async () => {
                              setPurchaseLoading(true);
                              setPurchaseError(null);
                              
                              try {
                                // First save the job posting if not already saved
                                let jobId = currentJobPostingId;
                                if (!jobId) {
                                  jobId = await saveJobPosting('DRAFT');
                                  if (!jobId) {
                                    throw new Error('Failed to save job posting');
                                  }
                                }

                                // Create checkout session
                                const token = session?.access_token;
                                if (!token) {
                                  throw new Error('Not authenticated');
                                }

                                const response = await fetch(`/api/job-postings/${jobId}/purchase`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({
                                    successUrl: `${window.location.origin}/employer/jobs?success=true&job=${jobId}`,
                                    cancelUrl: `${window.location.origin}/employer/jobs/new?edit=${jobId}&step=4&payment=canceled`,
                                  }),
                                });

                                if (!response.ok) {
                                  const errorData = await response.json();
                                  throw new Error(errorData.error || 'Failed to create checkout session');
                                }

                                const data = await response.json();

                                // Redirect to Stripe Checkout
                                if (data.sessionUrl) {
                                  window.location.href = data.sessionUrl;
                                } else {
                                  throw new Error('No checkout URL returned');
                                }
                              } catch (err) {
                                console.error('Purchase error:', err);
                                setPurchaseError(err instanceof Error ? err.message : 'Failed to process purchase');
                                setPurchaseLoading(false);
                              }
                            }}
                            disabled={purchaseLoading}
                          >
                            {purchaseLoading ? (
                              <>
                                <span className={styles.spinner}></span>
                                Processing...
                              </>
                            ) : (
                              <>
                                <svg className={styles.lockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                                Proceed to Payment
                              </>
                            )}
                          </button>

                          <div className={styles.securePayment}>
                            <svg className={styles.shieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            <span>Secure payment powered by Stripe</span>
                          </div>
                        </div>
                      ) : (
                        <div className={styles.successCard}>
                          <div className={styles.successIcon}>✓</div>
                          <h3>Payment Successful!</h3>
                          <p>Your job posting has been published.</p>
                          <button
                            className={styles.btnPrimary}
                            onClick={() => router.push('/employer/jobs')}
                          >
                            View My Jobs
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Save Message */}
              {saveMessage && (
                <div className={`${styles.saveMessage} ${
                  saveMessage.type === 'success' ? styles.saveMessageSuccess : styles.saveMessageError
                }`}>
                  {saveMessage.type === 'success' ? '✓' : '✕'} {saveMessage.text}
                </div>
              )}

              {/* Navigation Buttons - Hidden on Step 4 (Payment) */}
              {currentStep !== 4 && (
              <div className={styles.formActions}>
                <div className={styles.leftActions}>
                {currentStep > 1 && (
                  <button 
                    className={styles.btnSecondary}
                    onClick={handleBack}
                      disabled={isSaving}
                  >
                    Back
                  </button>
                )}
                </div>
                
                <div className={styles.rightActions}>
                  {/* Save Draft Button - Always visible */}
                  <button 
                    className={styles.btnSecondary}
                    onClick={handleSaveDraft}
                    disabled={isSaving || !formData.jobTitle || formData.categories.length === 0}
                    title="Save current progress as draft"
                  >
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </button>
                  
                {currentStep < STEPS.length ? (
                  <button 
                    className={styles.btnPrimary}
                    onClick={handleNext}
                      disabled={isSaving}
                  >
                    Continue
                  </button>
                ) : (
                  <button 
                    className={styles.btnPrimary}
                    onClick={handleSubmit}
                      disabled={isSaving}
                  >
                      {isSaving ? 'Publishing...' : 'Publish Job Ad'}
                  </button>
                )}
                </div>
              </div>
              )}
              
              {/* Step 4: Back button only */}
              {currentStep === 4 && (
                <div className={styles.formActions}>
                  <button 
                    className={styles.btnSecondary}
                    onClick={handleBack}
                    disabled={purchaseLoading}
                  >
                    ← Back to Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

// Wrapper component with Suspense for useSearchParams
export default function CreateJobAd() {
  return (
    <Suspense fallback={
      <PageTransition>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh' 
        }}>
          <div>Loading...</div>
        </div>
      </PageTransition>
    }>
      <CreateJobAdForm />
    </Suspense>
  );
}
