'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './EditPanel.module.css';
import { UserProfile, CVPersonalInfo, CVEducation, CVWorkExperience, CVSkills } from '@/types/profile';
import { searchCities, getMajorCitiesForCountry, SUPPORTED_COUNTRIES, COUNTRY_FLAGS } from '@/lib/locationData';

interface EditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  section: 'personal' | 'education' | 'work' | 'skills' | 'employment';
  profile: UserProfile | null;
  onSave: (data: any) => Promise<void>;
}

export default function EditPanel({ isOpen, onClose, section, profile, onSave }: EditPanelProps) {
  const [formData, setFormData] = useState<any>({});
  const [educationList, setEducationList] = useState<any[]>([]);
  const [workList, setWorkList] = useState<any[]>([]);
  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [employmentData, setEmploymentData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // City search state
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('Australia'); // Default country for city search

  // Initialize form data based on section
  useEffect(() => {
    if (!isOpen) return;

    if (section === 'personal') {
      // 读取 profile.personal（实际数据结构）
      const personalInfo = (profile as any)?.personal;
      setFormData({
        first_name: personalInfo?.first_name || '',
        last_name: personalInfo?.last_name || '',
        personal_email: personalInfo?.personal_email || '',
        phone_number: personalInfo?.phone_number || '',
        location: personalInfo?.location || '',
        city: extractCity(personalInfo?.location || null),
        postal_code: extractPostalCode(personalInfo?.location || null),
        county: extractCounty(personalInfo?.location || null),
        address_line: extractAddressLine(personalInfo?.location || null),
        linkedin_url: personalInfo?.linkedin_url || '',
        github_url: personalInfo?.github_url || '',
        portfolio_url: (profile as any)?.social?.portfolio || '',
      });
    } else if (section === 'education') {
      // 读取 profile.education
      const education = (profile as any)?.education || [];
      if (education.length === 0) {
        // 如果没有数据，添加一个空条目
        setEducationList([{
          institution_name: '',
          degree: '',
          major: '',
          gpa: '',
          start_date: '',
          end_date: '',
          is_current: false,
          location: '',
        }]);
      } else {
        setEducationList(education.map((edu: any) => ({
          institution_name: edu.institution_name || '',
          degree: edu.degree || '',
          major: edu.major || '',
          gpa: edu.gpa || '',
          start_date: edu.start_date || '',
          end_date: edu.end_date || '',
          is_current: edu.is_current || false,
          location: edu.location || '',
        })));
      }
    } else if (section === 'work') {
      // 读取 profile.work_experience
      const work = (profile as any)?.work_experience || [];
      if (work.length === 0) {
        // 如果没有数据，添加一个空条目
        setWorkList([{
          job_title: '',
          company_name: '',
          job_type: 'Full-time',
          location: '',
          start_date: '',
          end_date: '',
          is_current: false,
          description: '',
        }]);
      } else {
        setWorkList(work.map((w: any) => ({
          job_title: w.job_title || '',
          company_name: w.company_name || '',
          job_type: w.job_type || 'Full-time',
          location: w.location || '',
          start_date: w.start_date || '',
          end_date: w.end_date || '',
          is_current: w.is_current || false,
          description: w.description || '',
        })));
      }
    } else if (section === 'skills') {
      // 读取 profile.skills
      const skills = (profile as any)?.skills;
      const technicalSkills = skills?.technical_skills || [];
      const softSkills = skills?.soft_skills || [];
      setSkillsList([...technicalSkills, ...softSkills]);
    } else if (section === 'employment') {
      // 读取 User 表的独立字段（不在 profile JSON 中）
      // 这些数据通过 props 传递过来
      setEmploymentData({
        jobFunction: (profile as any)?.jobFunction || '',
        jobTypes: (profile as any)?.jobTypes || [],
        preferredLocation: (profile as any)?.preferredLocation || '',
        remoteOpen: (profile as any)?.remoteOpen || false,
        h1bSponsorship: (profile as any)?.h1bSponsorship || false,
      });
    }
  }, [isOpen, section, profile]);

  const extractCity = (location: string | null) => {
    if (!location) return '';
    const parts = location.split(',');
    return parts[0]?.trim() || '';
  };

  const extractCounty = (location: string | null) => {
    if (!location) return '';
    const parts = location.split(',');
    return parts[parts.length - 1]?.trim() || '';
  };

  const extractPostalCode = (location: string | null) => {
    if (!location) return '';
    const match = location.match(/\d{4}/);
    return match ? match[0] : '';
  };

  const extractAddressLine = (location: string | null) => {
    if (!location) return '';
    return location;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleEducationChange = (index: number, field: string, value: any) => {
    const updated = [...educationList];
    updated[index] = { ...updated[index], [field]: value };
    setEducationList(updated);
  };

  const handleWorkChange = (index: number, field: string, value: any) => {
    const updated = [...workList];
    updated[index] = { ...updated[index], [field]: value };
    setWorkList(updated);
  };

  const addEducation = () => {
    setEducationList([...educationList, {
      institution_name: '',
      degree: '',
      major: '',
      gpa: '',
      start_date: '',
      end_date: '',
      is_current: false,
      location: '',
    }]);
  };

  const removeEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  const addWork = () => {
    setWorkList([...workList, {
      job_title: '',
      company_name: '',
      job_type: 'Full-time',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: '',
    }]);
  };

  const removeWork = (index: number) => {
    setWorkList(workList.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    if (newSkill.trim() && !skillsList.includes(newSkill.trim())) {
      setSkillsList([...skillsList, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkillsList(skillsList.filter(s => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (section === 'personal') {
        const locationParts = [
          formData.address_line,
          formData.city,
          formData.county,
          formData.postal_code,
        ].filter(Boolean);
        const location = locationParts.join(', ');

        const updatedPersonalInfo: Partial<CVPersonalInfo> = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          full_name: `${formData.first_name} ${formData.last_name}`.trim(),
          personal_email: formData.personal_email,
          phone_number: formData.phone_number,
          location: location || null,
          linkedin_url: formData.linkedin_url || null,
          github_url: formData.github_url || null,
        };

        await onSave({
          section: 'personal',
          data: updatedPersonalInfo,
        });
      } else if (section === 'education') {
        await onSave({
          section: 'education',
          data: educationList,
        });
      } else if (section === 'work') {
        await onSave({
          section: 'work',
          data: workList,
        });
      } else if (section === 'skills') {
        await onSave({
          section: 'skills',
          data: {
            technical_skills: skillsList.slice(0, Math.ceil(skillsList.length / 2)),
            soft_skills: skillsList.slice(Math.ceil(skillsList.length / 2)),
          },
        });
      } else if (section === 'employment') {
        await onSave({
          section: 'employment',
          data: employmentData,
        });
      }

      onClose();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPersonalForm = () => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.required}>*</span> First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name || ''}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.required}>*</span> Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name || ''}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.required}>*</span> Email
            </label>
            <input
              type="email"
              name="personal_email"
              value={formData.personal_email || ''}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <span className={styles.required}>*</span> Phone
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number || ''}
              onChange={handleChange}
              className={styles.input}
              required
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Country</label>
            <select
              name="country"
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className={styles.select}
            >
              {SUPPORTED_COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {COUNTRY_FLAGS[country]} {country}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Postal Code</label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code || ''}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup} style={{ position: 'relative' }}>
          <label className={styles.label}>City</label>
          <input
            type="text"
            name="city"
            value={citySearchTerm || formData.city || ''}
            onChange={(e) => {
              setCitySearchTerm(e.target.value);
              setShowCityDropdown(true);
            }}
            onFocus={() => setShowCityDropdown(true)}
            onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
            className={styles.input}
            placeholder={`Search cities in ${selectedCountry}...`}
            autoComplete="off"
          />
          {showCityDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              maxHeight: '200px',
              overflowY: 'auto',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 1000,
              marginTop: '4px'
            }}>
              {searchCities(selectedCountry, citySearchTerm, 20).map((city) => (
                <div
                  key={city}
                  onClick={() => {
                    setFormData((prev: any) => ({ ...prev, city }));
                    setCitySearchTerm('');
                    setShowCityDropdown(false);
                  }}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '14px',
                    background: formData.city === city ? '#f0f4ff' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = formData.city === city ? '#f0f4ff' : 'transparent'}
                >
                  {city}
                </div>
              ))}
              {searchCities(selectedCountry, citySearchTerm, 20).length === 0 && (
                <div style={{ padding: '10px 12px', color: '#999', fontSize: '14px' }}>
                  No cities found
                </div>
              )}
            </div>
          )}
          <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            💡 Type to search from all cities in {selectedCountry}
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>County</label>
          <input
            type="text"
            name="county"
            value={formData.county || ''}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Address Line</label>
          <input
            type="text"
            name="address_line"
            value={formData.address_line || ''}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.required}>*</span> Linkedin URL
          </label>
          <input
            type="url"
            name="linkedin_url"
            value={formData.linkedin_url || ''}
            onChange={handleChange}
            className={styles.input}
            placeholder="https://www.linkedin.com/in/..."
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Github URL</label>
          <input
            type="url"
            name="github_url"
            value={formData.github_url || ''}
            onChange={handleChange}
            className={styles.input}
            placeholder="https://github.com/..."
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Portfolio URL</label>
          <input
            type="url"
            name="portfolio_url"
            value={formData.portfolio_url || ''}
            onChange={handleChange}
            className={styles.input}
            placeholder="https://..."
          />
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onClose}
          className={styles.cancelButton}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'UPDATE'}
        </button>
      </div>
    </form>
  );

  const renderEducationForm = () => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formSection}>
        {educationList.map((edu, index) => (
          <div key={index} className={styles.educationItem}>
            <div className={styles.itemHeader}>
              <h3 className={styles.itemTitle}>Education {index + 1}</h3>
              {educationList.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEducation(index)}
                  className={styles.deleteButton}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.required}>*</span> School Name
              </label>
              <select
                value={edu.institution_name}
                onChange={(e) => handleEducationChange(index, 'institution_name', e.target.value)}
                className={styles.select}
                required
              >
                <option value="">Select School</option>
                <option value="University of Melbourne">University of Melbourne</option>
                <option value="Caulfield Grammar School, Melbourne">Caulfield Grammar School, Melbourne</option>
                <option value="Monash University">Monash University</option>
                <option value="RMIT University">RMIT University</option>
              </select>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.required}>*</span> Major
                </label>
                <select
                  value={edu.major}
                  onChange={(e) => handleEducationChange(index, 'major', e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="">Select Major</option>
                  <option value="Data Science">Data Science</option>
                  <option value="VCE">VCE</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Software Engineering">Software Engineering</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.required}>*</span> Degree Type
                </label>
                <select
                  value={edu.degree}
                  onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="">Select Degree</option>
                  <option value="B.Sc.">B.Sc.</option>
                  <option value="VCE">VCE</option>
                  <option value="M.Sc.">M.Sc.</option>
                  <option value="Ph.D.">Ph.D.</option>
                  <option value="Bachelor">Bachelor</option>
                  <option value="Master">Master</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>GPA</label>
                <input
                  type="text"
                  value={edu.gpa}
                  onChange={(e) => handleEducationChange(index, 'gpa', e.target.value)}
                  className={styles.input}
                  placeholder="3.5"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Start Date</label>
                <select
                  value={edu.start_date}
                  onChange={(e) => handleEducationChange(index, 'start_date', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select Date</option>
                  {generateYearMonthOptions()}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>End Date</label>
                <select
                  value={edu.end_date}
                  onChange={(e) => handleEducationChange(index, 'end_date', e.target.value)}
                  className={styles.select}
                  disabled={edu.is_current}
                >
                  <option value="">Select Date</option>
                  {generateYearMonthOptions()}
                </select>
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id={`edu-current-${index}`}
                checked={edu.is_current}
                onChange={(e) => handleEducationChange(index, 'is_current', e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor={`edu-current-${index}`} className={styles.checkboxLabel}>
                I currently study here
              </label>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addEducation}
          className={styles.addButton}
        >
          + Add Education
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onClose}
          className={styles.cancelButton}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'UPDATE'}
        </button>
      </div>
    </form>
  );

  const renderWorkForm = () => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formSection}>
        {workList.map((work, index) => (
          <div key={index} className={styles.educationItem}>
            <div className={styles.itemHeader}>
              <h3 className={styles.itemTitle}>Work Experience {index + 1}</h3>
              {workList.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeWork(index)}
                  className={styles.deleteButton}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.required}>*</span> Job Title
              </label>
              <select
                value={work.job_title}
                onChange={(e) => handleWorkChange(index, 'job_title', e.target.value)}
                className={styles.select}
                required
              >
                <option value="">Select Job Title</option>
                <option value="Innovation Marketing Intern">Innovation Marketing Intern</option>
                <option value="Software Engineer">Software Engineer</option>
                <option value="Data Analyst">Data Analyst</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Marketing Manager">Marketing Manager</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                <span className={styles.required}>*</span> Company
              </label>
              <select
                value={work.company_name}
                onChange={(e) => handleWorkChange(index, 'company_name', e.target.value)}
                className={styles.select}
                required
              >
                <option value="">Select Company</option>
                <option value="Baozun E-Commerce">Baozun E-Commerce</option>
                <option value="Google">Google</option>
                <option value="Microsoft">Microsoft</option>
                <option value="Amazon">Amazon</option>
              </select>
              <p className={styles.hint}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                </svg>
                Tips: Pick the company from above for better accuracy
              </p>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.required}>*</span> Job Type
                </label>
                <select
                  value={work.job_type}
                  onChange={(e) => handleWorkChange(index, 'job_type', e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Location</label>
                <input
                  type="text"
                  value={work.location}
                  onChange={(e) => handleWorkChange(index, 'location', e.target.value)}
                  className={styles.input}
                  placeholder="Enter city name..."
                  list={`work-cities-${index}`}
                />
                <datalist id={`work-cities-${index}`}>
                  <option value="Remote">Remote</option>
                  {getMajorCitiesForCountry('Australia', 20).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  {getMajorCitiesForCountry('United States', 20).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  {getMajorCitiesForCountry('Singapore', 10).map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </datalist>
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Start Date</label>
                <select
                  value={work.start_date}
                  onChange={(e) => handleWorkChange(index, 'start_date', e.target.value)}
                  className={styles.select}
                >
                  <option value="">Select Date</option>
                  {generateYearMonthOptions()}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>End Date</label>
                <select
                  value={work.end_date}
                  onChange={(e) => handleWorkChange(index, 'end_date', e.target.value)}
                  className={styles.select}
                  disabled={work.is_current}
                >
                  <option value="">Select Date</option>
                  {generateYearMonthOptions()}
                </select>
              </div>
            </div>

            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id={`work-current-${index}`}
                checked={work.is_current}
                onChange={(e) => handleWorkChange(index, 'is_current', e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor={`work-current-${index}`} className={styles.checkboxLabel}>
                I currently work here
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Experience Summary</label>
              <textarea
                value={work.description}
                onChange={(e) => handleWorkChange(index, 'description', e.target.value)}
                className={styles.textarea}
                rows={4}
                placeholder="Describe your key responsibilities and achievements..."
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addWork}
          className={styles.addButton}
        >
          + Add Work Experience
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onClose}
          className={styles.cancelButton}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'UPDATE'}
        </button>
      </div>
    </form>
  );

  const handleEmploymentChange = (field: string, value: any) => {
    setEmploymentData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleJobTypesChange = (type: string) => {
    const currentTypes = employmentData.jobTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t: string) => t !== type)
      : [...currentTypes, type];
    
    setEmploymentData((prev: any) => ({
      ...prev,
      jobTypes: newTypes,
    }));
  };

  const renderSkillsForm = () => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.skillsContainer}>
          {skillsList.map((skill, index) => (
            <div key={index} className={styles.skillTag}>
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className={styles.skillRemove}
              >
                ×
              </button>
            </div>
          ))}
          <div className={styles.addSkillGroup}>
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
              className={styles.input}
              placeholder="Add skill..."
            />
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onClose}
          className={styles.cancelButton}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'UPDATE'}
        </button>
      </div>
    </form>
  );

  const renderEmploymentForm = () => (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.required}>*</span> Job Function
          </label>
          <select
            value={employmentData.jobFunction || ''}
            onChange={(e) => handleEmploymentChange('jobFunction', e.target.value)}
            className={styles.select}
            required
          >
            <option value="">Select Job Function</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Data Science">Data Science</option>
            <option value="Product Management">Product Management</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Operations">Operations</option>
            <option value="Customer Success">Customer Success</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.required}>*</span> Job Types (Select all that apply)
          </label>
          <div className={styles.checkboxGrid}>
            {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'].map((type) => (
              <div key={type} className={styles.checkboxItem}>
                <input
                  type="checkbox"
                  id={`jobtype-${type}`}
                  checked={(employmentData.jobTypes || []).includes(type)}
                  onChange={() => handleJobTypesChange(type)}
                  className={styles.checkbox}
                />
                <label htmlFor={`jobtype-${type}`} className={styles.checkboxLabel}>
                  {type}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            <span className={styles.required}>*</span> Preferred Location
          </label>
          <input
            type="text"
            value={employmentData.preferredLocation || ''}
            onChange={(e) => handleEmploymentChange('preferredLocation', e.target.value)}
            className={styles.input}
            placeholder="Enter preferred city or location..."
            list="preferred-locations"
            required
          />
          <datalist id="preferred-locations">
            <option value="Remote - Australia">Remote - Australia</option>
            <option value="Remote - Global">Remote - Global</option>
            <option value="Flexible">Flexible</option>
            {getMajorCitiesForCountry('Australia', 25).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
            {getMajorCitiesForCountry('United States', 25).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
            {getMajorCitiesForCountry('Singapore', 10).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
            {getMajorCitiesForCountry('Mainland China', 20).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
            {getMajorCitiesForCountry('HKSAR of China', 10).map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </datalist>
          <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            💡 Type to search or select from suggestions
          </p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Work Preferences</label>
          <div className={styles.toggleGroup}>
            <div className={styles.toggleItem}>
              <input
                type="checkbox"
                id="remoteOpen"
                checked={employmentData.remoteOpen || false}
                onChange={(e) => handleEmploymentChange('remoteOpen', e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="remoteOpen" className={styles.checkboxLabel}>
                Open to Remote Work
              </label>
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Visa & Sponsorship</label>
          <div className={styles.toggleGroup}>
            <div className={styles.toggleItem}>
              <input
                type="checkbox"
                id="h1bSponsorship"
                checked={employmentData.h1bSponsorship || false}
                onChange={(e) => handleEmploymentChange('h1bSponsorship', e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="h1bSponsorship" className={styles.checkboxLabel}>
                Require H1B Sponsorship
              </label>
            </div>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onClose}
          className={styles.cancelButton}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'UPDATE'}
        </button>
      </div>
    </form>
  );

  const generateYearMonthOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= currentYear - 20; year--) {
      for (let month = 1; month <= 12; month++) {
        const value = `${year}-${month.toString().padStart(2, '0')}`;
        options.push(
          <option key={value} value={value}>
            {value}
          </option>
        );
      }
    }
    
    return options;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
        <div className={styles.panelHeader}>
          <button className={styles.backButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h2 className={styles.panelTitle}>
            {section === 'personal' && 'Personal'}
            {section === 'education' && 'Education'}
            {section === 'work' && 'Work Experience'}
            {section === 'skills' && 'Skills'}
            {section === 'employment' && 'Equal Employment'}
          </h2>
        </div>

        <div className={styles.panelContent}>
          {section === 'personal' && renderPersonalForm()}
          {section === 'education' && renderEducationForm()}
          {section === 'work' && renderWorkForm()}
          {section === 'skills' && renderSkillsForm()}
          {section === 'employment' && renderEmploymentForm()}
        </div>
      </div>
    </>
  );
}
