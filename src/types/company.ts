/**
 * Company Types
 * 定义公司设置数据结构，与Prisma schema中的Company模型对应
 */

export interface Company {
  id: string;
  userId: string;
  companyName: string;
  companyLogo: string | null;
  companyCoverImage: string | null;
  videoLink: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  description: string | null;
  location: string | null;
  foundedYear: number | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyFormData {
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
}

export const COMPANY_SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1001-5000 employees',
  '5001-10000 employees',
  '10000+ employees'
] as const;

export const INDUSTRY_OPTIONS = [
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
] as const;

export type CompanySize = typeof COMPANY_SIZE_OPTIONS[number];
export type Industry = typeof INDUSTRY_OPTIONS[number];

/**
 * Create default company form data
 */
export function createDefaultCompanyFormData(): CompanyFormData {
  return {
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
    twitterUrl: ''
  };
}

/**
 * Convert Company to CompanyFormData
 */
export function companyToFormData(company: Company | null): CompanyFormData {
  if (!company) return createDefaultCompanyFormData();
  
  return {
    companyName: company.companyName || '',
    companyLogo: company.companyLogo || '',
    companyCoverImage: company.companyCoverImage || '',
    videoLink: company.videoLink || '',
    website: company.website || '',
    industry: company.industry || '',
    companySize: company.companySize || '',
    description: company.description || '',
    location: company.location || '',
    foundedYear: company.foundedYear?.toString() || '',
    linkedinUrl: company.linkedinUrl || '',
    twitterUrl: company.twitterUrl || ''
  };
}


