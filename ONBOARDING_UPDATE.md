# Candidate Onboarding Update - December 30, 2025

## Overview
Updated the candidate onboarding process to collect comprehensive job preferences that match the fields available in the Job Posting flow. This ensures better job matching by capturing detailed candidate preferences.

## Database Schema Updates

### New Fields Added to `User` Model (in `prisma/schema.prisma`)

#### 1. Work Authorization
- `workAuthCountries: String[]` - Countries where candidate has work authorization
- `workAuthByCountry: Json` - Visa/authorization type by country (e.g., `{"Australia": "Citizen", "United States": "H1B"}`)

#### 2. Categories & Skills
- `categories: String[]` - Job categories the candidate is interested in (115 predefined categories from CSV)
- `categorySkills: String[]` - Skills within selected categories

#### 3. Experience
- `experienceLevel: String?` - Experience level (Intern, Graduates, Junior, Intermediate, Senior, Director, C-Level)
- `experienceYearsFrom: Int?` - Minimum years of experience
- `experienceYearsTo: String?` - Maximum years or "Unlimited"

#### 4. Work Type
- `workTypes: String[]` - Preferred work types (Full-time, Part-time, Contract, Casual, Internship, Freelancer, Volunteer)
- `remoteOpen: Boolean` - Whether candidate is open to remote work

#### 5. Salary Expectations
- `payType: String?` - Preferred payment type (Hourly rate, Monthly salary, Annual salary, Annual plus commission)
- `currency: String?` - Preferred currency (defaults to "aud")
- `salaryExpectationFrom: String?` - Minimum salary expectation
- `salaryExpectationTo: String?` - Maximum salary expectation

### Legacy Fields (Kept for Backward Compatibility)
- `jobFunction: String?`
- `jobTypes: String[]`
- `preferredLocation: String?`
- `h1bSponsorship: Boolean`

## UI Updates

### Onboarding Page (`src/app/onboarding/page.tsx`)

#### Step 1 - Job Preferences Form
Updated to collect:

1. **Job Categories** (Required)
   - Collapsible scrollable list with 115 predefined categories
   - **🔍 Fuzzy search with Fuse.js** (same implementation as Job Posting)
     - Intelligent fuzzy matching (threshold: 0.4)
     - Searches entire string, not just beginning
     - Minimum 2 characters to trigger search
     - Real-time results as you type
   - Search results show count of matching categories
   - Multi-select with visual badges showing selections
   - Hover effects on category options
   - Categories organized by domain (AI/ML, Data Science, Software Engineering, etc.)

2. **Experience Level** (Required)
   - Dropdown with 7 experience levels
   - Auto-fills suggested years of experience range

3. **Work Type** (Required)
   - Multi-select checkboxes for 7 work types
   - Additional checkbox for "Open to Remote Work"

4. **Salary Expectations** (Optional)
   - Pay type selector (Hourly/Monthly/Annual)
   - Currency selector with 7 major currencies (AUD, USD, SGD, CNY, HKD, EUR, GBP)
   - Salary range input (From/To)

5. **Work Authorization** (Required)
   - Country selection with checkboxes (Australia, United States, Singapore, Mainland China, HKSAR)
   - **Radio button selection** for authorization type (matches Job Posting UI exactly)
   - Comprehensive country-specific options imported from `WORK_AUTH_OPTIONS`:
     - **Australia** (11 options): Australian citizen, Permanent resident/NZ citizen, Family/partner visa, Graduate visa, Holiday visa, Regional visa restrictions, Protection visa, Doctoral student visa, Student visa restrictions, Industry restrictions, Sponsorship requirements
     - **United States** (18 options): U.S. citizen, Green Card, Asylum/refugee, EAD, H-1B (current/transfer/initial), F-1 OPT/STEM OPT, J-1 visa, L-1 visa, TN visa, O-1 visa, E-3/H-1B1, E-2 visa, Other temporary visa, No authorization, Requires sponsorship
     - **Singapore** (16 options): Citizen, PR, Employment Pass, S Pass, Work Permit, PEP, EntrePass, Dependant's Pass (with/without LOC), LTVP (with/without LOC), Training passes, Requires sponsorship, No authorization, Other
     - **Mainland China** (12 options in Chinese): 中国大陆公民、永久居留证、港澳居民居住证、台湾居民居住证、外国人工作许可证（当前/变更）、工作类签证、需要办理许可、学习签证、访问签证、无合法授权、其他情况
     - **HKSAR of China** (15 options): HKPR, Right of Abode, Right to Land, Employment visa (GEP/ASMTP), QMAS, IANG, Dependant Visa (with/without work rights), Training Visa, Working Holiday, Student Visa, Requires sponsorship, No authorization, Other

#### Step 2 - Resume Upload
- No changes (existing functionality maintained)

### Form Validation
- At least one job category required
- At least one work type required
- At least one country with work authorization required
- Work authorization type must be specified for each selected country

## API Updates

### Onboarding API (`src/app/api/user/onboarding/route.ts`)

Updated `POST /api/user/onboarding` to:
- Accept all new onboarding fields
- Validate required fields (categories, workTypes, workAuthCountries)
- Save all fields to the database
- Maintain backward compatibility with legacy fields
- Return complete user profile in response

## Data Flow

### Frontend to API
```typescript
{
  categories: string[],
  categorySkills: string[],
  experienceLevel: string,
  experienceYearsFrom: number,
  experienceYearsTo: number | 'Unlimited',
  workTypes: string[],
  remoteOpen: boolean,
  payType: string,
  currency: string,
  salaryExpectationFrom: string,
  salaryExpectationTo: string,
  workAuthCountries: string[],
  workAuthByCountry: Record<string, string>,
  // Legacy fields for backward compatibility
  jobFunction: string,
  jobTypes: string[],
  h1bSponsorship: boolean
}
```

## Constants Imported

The onboarding page now uses the **exact same constants** as the job posting flow from `@/lib/jobConstants` and `@/lib/screeningOptions`:
- `COUNTRIES_REGIONS` - Country/region options with flags (from jobConstants)
- `EXPERIENCE_LEVELS` - Experience levels with suggested years (from jobConstants)
- `WORK_TYPES` - Available work types (from jobConstants)
- `PAY_TYPES` - Payment type options (from jobConstants)
- `CURRENCIES` - Currency options with symbols (from jobConstants)
- `WORK_AUTH_OPTIONS` - Comprehensive work authorization options by country (from screeningOptions) ✨ **NEW**

### Work Authorization Options Detail

The `WORK_AUTH_OPTIONS` provides the exact same authorization options used in the Job Posting flow:
- **Australia**: 11 detailed visa/authorization types
- **United States**: 18 detailed visa/authorization types
- **Singapore**: 16 detailed pass/authorization types  
- **Mainland China**: 12 authorization types (in Chinese)
- **HKSAR of China**: 15 detailed visa/authorization types

This ensures perfect alignment between what employers require and what candidates can provide.

## Technical Implementation - Fuzzy Search with Fuse.js

The category search uses **Fuse.js** for intelligent fuzzy matching (same as Job Posting):

```typescript
import Fuse from 'fuse.js';

// Configure Fuse.js (identical to categoryRecommendation.ts in Job Posting)
const fuse = useMemo(() => {
  const searchData = ALL_CATEGORIES.map(cat => ({ category: cat }));
  return new Fuse(searchData, {
    keys: ['category'],
    threshold: 0.4, // 0 = perfect match, 1 = match anything
    includeScore: true,
    minMatchCharLength: 2,
    ignoreLocation: true, // Search in entire string, not just beginning
  });
}, []);

// Fuzzy search implementation
const filteredCategories = useMemo(() => {
  if (categorySearchTerm.trim() === '') {
    return ALL_CATEGORIES;
  }
  
  const results = fuse.search(categorySearchTerm);
  return results.map(result => result.item.category);
}, [categorySearchTerm, fuse]);
```

**Advantages:**
- ✅ **Fuzzy matching** - Tolerates typos and partial matches
- ✅ **Smart ranking** - Results sorted by relevance score
- ✅ **Performance** - `useMemo` caches Fuse instance and search results
- ✅ **Consistency** - Uses exact same algorithm as Job Posting category recommendation

**Search Examples:**
- "machne learning" → Matches "Machine Learning Engineer" (typo tolerance)
- "data sci" → Matches "Data Scientist", "Data Science" roles (partial match)
- "ai eng" → Matches "AI Engineer", "Generative AI Engineer" (fuzzy match)

## Job Categories

All 115 job categories from `ai_tech_categories_skill_list.csv` are now available:
- Artificial Intelligence / Machine Learning (14 roles)
- Data Science & Analytics (8 roles)
- Data Engineering (6 roles)
- Software Engineering (11 roles)
- Cloud & Infrastructure (6 roles)
- Security & Cybersecurity (8 roles)
- Product & Project Roles (8 roles)
- Robotics & Autonomous Systems (6 roles)
- Hardware & Semiconductor (7 roles)
- Tech Leadership (8 roles)
- IT & Systems (6 roles)
- Tech in Business Functions (5 roles)
- GenerativeAI (11 roles)
- Design (10 roles)

## Migration

Database migration has been applied using:
```bash
npx prisma db push
npx prisma generate
```

All new fields are now available in the database and Prisma Client.

## Benefits

1. **Better Job Matching**: Candidates provide detailed preferences that align with job posting requirements
2. **Comprehensive Work Authorization**: Multiple countries and visa types captured
3. **Salary Transparency**: Optional salary expectations help with better matching
4. **Experience Alignment**: Precise experience level and years of experience
5. **Work Flexibility**: Clear indication of work type preferences and remote work openness
6. **Category Precision**: 115 specific job categories vs. generic job functions

## Testing Checklist

- [ ] Onboarding form displays all new fields
- [ ] Category selection works (expand/collapse, multi-select)
- [ ] **Category search works - filters in real-time** ✨
- [ ] **Search shows match count correctly** ✨
- [ ] **Search clears when collapsing category selector** ✨
- [ ] **"No categories found" message displays when no matches** ✨
- [ ] Hover effects work on category options
- [ ] Experience level auto-fills years
- [ ] Work type multi-select works
- [ ] Salary fields accept input
- [ ] Work authorization country selection works (checkbox)
- [ ] Work authorization radio options display when country selected
- [ ] All country-specific work auth options show correctly (AU: 11, US: 18, SG: 16, CN: 12, HK: 15)
- [ ] Radio button selection works and updates correctly
- [ ] Form validation works (required fields)
- [ ] Form validation checks work auth is selected for each checked country
- [ ] Resume upload still works (Step 2)
- [ ] Data saves correctly to database
- [ ] API returns complete user profile
- [ ] Navigate to /explore after completion
- [ ] UI matches Job Posting flow styling (radio buttons, hover effects, colors)

## Future Enhancements

1. Add skill suggestions based on selected categories
2. ~~Implement category search/filter~~ ✅ **COMPLETED**
3. Add salary range validation
4. Show recommended categories based on resume analysis
5. Add tooltips/help text for work authorization types
6. Make salary expectations more prominent/guided
7. Add keyboard navigation for category search (arrow keys, Enter to select)
8. Highlight search terms in results
9. Add recent/popular categories suggestions

