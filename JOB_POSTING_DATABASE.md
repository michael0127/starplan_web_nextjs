# Job Posting Database Structure & API Documentation

## 📊 Database Schema

### Tables Overview

The job posting system consists of 3 main tables:

1. **job_postings** - Main job posting data
2. **system_screening_answers** - System screening question responses
3. **custom_screening_questions** - Custom screening questions

---

## 🗄️ Table Structures

### 1. job_postings

Main table storing all job posting information across the 3-step workflow.

**Columns:**

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `id` | UUID | Primary key | ✅ |
| `user_id` | UUID | Foreign key to users table | ✅ |
| `status` | Enum | DRAFT, PUBLISHED, CLOSED, ARCHIVED | ✅ (Default: DRAFT) |
| `created_at` | Timestamp | Creation timestamp | ✅ |
| `updated_at` | Timestamp | Last update timestamp | ✅ |

**Step 1: Job Classification Fields**

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `job_title` | Text | Job title | ✅ |
| `category` | Text | Job category | ✅ |
| `category_skills` | Text[] | Skills array | ✅ (Default: []) |
| `is_category_manually_selected` | Boolean | Manual category flag | ✅ (Default: false) |
| `country_region` | Text | Primary work location | ✅ |
| `experience_level` | Text | Experience level | ✅ |
| `experience_years_from` | Integer | Min years of experience | ✅ |
| `experience_years_to` | Text | Max years ("Unlimited" or number) | ✅ |
| `work_type` | Text | Full-time/Part-time/Contract/Internship | ✅ |
| `pay_type` | Text | Annual/Hourly/Daily/Project-based | ✅ |
| `currency` | Text | Currency code (AUD, USD, etc.) | ✅ |
| `pay_from` | Text | Minimum pay | ✅ |
| `pay_to` | Text | Maximum pay | ✅ |
| `show_salary_on_ad` | Boolean | Display salary publicly | ✅ (Default: true) |
| `salary_display_text` | Text | Custom salary text | ❌ |

**Step 2: Job Details Fields**

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `company_name` | Text | Company name | ✅ |
| `job_description` | Text | Full job description | ✅ |
| `job_summary` | Text | Short summary (250 chars max) | ✅ |
| `key_selling_point_1` | Text | First selling point | ❌ |
| `key_selling_point_2` | Text | Second selling point | ❌ |
| `key_selling_point_3` | Text | Third selling point | ❌ |
| `company_logo` | Text | Logo (Base64 or URL) | ❌ |
| `company_cover_image` | Text | Cover image (Base64 or URL) | ❌ |
| `video_link` | Text | YouTube video link | ❌ |

**Step 3: Screening & Filters Fields**

| Column | Type | Description | Required |
|--------|------|-------------|----------|
| `selected_countries` | Text[] | Countries for work authorization | ✅ (Default: []) |
| `work_auth_by_country` | JSONB | Country -> work auth option mapping | ❌ |
| `application_deadline` | Timestamp | Application deadline | ❌ |

---

### 2. system_screening_answers

Stores answers to the 4 predefined system screening questions.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `job_posting_id` | UUID | Foreign key to job_postings |
| `question_id` | Text | Question identifier |
| `requirement` | Text | 'must-have', 'preferred', 'accept-any' |
| `selected_answers` | Text[] | Selected answer options |
| `created_at` | Timestamp | Creation timestamp |

**System Questions:**
- `programming_languages` - Multiple choice
- `english_proficiency` - Single choice
- `engineering_qualification` - Single choice
- `ml_experience` - Single choice

---

### 3. custom_screening_questions

Stores custom screening questions created by employers.

**Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `job_posting_id` | UUID | Foreign key to job_postings |
| `question_text` | Text | Question text |
| `answer_type` | Text | 'single', 'multiple', 'yes-no', 'short-text' |
| `options` | Text[] | Answer options (for single/multiple) |
| `must_answer` | Boolean | Required question flag |
| `ideal_answer` | JSONB | Ideal answer (string or string[]) |
| `disqualify_if_not_ideal` | Boolean | Auto-disqualify flag |
| `created_at` | Timestamp | Creation timestamp |

---

## 🔌 API Endpoints

### Base URL
```
/api/job-postings
```

---

### 1. Create Job Posting

**Endpoint:** `POST /api/job-postings`

**Authentication:** Required (Supabase session)

**Request Body:**
```typescript
{
  // Step 1: Classification
  jobTitle: string;
  category: string;
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
  
  // Step 2: Job Details
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
  systemScreeningAnswers: Array<{
    questionId: string;
    requirement: 'must-have' | 'preferred' | 'accept-any';
    selectedAnswers: string[];
  }>;
  customScreeningQuestions: Array<{
    questionText: string;
    answerType: 'single' | 'multiple' | 'yes-no' | 'short-text';
    options?: string[];
    mustAnswer: boolean;
    idealAnswer?: string | string[];
    disqualifyIfNotIdeal: boolean;
  }>;
  applicationDeadline: string;
  
  // Optional
  status?: 'DRAFT' | 'PUBLISHED';
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "status": "DRAFT",
    ...
  }
}
```

**Error Response (401/500):**
```json
{
  "error": "Error message"
}
```

---

### 2. Update Job Posting

**Endpoint:** `POST /api/job-postings`

**Authentication:** Required

**Request Body:** Same as create, but include:
```typescript
{
  id: string; // Job posting ID to update
  ...
}
```

**Success Response (200):** Same as create

---

### 3. Get All Job Postings

**Endpoint:** `GET /api/job-postings`

**Authentication:** Required

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT, PUBLISHED, CLOSED, ARCHIVED)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "status": "DRAFT",
      "jobTitle": "Machine Learning Engineer",
      "systemScreeningAnswers": [...],
      "customScreeningQuestions": [...],
      ...
    }
  ]
}
```

---

### 4. Get Job Posting by ID

**Endpoint:** `GET /api/job-postings/[id]`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "status": "DRAFT",
    "systemScreeningAnswers": [...],
    "customScreeningQuestions": [...],
    ...
  }
}
```

**Error Response:**
- 401: Unauthorized
- 403: Forbidden (not owner)
- 404: Not found

---

### 5. Delete Job Posting

**Endpoint:** `DELETE /api/job-postings/[id]`

**Authentication:** Required

**Success Response (200):**
```json
{
  "success": true,
  "message": "Job posting deleted successfully"
}
```

**Error Response:**
- 401: Unauthorized
- 403: Forbidden (not owner)
- 404: Not found

---

### 6. Update Job Posting Status

**Endpoint:** `PATCH /api/job-postings/[id]`

**Authentication:** Required

**Request Body:**
```json
{
  "status": "PUBLISHED"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PUBLISHED",
    ...
  }
}
```

**Error Response:**
- 400: Invalid status
- 401: Unauthorized
- 403: Forbidden (not owner)
- 404: Not found

---

## 📝 Usage Examples

### Example 1: Create Draft Job Posting

```typescript
const response = await fetch('/api/job-postings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'DRAFT',
    jobTitle: 'Senior ML Engineer',
    category: 'Machine Learning Engineer (AI / ML)',
    categorySkills: ['Python', 'PyTorch', 'TensorFlow'],
    isCategoryManuallySelected: false,
    countryRegion: 'Australia',
    experienceLevel: 'Senior',
    experienceYearsFrom: 5,
    experienceYearsTo: 10,
    workType: 'Full-time',
    payType: 'Annual salary',
    currency: 'AUD',
    payFrom: '150000',
    payTo: '200000',
    showSalaryOnAd: true,
    salaryDisplayText: '',
    companyName: 'StarPlan Technologies',
    jobDescription: 'We are seeking an experienced ML Engineer...',
    jobSummary: 'Join our AI team to build cutting-edge solutions.',
    keySellingPoint1: 'Competitive salary + equity',
    keySellingPoint2: 'Work on AI/ML projects',
    keySellingPoint3: 'Flexible remote work',
    companyLogo: '',
    companyCoverImage: '',
    videoLink: '',
    selectedCountries: ['Australia', 'United States'],
    workAuthByCountry: {
      'Australia': "I'm an Australian citizen",
      'United States': "I hold an H-1B visa"
    },
    systemScreeningAnswers: [
      {
        questionId: 'programming_languages',
        requirement: 'must-have',
        selectedAnswers: ['Python', 'PyTorch']
      }
    ],
    customScreeningQuestions: [
      {
        questionText: 'Do you have experience with Kubernetes?',
        answerType: 'yes-no',
        mustAnswer: true,
        idealAnswer: 'Yes',
        disqualifyIfNotIdeal: true
      }
    ],
    applicationDeadline: '2024-12-31'
  })
});

const data = await response.json();
console.log(data.data.id); // Job posting ID
```

### Example 2: Get All Draft Job Postings

```typescript
const response = await fetch('/api/job-postings?status=DRAFT');
const data = await response.json();
console.log(data.data); // Array of draft job postings
```

### Example 3: Publish Job Posting

```typescript
const response = await fetch(`/api/job-postings/${jobId}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'PUBLISHED'
  })
});

const data = await response.json();
console.log(data.data.status); // "PUBLISHED"
```

---

## 🔐 Security

- All endpoints require authentication via Supabase session
- Users can only access their own job postings
- Foreign key constraints ensure data integrity
- Cascade delete removes related screening answers/questions

---

## 📊 Database Relationships

```
users
  └── job_postings (one-to-many)
        ├── system_screening_answers (one-to-many)
        └── custom_screening_questions (one-to-many)
```

---

## 🚀 Migration

Migration file: `20251214021819_add_job_posting_models`

To apply migration:
```bash
npx prisma migrate dev
```

To generate Prisma client:
```bash
npx prisma generate
```

---

## 📦 TypeScript Types

Import types from:
```typescript
import type { 
  JobPosting, 
  JobPostingFormData,
  SystemScreeningAnswer,
  CustomScreeningQuestion 
} from '@/types/jobPosting';
```

---

## ✅ Summary

- ✅ Complete database schema for 3-step job posting flow
- ✅ RESTful API endpoints for CRUD operations
- ✅ TypeScript type definitions
- ✅ Authentication & authorization
- ✅ Cascade delete support
- ✅ Status management (DRAFT → PUBLISHED → CLOSED → ARCHIVED)
- ✅ Support for all form fields from the UI
- ✅ Relational data for screening questions

The system is ready to save and retrieve all job posting data! 🎉











