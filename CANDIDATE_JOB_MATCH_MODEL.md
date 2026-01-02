# Candidate Job Match Model - Implementation Summary

## Overview
This document describes the new `CandidateJobMatch` model that tracks matching between candidates and job postings, with hard gate validation and behavior tracking.

## Model Architecture

### CandidateJobMatch
**Purpose**: Track matching records between candidates and job postings (triggered on CV upload)

**Key Features**:
- ✅ Hard gate validation (pass/fail with reasons)
- ✅ Structured match details (JSON storage for rule hits and LLM reasoning)
- ✅ Behavioral state tracking (viewed/interested flags)
- ✅ Unique constraint per candidate-job pair
- ✅ Optimized indexing for performance

### Database Schema

```prisma
model CandidateJobMatch {
  id           String   @id @default(uuid()) @db.Uuid
  candidateId  String   @map("candidate_id") @db.Uuid
  jobPostingId String   @map("job_posting_id") @db.Uuid
  cvId         String?  @map("cv_id") @db.Uuid

  // Hard gate 判断
  passedHardGate  Boolean  @default(false) @map("passed_hard_gate")
  hardGateReasons String[] @default([]) @map("hard_gate_reasons")

  // 匹配详情（JSON存储结构化匹配信息）
  matchDetails Json? @map("match_details")

  // 状态管理
  isActive            Boolean @default(true) @map("is_active")
  candidateViewed     Boolean @default(false) @map("candidate_viewed")
  employerViewed      Boolean @default(false) @map("employer_viewed")
  candidateInterested Boolean @default(false) @map("candidate_interested")
  employerInterested  Boolean @default(false) @map("employer_interested")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  candidate  User       @relation("CandidateMatches", fields: [candidateId], references: [id], onDelete: Cascade)
  jobPosting JobPosting @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  cv         CV?        @relation(fields: [cvId], references: [id], onDelete: SetNull)

  @@unique([candidateId, jobPostingId])
  @@index([candidateId])
  @@index([jobPostingId])
  @@index([passedHardGate])
  @@index([isActive])
  @@index([createdAt])
  @@map("candidate_job_matches")
}
```

## Related Model Updates

### User Model
**Added**:
- `candidateMatches: CandidateJobMatch[]` - Relation to match records
- `lastMatchedAt: DateTime?` - Track last matching timestamp

### JobPosting Model
**Added**:
- `candidateMatches: CandidateJobMatch[]` - Relation to match records
- `lastMatchedAt: DateTime?` - Track last matching timestamp

### CV Model
**Added**:
- `matches: CandidateJobMatch[]` - Relation to match records triggered by this CV

## Field Descriptions

### Hard Gate Fields
- **passedHardGate**: Boolean flag indicating if candidate passed basic requirements
- **hardGateReasons**: Array of strings explaining why hard gate was not passed (e.g., ["visa_requirements_not_met", "experience_too_low"])

### Match Details (JSON)
Flexible JSON field to store:
- Rule-based matching results
- LLM reasoning and scores
- Detailed skill matches
- Any other structured matching metadata

Example structure:
```typescript
{
  ruleMatches: {
    visaMatch: true,
    experienceMatch: true,
    categoryMatch: true,
    salaryMatch: false
  },
  llmScore: 85,
  llmReasoning: "Strong technical fit with some gaps in domain experience",
  skillMatches: ["Python", "React", "PostgreSQL"]
}
```

### Status Flags
- **isActive**: Whether this match is currently active (can be used to soft-delete)
- **candidateViewed**: Has the candidate viewed this job match?
- **employerViewed**: Has the employer viewed this candidate match?
- **candidateInterested**: Has the candidate expressed interest?
- **employerInterested**: Has the employer expressed interest?

## Indexes
Optimized for common query patterns:
- `candidateId` - List all matches for a candidate
- `jobPostingId` - List all matches for a job posting
- `passedHardGate` - Filter by hard gate status
- `isActive` - Filter active matches
- `createdAt` - Sort by match creation time

## Unique Constraints
- `[candidateId, jobPostingId]` - One match record per candidate-job pair
  - Prevents duplicate matching
  - Enables upsert operations for re-matching

## Cascade Behavior
- **Candidate deleted** → All their matches cascade delete
- **Job posting deleted** → All its matches cascade delete
- **CV deleted** → Match record remains but cvId set to null (SetNull)

## Architecture Philosophy
This model serves as:
1. **Hard Gate Filter**: Determines if candidate can enter the candidate pool
2. **Behavior Tracker**: Records all interaction states between candidate and employer
3. **Reset-able**: Can be recomputed/reset when matching logic changes

## Database Changes Applied
✅ Schema updated in `prisma/schema.prisma`
✅ Database synced using `prisma db push`
✅ Prisma Client regenerated with new types

## Next Steps
1. Create matching algorithm service
2. Implement hard gate validation logic
3. Build candidate pool UI for employers
4. Add match update APIs (view/interest toggles)
5. Create re-matching functionality for when CV is updated




