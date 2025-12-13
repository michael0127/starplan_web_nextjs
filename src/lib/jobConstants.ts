// Countries/Regions with flags
export const COUNTRIES_REGIONS = [
  { value: 'Australia', label: 'Australia', flag: '🇦🇺' },
  { value: 'United States', label: 'United States', flag: '🇺🇸' },
  { value: 'Singapore', label: 'Singapore', flag: '🇸🇬' },
  { value: 'Mainland China', label: 'Mainland China', flag: '🇨🇳' },
  { value: 'HKSAR of China', label: 'HKSAR of China', flag: '🇭🇰' },
  { value: 'Remote', label: 'Remote', flag: '🌐' },
] as const;

export type CountryRegion = typeof COUNTRIES_REGIONS[number]['value'];

// Experience Levels with suggested years
export interface ExperienceLevel {
  level: string;
  suggestedYearsFrom: number;
  suggestedYearsTo: number | 'Unlimited';
  description: string;
}

export const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  {
    level: 'Intern',
    suggestedYearsFrom: 0,
    suggestedYearsTo: 0,
    description: 'Still in University/College',
  },
  {
    level: 'Graduates',
    suggestedYearsFrom: 0,
    suggestedYearsTo: 1,
    description: '0-1 year',
  },
  {
    level: 'Junior',
    suggestedYearsFrom: 0,
    suggestedYearsTo: 3,
    description: '≤ 3 years',
  },
  {
    level: 'Intermediate',
    suggestedYearsFrom: 3,
    suggestedYearsTo: 6,
    description: '3-6 years',
  },
  {
    level: 'Senior',
    suggestedYearsFrom: 6,
    suggestedYearsTo: 10,
    description: '6-10 years',
  },
  {
    level: 'Director',
    suggestedYearsFrom: 10,
    suggestedYearsTo: 'Unlimited',
    description: 'Over 10 years',
  },
  {
    level: 'C-Level',
    suggestedYearsFrom: 10,
    suggestedYearsTo: 'Unlimited',
    description: 'Over 10 years',
  },
];

// Work Types
export const WORK_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Casual',
  'Internship',
  'Freelancer',
  'Volunteer',
] as const;

export type WorkType = typeof WORK_TYPES[number];

// Pay Types
export const PAY_TYPES = [
  'Hourly rate',
  'Monthly salary',
  'Annual salary',
  'Annual plus commission',
] as const;

export type PayType = typeof PAY_TYPES[number];

// Currencies (common ones, can be extended)
export const CURRENCIES = [
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
] as const;

export type Currency = typeof CURRENCIES[number];

// Get suggested currency based on country/region
export const getSuggestedCurrency = (country: string): Currency => {
  const currencyMap: Record<string, string> = {
    'Australia': 'AUD',
    'United States': 'USD',
    'Singapore': 'SGD',
    'Mainland China': 'CNY',
    'HKSAR of China': 'HKD',
    'Remote': 'USD',
  };
  
  const currencyCode = currencyMap[country] || 'USD';
  return CURRENCIES.find((c) => c.code === currencyCode) || CURRENCIES[1]; // Default to USD
};