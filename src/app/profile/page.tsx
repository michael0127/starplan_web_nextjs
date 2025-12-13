'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/PageTransition';
import { SidebarLayout } from '@/components/navigation/SidebarLayout';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/hooks/useUser';
import { useUserType } from '@/hooks/useUserType';
import styles from './page.module.css';
import { UserProfile, CVEducation, CVWorkExperience } from '@/types/profile';
import EditPanel from '@/components/profile/EditPanel';

type TabType = 'personal' | 'education' | 'work' | 'skills' | 'employment';

export default function ProfilePage() {
  const router = useRouter();
  
  // 权限检查：只允许 CANDIDATE 访问
  const { loading: userTypeLoading, isCandidate } = useUserType({
    required: 'CANDIDATE',
    redirectTo: '/employer/dashboard',
  });
  
  const { user: authUser, loading: authLoading } = useAuth();
  const { user: dbUser, loading: userLoading, refreshUser } = useUser(authUser?.id);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [editSection, setEditSection] = useState<TabType>('personal');

  // Refs for scroll targets
  const contentRef = useRef<HTMLDivElement>(null);
  const personalRef = useRef<HTMLDivElement>(null);
  const educationRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const employmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push('/login');
    }
  }, [authUser, authLoading, router]);

  // 加载profile数据
  useEffect(() => {
    if (dbUser?.profile) {
      setProfile(dbUser.profile);
    }
  }, [dbUser]);

  // 监听滚动，自动更新activeTab
  useEffect(() => {
    if (!contentRef.current) return;

    const observerOptions = {
      root: contentRef.current, // 使用content容器作为root
      rootMargin: '-80px 0px -50% 0px', // 考虑导航栏的高度（32px top + 48px tab nav + spacing）
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id as TabType;
          setActiveTab(id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // 观察所有section
    const sections = [
      personalRef.current,
      educationRef.current,
      workRef.current,
      skillsRef.current,
      employmentRef.current,
    ].filter(Boolean);

    sections.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, [dbUser]); // 当dbUser加载后再设置observer

  // 滚动到指定section
  const scrollToSection = (tab: TabType) => {
    setActiveTab(tab);
    let ref;
    switch (tab) {
      case 'personal':
        ref = personalRef;
        break;
      case 'education':
        ref = educationRef;
        break;
      case 'work':
        ref = workRef;
        break;
      case 'skills':
        ref = skillsRef;
        break;
      case 'employment':
        ref = employmentRef;
        break;
    }
    
    if (ref.current && contentRef.current) {
      // 计算section相对于content容器的位置
      const contentRect = contentRef.current.getBoundingClientRect();
      const sectionRect = ref.current.getBoundingClientRect();
      const scrollTop = contentRef.current.scrollTop;
      const targetScrollTop = scrollTop + sectionRect.top - contentRect.top - 80; // 80px offset for tab nav
      
      // 滚动content容器，而不是整个页面
      contentRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  };

  // 打开编辑面板
  const handleOpenEdit = (section: TabType) => {
    setEditSection(section);
    setEditPanelOpen(true);
  };

  // 关闭编辑面板
  const handleCloseEdit = () => {
    setEditPanelOpen(false);
  };

  // 保存编辑
  const handleSaveEdit = async (data: any) => {
    if (!authUser) return;

    try {
      if (data.section === 'employment') {
        // Employment 数据存储在 User 表的独立字段中，不在 profile JSON 里
        const response = await fetch(`/api/user/${authUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobFunction: data.data.jobFunction,
            jobTypes: data.data.jobTypes,
            preferredLocation: data.data.preferredLocation,
            remoteOpen: data.data.remoteOpen,
            h1bSponsorship: data.data.h1bSponsorship,
            hasCompletedOnboarding: true, // 标记已完成 onboarding
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update employment preferences');
        }

        // 刷新用户数据
        await refreshUser();
      } else {
        // 其他数据存储在 profile JSON 字段中
        const updatedProfile: any = profile ? JSON.parse(JSON.stringify(profile)) : {};
        
        // 确保基本结构存在
        if (!updatedProfile.personal) updatedProfile.personal = {};
        if (!updatedProfile.education) updatedProfile.education = [];
        if (!updatedProfile.work_experience) updatedProfile.work_experience = [];
        if (!updatedProfile.skills) updatedProfile.skills = { technical_skills: [], soft_skills: [] };
        
        // 根据不同的 section 更新对应的数据
        if (data.section === 'personal') {
          updatedProfile.personal = {
            ...updatedProfile.personal,
            ...data.data,
          };
        } else if (data.section === 'education') {
          updatedProfile.education = data.data;
        } else if (data.section === 'work') {
          updatedProfile.work_experience = data.data;
        } else if (data.section === 'skills') {
          updatedProfile.skills = data.data;
        }

        // 发送更新到 API
        const response = await fetch(`/api/user/${authUser.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile: updatedProfile,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        // 刷新用户数据
        await refreshUser();
        setProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // 格式化日期显示
  const formatDate = (startDate: string | null, endDate: string | null, isCurrent: boolean) => {
    if (!startDate) return 'Date not specified';
    const start = startDate;
    const end = isCurrent ? 'Present' : (endDate || 'Present');
    return `${start} ⇨ ${end}`;
  };

  // 显示加载状态
  if (authLoading || userLoading || userTypeLoading || !isCandidate) {
    return (
      <PageTransition>
        <main className={styles.main}>
          <SidebarLayout>
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading your profile...</p>
            </div>
          </SidebarLayout>
        </main>
      </PageTransition>
    );
  }

  // 如果没有用户，返回 null（会被重定向）
  if (!authUser) {
    return null;
  }

  // 从profile中提取数据
  const cvData = profile?.cv_data || (profile as any);
  const personalInfo = cvData?.personal;
  const education = cvData?.education || [];
  const workExperience = cvData?.work_experience || [];
  const skills = cvData?.skills;
  const technicalSkills = skills?.technical_skills || [];
  const softSkills = skills?.soft_skills || [];

  // 获取显示信息
  const displayName = personalInfo?.full_name || dbUser?.name || authUser.email || 'User';
  const displayEmail = personalInfo?.personal_email || authUser.email;
  const displayPhone = personalInfo?.phone_number;
  const displayLocation = personalInfo?.location;

  return (
    <PageTransition>
      <main className={styles.main}>
        <SidebarLayout>
          <section className={styles.inner}>
            <div className={styles.headerRow}>
              <div className={styles.titleGroup}>
                <h1 className={styles.title}>Profile</h1>
                <p className={styles.subtitle}>
                  Your professional profile and information.
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className={styles.tabNav}>
              <button
                className={`${styles.tabButton} ${activeTab === 'personal' ? styles.tabActive : ''}`}
                onClick={() => scrollToSection('personal')}
              >
                Personal
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'education' ? styles.tabActive : ''}`}
                onClick={() => scrollToSection('education')}
              >
                Education
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'work' ? styles.tabActive : ''}`}
                onClick={() => scrollToSection('work')}
              >
                Work Experience
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'skills' ? styles.tabActive : ''}`}
                onClick={() => scrollToSection('skills')}
              >
                Skills
              </button>
              <button
                className={`${styles.tabButton} ${activeTab === 'employment' ? styles.tabActive : ''}`}
                onClick={() => scrollToSection('employment')}
              >
                Equal Employment
              </button>
            </nav>

            {/* Content Sections */}
            <div ref={contentRef} className={styles.content}>
              {/* Personal Section */}
              <section ref={personalRef} className={styles.section} id="personal">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{displayName}</h2>
                  <button className={styles.editButton} onClick={() => handleOpenEdit('personal')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14.5 3.5L16.5 5.5M2.5 17.5L4.35 17.26C4.59 17.23 4.82 17.12 5 16.95L16.5 5.45C16.78 5.17 16.78 4.72 16.5 4.44L15.56 3.5C15.28 3.22 14.83 3.22 14.55 3.5L3.05 15C2.88 15.17 2.77 15.41 2.74 15.65L2.5 17.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.personalInfo}>
                  {displayLocation && (
                    <div className={styles.infoItem}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2C7.24 2 5 4.24 5 7C5 10.5 10 17 10 17C10 17 15 10.5 15 7C15 4.24 12.76 2 10 2ZM10 9C8.90 9 8 8.10 8 7C8 5.90 8.90 5 10 5C11.10 5 12 5.90 12 7C12 8.10 11.10 9 10 9Z" fill="currentColor"/>
                      </svg>
                      <span>{displayLocation}</span>
                    </div>
                  )}
                  {displayEmail && (
                    <div className={styles.infoItem}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 5L10 10L17 5M4 15H16C16.55 15 17 14.55 17 14V6C17 5.45 16.55 5 16 5H4C3.45 5 3 5.45 3 6V14C3 14.55 3.45 15 4 15Z" fill="currentColor"/>
                      </svg>
                      <span>{displayEmail}</span>
                    </div>
                  )}
                  {displayPhone && (
                    <div className={styles.infoItem}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 7C4 6.17 4.67 5.5 5.5 5.5H7.5C7.78 5.5 8 5.72 8 6V8C8 8.28 7.78 8.5 7.5 8.5H5.5C5.22 8.5 5 8.28 5 8V7C5 6.72 4.78 6.5 4.5 6.5C4.22 6.5 4 6.72 4 7V12C4 12.83 4.67 13.5 5.5 13.5H14.5C15.33 13.5 16 12.83 16 12V7C16 6.72 15.78 6.5 15.5 6.5C15.22 6.5 15 6.72 15 7V8C15 8.28 14.78 8.5 14.5 8.5H12.5C12.22 8.5 12 8.28 12 8V6C12 5.72 12.22 5.5 12.5 5.5H14.5C15.33 5.5 16 6.17 16 7" fill="currentColor"/>
                      </svg>
                      <span>{displayPhone}</span>
                    </div>
                  )}
                  {personalInfo?.linkedin_url && (
                    <div className={styles.infoItem}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4.5 7H7V16H4.5V7ZM5.75 3C6.58 3 7.25 3.67 7.25 4.5C7.25 5.33 6.58 6 5.75 6C4.92 6 4.25 5.33 4.25 4.5C4.25 3.67 4.92 3 5.75 3ZM12.5 7C14.43 7 16 8.57 16 10.5V16H13.5V11.25C13.5 10.15 12.60 9.25 11.50 9.25C10.40 9.25 9.50 10.15 9.50 11.25V16H7V7H9.5V8.21C10.08 7.35 11.24 7 12.5 7Z" fill="currentColor"/>
                      </svg>
                      <a href={personalInfo.linkedin_url} target="_blank" rel="noopener noreferrer">
                        {personalInfo.linkedin_url}
                      </a>
                    </div>
                  )}
                  {personalInfo?.github_url && (
                    <div className={styles.infoItem}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2C5.58 2 2 5.58 2 10C2 13.54 4.29 16.54 7.47 17.59C7.87 17.66 8.02 17.42 8.02 17.21C8.02 17.02 8.01 16.39 8.01 15.72C6 16.09 5.48 14.97 5.32 14.38C5.23 14.18 4.84 13.46 4.5 13.27C4.22 13.13 3.82 12.81 4.49 12.8C5.12 12.79 5.57 13.34 5.72 13.58C6.44 14.83 7.59 14.49 8.05 14.28C8.12 13.76 8.33 13.41 8.56 13.21C6.84 13.01 5.04 12.33 5.04 9.27C5.04 8.41 5.23 7.71 5.74 7.16C5.66 6.96 5.39 6.14 5.82 5.02C5.82 5.02 6.49 4.81 8.02 5.87C8.66 5.69 9.34 5.60 10.02 5.60C10.70 5.60 11.38 5.69 12.02 5.87C13.55 4.80 14.22 5.02 14.22 5.02C14.65 6.14 14.38 6.96 14.30 7.16C14.81 7.71 15.00 8.40 15.00 9.27C15.00 12.34 13.19 13.01 11.47 13.21C11.76 13.46 12.01 13.94 12.01 14.69C12.01 15.76 12.00 16.62 12.00 17.21C12.00 17.42 12.15 17.67 12.55 17.59C15.71 16.53 18 13.52 18 10C18 5.58 14.42 2 10 2Z" fill="currentColor"/>
                      </svg>
                      <a href={personalInfo.github_url} target="_blank" rel="noopener noreferrer">
                        {personalInfo.github_url}
                      </a>
                    </div>
                  )}
                </div>
              </section>

              {/* Education Section */}
              <section ref={educationRef} className={styles.section} id="education">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Education</h2>
                  <button className={styles.editButton} onClick={() => handleOpenEdit('education')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14.5 3.5L16.5 5.5M2.5 17.5L4.35 17.26C4.59 17.23 4.82 17.12 5 16.95L16.5 5.45C16.78 5.17 16.78 4.72 16.5 4.44L15.56 3.5C15.28 3.22 14.83 3.22 14.55 3.5L3.05 15C2.88 15.17 2.77 15.41 2.74 15.65L2.5 17.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </button>
                </div>
                {education.length > 0 ? (
                  <div className={styles.timeline}>
                    {education.map((edu: CVEducation, index: number) => (
                      <div key={index} className={styles.timelineItem}>
                        <div className={styles.timelineDot}></div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelinePeriod}>
                            {formatDate(edu.start_date, edu.end_date, edu.is_current)}
                          </div>
                          <h3 className={styles.timelineTitle}>
                            {edu.institution_name || 'Institution not specified'}
                          </h3>
                          <p className={styles.timelineSubtitle}>
                            {edu.degree && edu.major 
                              ? `${edu.degree} in ${edu.major}`
                              : edu.degree || edu.major || 'Degree not specified'}
                          </p>
                          {edu.location && (
                            <p className={styles.timelineLocation}>{edu.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No education information available.</p>
                  </div>
                )}
              </section>

              {/* Work Experience Section */}
              <section ref={workRef} className={styles.section} id="work">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Work Experience</h2>
                  <button className={styles.editButton} onClick={() => handleOpenEdit('work')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14.5 3.5L16.5 5.5M2.5 17.5L4.35 17.26C4.59 17.23 4.82 17.12 5 16.95L16.5 5.45C16.78 5.17 16.78 4.72 16.5 4.44L15.56 3.5C15.28 3.22 14.83 3.22 14.55 3.5L3.05 15C2.88 15.17 2.77 15.41 2.74 15.65L2.5 17.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </button>
                </div>
                {workExperience.length > 0 ? (
                  <div className={styles.timeline}>
                    {workExperience.map((work: CVWorkExperience, index: number) => (
                      <div key={index} className={styles.timelineItem}>
                        <div className={styles.timelineDot}></div>
                        <div className={styles.timelineContent}>
                          <div className={styles.timelinePeriod}>
                            {formatDate(work.start_date, work.end_date, work.is_current)}
                          </div>
                          <h3 className={styles.timelineTitle}>
                            {work.company_name || 'Company not specified'}
                          </h3>
                          <p className={styles.timelineSubtitle}>
                            {work.job_title || 'Position not specified'}
                          </p>
                          {work.location && (
                            <p className={styles.timelineLocation}>{work.location}</p>
                          )}
                          {work.description && (
                            <p className={styles.timelineDescription}>{work.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No work experience information available.</p>
                  </div>
                )}
              </section>

              {/* Skills Section */}
              <section ref={skillsRef} className={styles.section} id="skills">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Skills</h2>
                  <button className={styles.editButton} onClick={() => handleOpenEdit('skills')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14.5 3.5L16.5 5.5M2.5 17.5L4.35 17.26C4.59 17.23 4.82 17.12 5 16.95L16.5 5.45C16.78 5.17 16.78 4.72 16.5 4.44L15.56 3.5C15.28 3.22 14.83 3.22 14.55 3.5L3.05 15C2.88 15.17 2.77 15.41 2.74 15.65L2.5 17.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </button>
                </div>
                {(technicalSkills.length > 0 || softSkills.length > 0) ? (
                  <div className={styles.skillsGrid}>
                    {technicalSkills.length > 0 && (
                      <div className={styles.skillCategory}>
                        <h4>Technical Skills</h4>
                        <div className={styles.skillTags}>
                          {technicalSkills.map((skill: string, index: number) => (
                            <span key={index} className={styles.skillTag}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {softSkills.length > 0 && (
                      <div className={styles.skillCategory}>
                        <h4>Soft Skills</h4>
                        <div className={styles.skillTags}>
                          {softSkills.map((skill: string, index: number) => (
                            <span key={index} className={styles.skillTag}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No skills information available.</p>
                  </div>
                )}
              </section>

              {/* Equal Employment Section */}
              <section ref={employmentRef} className={styles.section} id="employment">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Equal Employment</h2>
                  <button className={styles.editButton} onClick={() => handleOpenEdit('employment')}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M14.5 3.5L16.5 5.5M2.5 17.5L4.35 17.26C4.59 17.23 4.82 17.12 5 16.95L16.5 5.45C16.78 5.17 16.78 4.72 16.5 4.44L15.56 3.5C15.28 3.22 14.83 3.22 14.55 3.5L3.05 15C2.88 15.17 2.77 15.41 2.74 15.65L2.5 17.5Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    </svg>
                  </button>
                </div>
                {dbUser?.hasCompletedOnboarding ? (
                  <div className={styles.employmentInfo}>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Job Function</div>
                      <div className={styles.infoValue}>{dbUser.jobFunction || 'Not specified'}</div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Job Types</div>
                      <div className={styles.infoValue}>
                        {dbUser.jobTypes && dbUser.jobTypes.length > 0 
                          ? dbUser.jobTypes.join(', ') 
                          : 'Not specified'}
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Preferred Location</div>
                      <div className={styles.infoValue}>{dbUser.preferredLocation || 'Not specified'}</div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>Open to Remote</div>
                      <div className={styles.infoValue}>
                        <span className={`${styles.badge} ${dbUser.remoteOpen ? styles.badgeYes : styles.badgeNo}`}>
                          {dbUser.remoteOpen ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.infoRow}>
                      <div className={styles.infoLabel}>H1B Sponsorship</div>
                      <div className={styles.infoValue}>
                        <span className={`${styles.badge} ${dbUser.h1bSponsorship ? styles.badgeYes : styles.badgeNo}`}>
                          {dbUser.h1bSponsorship ? 'Required' : 'Not Required'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No employment preferences available. Please complete onboarding.</p>
                  </div>
                )}
          </section>
            </div>
          </section>
        </SidebarLayout>

        {/* Edit Panel */}
        <EditPanel
          isOpen={editPanelOpen}
          onClose={handleCloseEdit}
          section={editSection}
          profile={editSection === 'employment' ? (dbUser as any) : profile}
          onSave={handleSaveEdit}
        />
      </main>
    </PageTransition>
  );
}
