'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import { usePageAnimation } from '@/hooks/usePageAnimation';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/lib/supabase';
import EmployerNavbar from '@/components/EmployerNavbar';
import styles from './page.module.css';

const DRAFT_STORAGE_KEY = 'company_settings_draft';
const DRAFT_AUTOSAVE_DELAY = 1000; // 1 second debounce

interface CompanySettings {
  id?: string;
  companyName: string;
  companyLogo: string;
  companyCoverImage: string;
  videoLink: string;
  website: string;
  industry: string;
  companySize: string;
  description: string;
  location: string;
  foundedYear: string;
  linkedinUrl: string;
  twitterUrl: string;
  // Billing information
  billingAddress: string;
  billingEmail: string;
  billingEmailSameAsRegistration: boolean;
  abn: string;
}

const initialSettings: CompanySettings = {
  companyName: '',
  companyLogo: '',
  companyCoverImage: '',
  videoLink: '',
  website: '',
  industry: '',
  companySize: '',
  description: '',
  location: '',
  foundedYear: '',
  linkedinUrl: '',
  twitterUrl: '',
  // Billing information
  billingAddress: '',
  billingEmail: '',
  billingEmailSameAsRegistration: true,
  abn: ''
};

const companySizeOptions = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001-5000 employees',
  '5001-10000 employees',
  '10000+ employees'
];

const industryOptions = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'E-commerce & Retail',
  'Education',
  'Manufacturing',
  'Consulting',
  'Media & Entertainment',
  'Real Estate',
  'Transportation & Logistics',
  'Hospitality & Tourism',
  'Energy & Utilities',
  'Telecommunications',
  'Agriculture',
  'Non-profit',
  'Government',
  'Other'
];

export default function CompanySettingsPage() {
  const mounted = usePageAnimation();
  const router = useRouter();
  const [settings, setSettings] = useState<CompanySettings>(initialSettings);
  const [savedSettings, setSavedSettings] = useState<CompanySettings>(initialSettings); // Server state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [syncedJobsCount, setSyncedJobsCount] = useState<number | null>(null);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const draftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { user, loading, isEmployer } = useUserType({
    required: 'EMPLOYER',
    redirectTo: '/',
  });

  // Check if settings have changed from saved state
  const checkForChanges = useCallback((current: CompanySettings, saved: CompanySettings) => {
    return JSON.stringify(current) !== JSON.stringify(saved);
  }, []);

  // Save draft to localStorage
  const saveDraft = useCallback((data: CompanySettings) => {
    if (!user?.id) return;
    try {
      const draftData = {
        userId: user.id,
        settings: data,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      setHasDraft(true);
      setDraftSaving(false);
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  }, [user?.id]);

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    if (!user?.id) return null;
    try {
      const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        if (draft.userId === user.id) {
          return draft;
        }
      }
    } catch (e) {
      console.error('Error loading draft:', e);
    }
    return null;
  }, [user?.id]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
  }, []);

  // Discard draft and restore to saved settings
  const discardDraft = useCallback(() => {
    clearDraft();
    setSettings(savedSettings);
    if (savedSettings.companyLogo) setLogoPreview(savedSettings.companyLogo);
    else setLogoPreview('');
    if (savedSettings.companyCoverImage) setCoverPreview(savedSettings.companyCoverImage);
    else setCoverPreview('');
    setHasUnsavedChanges(false);
  }, [savedSettings, clearDraft]);

  // Fetch company settings and check for drafts
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user || !isEmployer) return;
      
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) return;
        
        const response = await fetch('/api/employer/company', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });
        
        const result = await response.json();
        
        let serverSettings = initialSettings;
        
        if (result.success && result.data) {
          const data = result.data;
          serverSettings = {
            id: data.id,
            companyName: data.companyName || '',
            companyLogo: data.companyLogo || '',
            companyCoverImage: data.companyCoverImage || '',
            videoLink: data.videoLink || '',
            website: data.website || '',
            industry: data.industry || '',
            companySize: data.companySize || '',
            description: data.description || '',
            location: data.location || '',
            foundedYear: data.foundedYear?.toString() || '',
            linkedinUrl: data.linkedinUrl || '',
            twitterUrl: data.twitterUrl || '',
            // Billing information
            billingAddress: data.billingAddress || '',
            billingEmail: data.billingEmail || '',
            billingEmailSameAsRegistration: data.billingEmailSameAsRegistration ?? true,
            abn: data.abn || ''
          };
        }
        
        // Save server state
        setSavedSettings(serverSettings);
        
        // Check for existing draft
        const draft = loadDraft();
        if (draft && draft.settings) {
          // Check if draft has meaningful changes from server
          const draftHasChanges = checkForChanges(draft.settings, serverSettings);
          if (draftHasChanges) {
            // Use draft data
            setSettings(draft.settings);
            setHasDraft(true);
            setHasUnsavedChanges(true);
            if (draft.settings.companyLogo) setLogoPreview(draft.settings.companyLogo);
            if (draft.settings.companyCoverImage) setCoverPreview(draft.settings.companyCoverImage);
          } else {
            // Draft is same as server, clear it
            clearDraft();
            setSettings(serverSettings);
            if (serverSettings.companyLogo) setLogoPreview(serverSettings.companyLogo);
            if (serverSettings.companyCoverImage) setCoverPreview(serverSettings.companyCoverImage);
          }
        } else {
          // No draft, use server data
          setSettings(serverSettings);
          if (serverSettings.companyLogo) setLogoPreview(serverSettings.companyLogo);
          if (serverSettings.companyCoverImage) setCoverPreview(serverSettings.companyCoverImage);
        }
      } catch (error) {
        console.error('Error fetching company settings:', error);
        setError('Failed to load company settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user, isEmployer, loadDraft, clearDraft, checkForChanges]);

  // Auto-save draft when settings change
  useEffect(() => {
    if (isLoading || !user?.id) return;
    
    // Check if there are changes from saved state
    const hasChanges = checkForChanges(settings, savedSettings);
    setHasUnsavedChanges(hasChanges);
    
    if (!hasChanges) {
      // No changes, clear draft
      clearDraft();
      return;
    }
    
    // Debounce draft saving
    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current);
    }
    
    setDraftSaving(true);
    draftTimeoutRef.current = setTimeout(() => {
      saveDraft(settings);
    }, DRAFT_AUTOSAVE_DELAY);
    
    return () => {
      if (draftTimeoutRef.current) {
        clearTimeout(draftTimeoutRef.current);
      }
    };
  }, [settings, savedSettings, isLoading, user?.id, checkForChanges, saveDraft, clearDraft]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
    setError(null);
  };

  const handleImageUpload = async (type: 'logo' | 'cover', file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(`Please upload an image file for ${type === 'logo' ? 'logo' : 'cover image'}`);
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    try {
      const isLogo = type === 'logo';
      if (isLogo) {
        setUploadingLogo(true);
      } else {
        setUploadingCover(true);
      }
      
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      if (isLogo) {
        setLogoPreview(previewUrl);
      } else {
        setCoverPreview(previewUrl);
      }
      
      // Get session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      // Upload to API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', isLogo ? 'logo' : 'cover');
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to upload ${type}`);
      }
      
      const data = await response.json();
      
      // Update settings with URL
      if (isLogo) {
        setSettings(prev => ({ ...prev, companyLogo: data.data.url }));
      } else {
        setSettings(prev => ({ ...prev, companyCoverImage: data.data.url }));
      }
      
      setError(null);
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
      setError(err instanceof Error ? err.message : `Failed to upload ${type}`);
      // Revert preview on error
      if (type === 'logo') {
        setLogoPreview(settings.companyLogo);
      } else {
        setCoverPreview(settings.companyCoverImage);
      }
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingCover(false);
      }
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload('logo', file);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload('cover', file);
  };

  const removeLogo = async () => {
    // If there's a URL stored in Supabase, try to delete from storage via API
    if (settings.companyLogo && settings.companyLogo.includes('supabase')) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch('/api/upload-image', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              url: settings.companyLogo,
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
    
    setSettings(prev => ({ ...prev, companyLogo: '' }));
    setLogoPreview('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const removeCover = async () => {
    // If there's a URL stored in Supabase, try to delete from storage via API
    if (settings.companyCoverImage && settings.companyCoverImage.includes('supabase')) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await fetch('/api/upload-image', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              url: settings.companyCoverImage,
              type: 'cover'
            }),
          });
        }
      } catch (error) {
        console.error('Error deleting cover image from storage:', error);
      }
    }
    
    // Revoke object URL if it exists
    if (coverPreview && coverPreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverPreview);
    }
    
    setSettings(prev => ({ ...prev, companyCoverImage: '' }));
    setCoverPreview('');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!settings.companyName.trim()) {
      setError('Company name is required');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      setSyncedJobsCount(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('/api/employer/company', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save settings');
      }
      
      // Update saved settings state and clear draft
      setSavedSettings(settings);
      clearDraft();
      setHasUnsavedChanges(false);
      
      // Show synced jobs count
      if (result.syncedJobPostings !== undefined) {
        setSyncedJobsCount(result.syncedJobPostings);
      }
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setSyncedJobsCount(null);
      }, 5000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getVideoEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    return null;
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

  return (
    <PageTransition>
      <div className={styles.container}>
        <EmployerNavbar userEmail={user?.email} />

        <main className={styles.main}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <h1 className={styles.title}>Company Settings</h1>
              <p className={styles.subtitle}>
                Customize your company profile to attract top talent
              </p>
            </div>
            <div className={styles.headerActions}>
              {/* Draft indicator */}
              {hasUnsavedChanges && (
                <div className={styles.draftIndicator}>
                  {draftSaving ? (
                    <>
                      <span className={styles.draftSpinner}></span>
                      <span>Saving draft...</span>
                    </>
                  ) : hasDraft ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                      </svg>
                      <span>Draft saved</span>
                    </>
                  ) : (
                    <span>Unsaved changes</span>
                  )}
                </div>
              )}
              {/* Discard button */}
              {hasUnsavedChanges && (
                <button 
                  className={styles.discardButton}
                  onClick={discardDraft}
                  title="Discard all changes"
                >
                  Discard
                </button>
              )}
              {/* Save button */}
              <button 
                className={`${styles.saveButton} ${saveSuccess ? styles.saveSuccess : ''}`}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className={styles.spinner}></span>
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Saved!
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBanner}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              {error}
              <button onClick={() => setError(null)} className={styles.dismissError}>×</button>
            </div>
          )}

          {saveSuccess && syncedJobsCount !== null && (
            <div className={styles.successBanner}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <span>
                Settings saved! {syncedJobsCount > 0 
                  ? `Also synced to ${syncedJobsCount} job posting${syncedJobsCount !== 1 ? 's' : ''}.`
                  : 'No job postings to sync.'}
              </span>
            </div>
          )}

          {isLoading ? (
            <div className={styles.loadingContent}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading company settings...</p>
            </div>
          ) : (
            <div className={styles.content}>
              {/* Cover Image Section */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Cover Image</h2>
                  <p>This banner will appear at the top of your company profile and job listings</p>
                </div>
                <div 
                  className={styles.coverImageUpload}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverPreview ? (
                    <div className={styles.coverImagePreview}>
                      <img src={coverPreview} alt="Cover preview" />
                      <div className={styles.coverOverlay}>
                        <button 
                          className={styles.changeButton}
                          onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }}
                        >
                          Change Cover
                        </button>
                        <button 
                          className={styles.removeButton}
                          onClick={(e) => { e.stopPropagation(); removeCover(); }}
                        >
                          Remove
                        </button>
                      </div>
                      {uploadingCover && (
                        <div className={styles.uploadOverlay}>
                          <div className={styles.uploadSpinner}></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.uploadPlaceholder}>
                      {uploadingCover ? (
                        <div className={styles.uploadSpinner}></div>
                      ) : (
                        <>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span>Click to upload cover image</span>
                          <span className={styles.uploadHint}>Recommended: 1200 x 400 pixels, max 5MB</span>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    className={styles.hiddenInput}
                  />
                </div>
              </section>

              {/* Logo & Basic Info */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Company Logo & Basic Information</h2>
                </div>
                <div className={styles.logoInfoGrid}>
                  <div className={styles.logoUpload}>
                    <div 
                      className={styles.logoContainer}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Logo preview" className={styles.logoImage} />
                          {uploadingLogo && (
                            <div className={styles.uploadOverlay}>
                              <div className={styles.uploadSpinner}></div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={styles.logoPlaceholder}>
                          {uploadingLogo ? (
                            <div className={styles.uploadSpinner}></div>
                          ) : (
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={styles.logoActions}>
                      <button 
                        className={styles.uploadBtn}
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </button>
                      {logoPreview && (
                        <button className={styles.removeBtn} onClick={removeLogo}>
                          Remove
                        </button>
                      )}
                    </div>
                    <span className={styles.logoHint}>Square image, max 5MB</span>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className={styles.hiddenInput}
                    />
                  </div>
                  
                  <div className={styles.basicInfoFields}>
                    <div className={styles.formGroup}>
                      <label htmlFor="companyName">Company Name *</label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={settings.companyName}
                        onChange={handleInputChange}
                        placeholder="Enter your company name"
                        required
                      />
                    </div>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="industry">Industry</label>
                        <select
                          id="industry"
                          name="industry"
                          value={settings.industry}
                          onChange={handleInputChange}
                        >
                          <option value="">Select industry</option>
                          {industryOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="companySize">Company Size</label>
                        <select
                          id="companySize"
                          name="companySize"
                          value={settings.companySize}
                          onChange={handleInputChange}
                        >
                          <option value="">Select size</option>
                          {companySizeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="location">Location</label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={settings.location}
                          onChange={handleInputChange}
                          placeholder="e.g., Sydney, Australia"
                        />
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="foundedYear">Founded Year</label>
                        <input
                          type="number"
                          id="foundedYear"
                          name="foundedYear"
                          value={settings.foundedYear}
                          onChange={handleInputChange}
                          placeholder="e.g., 2020"
                          min="1800"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Company Description */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>About Your Company</h2>
                  <p>Tell candidates what makes your company special</p>
                </div>
                <div className={styles.formGroup}>
                  <textarea
                    id="description"
                    name="description"
                    value={settings.description}
                    onChange={handleInputChange}
                    placeholder="Share your company's mission, culture, and what makes it a great place to work..."
                    rows={6}
                    className={styles.descriptionTextarea}
                  />
                  <span className={styles.charCount}>
                    {settings.description.length} / 2000 characters
                  </span>
                </div>
              </section>

              {/* Video Link */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Company Video</h2>
                  <p>Add a YouTube or Vimeo video to showcase your company culture</p>
                </div>
                <div className={styles.formGroup}>
                  <div className={styles.videoInputWrapper}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="23 7 16 12 23 17 23 7"></polygon>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                    </svg>
                    <input
                      type="url"
                      id="videoLink"
                      name="videoLink"
                      value={settings.videoLink}
                      onChange={handleInputChange}
                      placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                    />
                  </div>
                </div>
                {settings.videoLink && getVideoEmbedUrl(settings.videoLink) && (
                  <div className={styles.videoPreview}>
                    <iframe
                      src={getVideoEmbedUrl(settings.videoLink)!}
                      title="Company video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </section>

              {/* Billing Information */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Billing Information</h2>
                  <p>Set up your billing details for invoices and payments</p>
                </div>
                <div className={styles.billingGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="billingAddress">Billing Address</label>
                    <textarea
                      id="billingAddress"
                      name="billingAddress"
                      value={settings.billingAddress}
                      onChange={handleInputChange}
                      placeholder="Enter your billing address"
                      rows={3}
                      className={styles.billingAddressTextarea}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="abn">ABN (Australian Business Number)</label>
                    <input
                      type="text"
                      id="abn"
                      name="abn"
                      value={settings.abn}
                      onChange={handleInputChange}
                      placeholder="e.g., 12 345 678 901"
                      maxLength={14}
                    />
                  </div>
                  
                  <div className={styles.billingEmailSection}>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={settings.billingEmailSameAsRegistration}
                          onChange={(e) => {
                            setSettings(prev => ({
                              ...prev,
                              billingEmailSameAsRegistration: e.target.checked,
                              billingEmail: e.target.checked ? '' : prev.billingEmail
                            }));
                            setSaveSuccess(false);
                            setError(null);
                          }}
                        />
                        <span>Billing email is the same as registration email ({user?.email})</span>
                      </label>
                    </div>
                    
                    {!settings.billingEmailSameAsRegistration && (
                      <div className={styles.formGroup}>
                        <label htmlFor="billingEmail">Billing Email</label>
                        <input
                          type="email"
                          id="billingEmail"
                          name="billingEmail"
                          value={settings.billingEmail}
                          onChange={handleInputChange}
                          placeholder="billing@company.com"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Website & Social Links */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Online Presence</h2>
                  <p>Help candidates learn more about your company</p>
                </div>
                <div className={styles.socialLinksGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="website">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      Website
                    </label>
                    <input
                      type="url"
                      id="website"
                      name="website"
                      value={settings.website}
                      onChange={handleInputChange}
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="linkedinUrl">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg>
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      id="linkedinUrl"
                      name="linkedinUrl"
                      value={settings.linkedinUrl}
                      onChange={handleInputChange}
                      placeholder="https://www.linkedin.com/company/..."
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="twitterUrl">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                      </svg>
                      Twitter / X
                    </label>
                    <input
                      type="url"
                      id="twitterUrl"
                      name="twitterUrl"
                      value={settings.twitterUrl}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                </div>
              </section>

              {/* Preview Section */}
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2>Profile Preview</h2>
                  <p>This is how your company profile will appear to candidates</p>
                </div>
                <div className={styles.profilePreview}>
                  <div className={styles.previewCover}>
                    {coverPreview ? (
                      <img src={coverPreview} alt="Cover" />
                    ) : (
                      <div className={styles.previewCoverPlaceholder}>
                        <span>Your cover image will appear here</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.previewContent}>
                    <div className={styles.previewLogo}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" />
                      ) : (
                        <div className={styles.previewLogoPlaceholder}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.previewInfo}>
                      <h3>{settings.companyName || 'Your Company Name'}</h3>
                      <div className={styles.previewMeta}>
                        {settings.industry && <span>{settings.industry}</span>}
                        {settings.location && <span>{settings.location}</span>}
                        {settings.companySize && <span>{settings.companySize}</span>}
                      </div>
                      {settings.description && (
                        <p className={styles.previewDescription}>
                          {settings.description.length > 200 
                            ? settings.description.substring(0, 200) + '...' 
                            : settings.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}


