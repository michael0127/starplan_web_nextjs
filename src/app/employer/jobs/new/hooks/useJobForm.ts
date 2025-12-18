import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CURRENCIES } from '@/lib/jobConstants';
import type { Currency } from '@/lib/jobConstants';

// 表单数据类型
export interface JobFormData {
  // Step 1: Classify
  jobTitle: string;
  categories: string[];
  categorySkills: string[];
  isCategoryManuallySelected: boolean;
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
  selectedCountries: string[];
  workAuthByCountry: Record<string, string>;
  systemScreeningAnswers: any[];
  customScreeningQuestions: any[];
  applicationDeadline: string;
}

const initialFormData: JobFormData = {
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
  currency: CURRENCIES[0],
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
};

export function useJobForm(editId?: string | null) {
  const router = useRouter();
  const [formData, setFormData] = useState<JobFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update form field
  const updateField = useCallback(<K extends keyof JobFormData>(
    field: K,
    value: JobFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update multiple fields at once
  const updateFields = useCallback((updates: Partial<JobFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  // Set entire form data (for edit mode)
  const setFormDataComplete = useCallback((data: JobFormData) => {
    setFormData(data);
  }, []);

  // Save as draft
  const saveAsDraft = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please login to save your job posting');
      }
      
      const payload = {
        ...formData,
        id: editId || undefined,
        currency: typeof formData.currency === 'object' ? formData.currency.code : formData.currency,
        status: 'DRAFT' as const,
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
        throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Draft saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
        return data.data.id;
      } else {
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
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [formData, editId]);

  // Publish job
  const publishJob = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please login to publish your job posting');
      }
      
      const payload = {
        ...formData,
        id: editId || undefined,
        currency: typeof formData.currency === 'object' ? formData.currency.code : formData.currency,
        status: 'PUBLISHED' as const,
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
        throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSaveMessage({ type: 'success', text: 'Job posted successfully!' });
        setTimeout(() => {
          router.push('/employer/jobs');
        }, 1500);
        return data.data.id;
      } else {
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
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [formData, editId, router]);

  return {
    formData,
    updateField,
    updateFields,
    resetForm,
    setFormDataComplete,
    saveAsDraft,
    publishJob,
    isSaving,
    saveMessage,
    setSaveMessage,
  };
}








