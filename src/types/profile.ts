/**
 * User Profile Types
 * 定义user表中profile JSON字段的类型结构
 * 与CV解析服务的数据结构保持一致
 */

// ============================================
// CV解析后的数据结构
// ============================================

export interface CVPersonalInfo {
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  personal_email: string | null;
  phone_number: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  location: string | null;
}

export interface CVEducation {
  institution_name: string | null;
  degree: string | null;
  major: string | null;
  location: string | null;
  start_date: string | null;  // Format: 'YYYY-MM' or 'YYYY'
  end_date: string | null;     // Format: 'YYYY-MM' or 'YYYY' or null if ongoing
  is_current: boolean;
}

export interface CVWorkExperience {
  company_name: string | null;
  job_title: string | null;
  location: string | null;
  start_date: string | null;  // Format: 'YYYY-MM' or 'YYYY'
  end_date: string | null;     // Format: 'YYYY-MM' or 'YYYY' or null if ongoing
  is_current: boolean;
  description: string | null;
}

export interface CVSkills {
  technical_skills: string[];
  soft_skills: string[];
}

export interface ParsedCVData {
  personal: CVPersonalInfo;
  education: CVEducation[];
  work_experience: CVWorkExperience[];
  skills: CVSkills;
}

// ============================================
// 扩展的用户Profile结构
// ============================================

export interface UserProfile {
  // CV解析的核心数据
  cv_data?: ParsedCVData;
  
  // 额外的个人信息
  bio?: string;
  headline?: string;
  timezone?: string;
  
  // 额外的社交链接（补充CV中的链接）
  social?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
    portfolio?: string;
  };
  
  // 项目经历（CV中可能没有的部分）
  projects?: ProjectEntry[];
  
  // 语言能力
  languages?: LanguageEntry[];
  
  // 证书和认证
  certifications?: CertificationEntry[];
  
  // 用户偏好设置
  preferences?: UserPreferences;
  
  // 元数据
  last_cv_update?: string;      // 上次CV更新时间
  profile_completeness?: number; // 资料完整度 0-100
  version?: string;              // 数据版本号
}

export interface ProjectEntry {
  name: string;
  description: string;
  url?: string;
  github_url?: string;
  technologies?: string[];
  start_date?: string;
  end_date?: string | null;
  role?: string;
  highlights?: string[];
}

export interface LanguageEntry {
  name: string;
  proficiency: 'basic' | 'conversational' | 'fluent' | 'native';
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  date: string;
  expiry_date?: string;
  url?: string;
  credential_id?: string;
}

export interface UserPreferences {
  email_notifications?: boolean;
  job_alerts?: boolean;
  newsletter?: boolean;
  visibility?: 'public' | 'private' | 'connections';
  share_profile?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
}

// ============================================
// 工具函数
// ============================================

/**
 * 创建默认的空profile
 */
export function createDefaultProfile(): UserProfile {
  return {
    version: '1.0',
    profile_completeness: 0,
    preferences: {
      email_notifications: true,
      job_alerts: true,
      newsletter: false,
      visibility: 'public',
      share_profile: true,
      show_email: false,
      show_phone: false,
    },
  };
}

/**
 * 从解析的CV数据创建profile
 */
export function createProfileFromCV(cvData: ParsedCVData): UserProfile {
  const profile = createDefaultProfile();
  
  profile.cv_data = cvData;
  profile.last_cv_update = new Date().toISOString();
  
  // 从CV中提取社交链接
  if (cvData.personal) {
    profile.social = {
      linkedin: cvData.personal.linkedin_url || undefined,
      github: cvData.personal.github_url || undefined,
    };
  }
  
  // 计算完整度
  profile.profile_completeness = calculateProfileCompleteness(profile);
  
  return profile;
}

/**
 * 合并CV数据到现有profile
 */
export function mergeCVDataToProfile(
  existingProfile: UserProfile | null | undefined,
  cvData: ParsedCVData
): UserProfile {
  const current = existingProfile || createDefaultProfile();
  
  return {
    ...current,
    cv_data: cvData,
    last_cv_update: new Date().toISOString(),
    social: {
      ...current.social,
      linkedin: cvData.personal?.linkedin_url || current.social?.linkedin,
      github: cvData.personal?.github_url || current.social?.github,
    },
    profile_completeness: calculateProfileCompleteness({
      ...current,
      cv_data: cvData,
    }),
  };
}

/**
 * 合并profile更新
 */
export function mergeProfile(
  existing: UserProfile | null | undefined,
  updates: Partial<UserProfile>
): UserProfile {
  const current = existing || createDefaultProfile();
  
  const merged = {
    ...current,
    ...updates,
    social: {
      ...current.social,
      ...updates.social,
    },
    preferences: {
      ...current.preferences,
      ...updates.preferences,
    },
    // CV数据保持不变，除非明确更新
    cv_data: updates.cv_data || current.cv_data,
    // 数组字段直接替换
    projects: updates.projects ?? current.projects,
    languages: updates.languages ?? current.languages,
    certifications: updates.certifications ?? current.certifications,
  };
  
  // 重新计算完整度
  merged.profile_completeness = calculateProfileCompleteness(merged);
  
  return merged;
}

/**
 * 计算profile完整度（0-100）
 */
export function calculateProfileCompleteness(profile: UserProfile): number {
  let score = 0;
  const weights = {
    cv_data: 40,
    bio: 10,
    social: 10,
    projects: 15,
    languages: 10,
    certifications: 15,
  };
  
  // CV数据完整度
  if (profile.cv_data) {
    let cvScore = 0;
    if (profile.cv_data.personal?.full_name) cvScore += 10;
    if (profile.cv_data.personal?.personal_email) cvScore += 10;
    if (profile.cv_data.education?.length > 0) cvScore += 10;
    if (profile.cv_data.work_experience?.length > 0) cvScore += 5;
    if (profile.cv_data.skills?.technical_skills?.length > 0) cvScore += 5;
    score += cvScore;
  }
  
  if (profile.bio && profile.bio.length > 20) score += weights.bio;
  
  if (profile.social) {
    const socialCount = Object.values(profile.social).filter(Boolean).length;
    score += (socialCount / 5) * weights.social;
  }
  
  if (profile.projects && profile.projects.length > 0) {
    score += Math.min(weights.projects, profile.projects.length * 5);
  }
  
  if (profile.languages && profile.languages.length > 0) {
    score += Math.min(weights.languages, profile.languages.length * 5);
  }
  
  if (profile.certifications && profile.certifications.length > 0) {
    score += Math.min(weights.certifications, profile.certifications.length * 5);
  }
  
  return Math.min(100, Math.round(score));
}

/**
 * 类型守卫：检查是否为有效的UserProfile
 */
export function isValidProfile(data: unknown): data is UserProfile {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const profile = data as UserProfile;
  
  // 如果有cv_data，验证其基本结构
  if (profile.cv_data) {
    if (!profile.cv_data.personal || !profile.cv_data.education || 
        !profile.cv_data.work_experience || !profile.cv_data.skills) {
      return false;
    }
  }
  
  return true;
}

/**
 * 类型守卫：检查是否为有效的ParsedCVData
 */
export function isValidCVData(data: unknown): data is ParsedCVData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const cvData = data as ParsedCVData;
  
  return !!(
    cvData.personal &&
    Array.isArray(cvData.education) &&
    Array.isArray(cvData.work_experience) &&
    cvData.skills &&
    Array.isArray(cvData.skills.technical_skills) &&
    Array.isArray(cvData.skills.soft_skills)
  );
}

/**
 * 从profile中提取显示名称
 */
export function getDisplayName(profile: UserProfile | null | undefined): string {
  if (!profile) return 'User';
  
  if (profile.cv_data?.personal?.full_name) {
    return profile.cv_data.personal.full_name;
  }
  
  if (profile.cv_data?.personal?.first_name && profile.cv_data?.personal?.last_name) {
    return `${profile.cv_data.personal.first_name} ${profile.cv_data.personal.last_name}`;
  }
  
  if (profile.cv_data?.personal?.first_name) {
    return profile.cv_data.personal.first_name;
  }
  
  return 'User';
}

/**
 * 获取联系邮箱
 */
export function getContactEmail(profile: UserProfile | null | undefined): string | null {
  return profile?.cv_data?.personal?.personal_email || null;
}

/**
 * 获取联系电话
 */
export function getContactPhone(profile: UserProfile | null | undefined): string | null {
  return profile?.cv_data?.personal?.phone_number || null;
}

/**
 * 获取所有技能（合并technical和soft skills）
 */
export function getAllSkills(profile: UserProfile | null | undefined): string[] {
  if (!profile?.cv_data?.skills) return [];
  
  return [
    ...(profile.cv_data.skills.technical_skills || []),
    ...(profile.cv_data.skills.soft_skills || []),
  ];
}


