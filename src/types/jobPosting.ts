// Job Posting Types
// Maps to the Prisma schema for JobPosting

export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface JobPostingFormData {
  // Step 1: Classify
  jobTitle: string;
  categories: string[]; // Multiple categories
  categorySkills: string[];
  isCategoryManuallySelected: boolean;
  countryRegion: string;
  experienceLevel: string;
  experienceYearsFrom: number;
  experienceYearsTo: number | 'Unlimited';
  workType: string;
  payType: string;
  currency: string;
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
  systemScreeningAnswers: SystemScreeningAnswerInput[];
  customScreeningQuestions: CustomScreeningQuestionInput[];
  applicationDeadline: string;
}

export interface SystemScreeningAnswerInput {
  questionId: string;
  requirement: 'must-have' | 'preferred' | 'accept-any';
  selectedAnswers: string[];
}

export interface CustomScreeningQuestionInput {
  id?: string;
  questionText: string;
  answerType: 'single' | 'multiple' | 'yes-no' | 'short-text';
  options?: string[];
  mustAnswer: boolean;
  idealAnswer?: string | string[];
  disqualifyIfNotIdeal: boolean;
}

export interface JobPosting {
  id: string;
  userId: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Step 1: Job Classification
  jobTitle: string;
  categories: string[]; // Multiple categories
  categorySkills: string[];
  isCategoryManuallySelected: boolean;
  countryRegion: string;
  experienceLevel: string;
  experienceYearsFrom: number;
  experienceYearsTo: string;
  workType: string;
  payType: string;
  currency: string;
  payFrom: string;
  payTo: string;
  showSalaryOnAd: boolean;
  salaryDisplayText: string | null;
  
  // Step 2: Job Details
  companyName: string;
  jobDescription: string;
  jobSummary: string;
  keySellingPoint1: string | null;
  keySellingPoint2: string | null;
  keySellingPoint3: string | null;
  companyLogo: string | null;
  companyCoverImage: string | null;
  videoLink: string | null;
  
  // Step 3: Screening & Filters
  selectedCountries: string[];
  workAuthByCountry: Record<string, string> | null;
  applicationDeadline: Date | null;
  
  // Relations
  systemScreeningAnswers?: SystemScreeningAnswer[];
  customScreeningQuestions?: CustomScreeningQuestion[];
  
  // Stats
  applicantCount?: number;
}

export interface SystemScreeningAnswer {
  id: string;
  jobPostingId: string;
  questionId: string;
  requirement: string;
  selectedAnswers: string[];
  createdAt: Date;
}

export interface CustomScreeningQuestion {
  id: string;
  jobPostingId: string;
  questionText: string;
  answerType: string;
  options: string[];
  mustAnswer: boolean;
  idealAnswer: string | string[] | null;
  disqualifyIfNotIdeal: boolean;
  createdAt: Date;
}





