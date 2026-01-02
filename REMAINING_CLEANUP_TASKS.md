# Remaining Cleanup Tasks for Removed Fields

## Status: Additional Files Need Updates ⚠️

The following files still reference the removed fields (`jobFunction`, `h1bSponsorship`) and need to be updated:

---

## Files Requiring Updates

### 1. `src/app/profile/page.tsx`

**Current References:**
- Line 155: `jobFunction: data.data.jobFunction`
- Line 159: `h1bSponsorship: data.data.h1bSponsorship`
- Line 508: Display `dbUser.jobFunction`
- Line 533-534: Display `dbUser.h1bSponsorship`

**Required Changes:**
- Remove `jobFunction` and `h1bSponsorship` from API call
- Update display to show `categories` instead of `jobFunction`
- Update display to show `workAuthByCountry` instead of `h1bSponsorship`

### 2. `src/components/profile/EditPanel.tsx`

**Current References:**
- Line 110: `jobFunction: (profile as any)?.jobFunction`
- Line 114: `h1bSponsorship: (profile as any)?.h1bSponsorship`
- Line 868-869: Select input for `jobFunction`
- Line 957-963: Checkbox for `h1bSponsorship`

**Required Changes:**
- Remove `jobFunction` field from `employmentData` state
- Remove `h1bSponsorship` field from `employmentData` state
- Replace `jobFunction` select with `categories` multi-select
- Replace `h1bSponsorship` checkbox with `workAuthByCountry` selector

### 3. `src/lib/user.ts`

**Current References:**
Need to check if this file has type definitions or utilities referencing removed fields.

### 4. `src/app/api/user/[id]/route.ts`

**Current References:**
Need to check if this API route returns or expects removed fields.

### 5. `src/app/onboarding/page.module.css`

**Current References:**
Likely just CSS classes, should be safe but verify no unused styles.

---

## Recommended Approach

### Option 1: Complete Replacement (Recommended)

Update profile and edit pages to use new comprehensive fields:

**Profile Display:**
```typescript
// Instead of:
jobFunction: "Machine Learning Engineer"

// Show:
categories: ["Machine Learning Engineer (AI/ML)", "Data Scientist"]
workAuthCountries: ["United States", "Australia"]
workAuthByCountry: {
  "United States": "I require H-1B transfer sponsorship",
  "Australia": "I'm an Australian citizen"
}
```

**Edit Panel:**
- Use the same category selector from onboarding (with Fuse.js search)
- Use the same work auth selector from onboarding (country + type)

### Option 2: Temporary Fallback (Not Recommended)

Keep displaying old fields for users who have them, but hide for new users:

```typescript
// Display old data if exists, otherwise show new fields
{dbUser.jobFunction ? (
  <div>Job Function: {dbUser.jobFunction}</div>
) : (
  <div>Categories: {dbUser.categories?.join(', ')}</div>
)}
```

**Why not recommended:** Creates inconsistent UX and maintains technical debt.

---

## Implementation Plan

### Phase 1: Profile View Page ✓ TODO

File: `src/app/profile/page.tsx`

1. Remove `jobFunction` and `h1bSponsorship` from API payload
2. Update display section:
   - Replace "Job Function" with "Categories"
   - Display `categories` array as badges
   - Replace "H1B Sponsorship" with "Work Authorization"
   - Display `workAuthCountries` with their auth types

### Phase 2: Edit Panel Component ✓ TODO

File: `src/components/profile/EditPanel.tsx`

1. Remove legacy fields from `employmentData` state
2. Add new fields to state:
   ```typescript
   categories: string[]
   workAuthCountries: string[]
   workAuthByCountry: Record<string, string>
   ```
3. Replace job function selector with category multi-select (reuse from onboarding)
4. Replace H1B checkbox with work auth selector (reuse from onboarding)

### Phase 3: API Routes ✓ TODO

File: `src/app/api/user/[id]/route.ts`

1. Check if GET endpoint returns removed fields
2. Check if PUT/PATCH endpoint accepts removed fields
3. Update to use new fields only

### Phase 4: Utilities ✓ TODO

File: `src/lib/user.ts`

1. Check for type definitions
2. Update interfaces/types to remove old fields
3. Add helper functions if needed for new fields

### Phase 5: CSS Cleanup ✓ TODO

File: `src/app/onboarding/page.module.css`

1. Remove unused CSS classes related to old fields
2. Keep only styles used by current implementation

---

## Migration Strategy for Existing Users

### Scenario 1: User with Old Data Only
- Old fields: `jobFunction`, `h1bSponsorship` exist
- New fields: Empty
- **Solution:** Show migration prompt to update profile with new format

### Scenario 2: User with Both Old and New Data
- Old fields: Have data
- New fields: Have data (from recent onboarding)
- **Solution:** Use new fields, ignore old fields

### Scenario 3: New User
- Old fields: Don't exist in schema
- New fields: Have data
- **Solution:** Normal flow, use new fields

---

## Testing Checklist

After completing all updates:

- [ ] Profile page displays categories correctly
- [ ] Profile page displays work authorization correctly
- [ ] Edit panel allows selecting categories
- [ ] Edit panel allows selecting work auth by country
- [ ] API routes handle new fields correctly
- [ ] No TypeScript errors
- [ ] No linter warnings
- [ ] Old field references completely removed
- [ ] Existing users can view their profiles
- [ ] Existing users can edit their profiles
- [ ] New users can complete onboarding
- [ ] Profile data saves correctly

---

## Search Commands to Find Remaining References

```bash
# Search for jobFunction
grep -r "jobFunction" src/ --exclude-dir=node_modules

# Search for h1bSponsorship  
grep -r "h1bSponsorship" src/ --exclude-dir=node_modules

# Search for job_function (snake_case)
grep -r "job_function" src/ --exclude-dir=node_modules

# Search for h1b_sponsorship (snake_case)
grep -r "h1b_sponsorship" src/ --exclude-dir=node_modules
```

---

## Priority

**HIGH** - These files are user-facing and will break if:
- Users try to edit their profile
- Users try to view their complete profile
- API calls expect removed fields

**Recommended Action:** Complete Phase 1 and Phase 2 immediately to maintain profile functionality.

---

## Next Steps

1. ✅ Schema updated (completed)
2. ✅ Onboarding API updated (completed)
3. ✅ Onboarding frontend updated (completed)
4. ✅ Database migrated (completed)
5. ⏭️ Update Profile page (Phase 1)
6. ⏭️ Update Edit Panel (Phase 2)
7. ⏭️ Update User API routes (Phase 3)
8. ⏭️ Update utilities (Phase 4)
9. ⏭️ CSS cleanup (Phase 5)
10. ⏭️ End-to-end testing

---

## Estimated Effort

| Task | Files | Est. Time |
|------|-------|-----------|
| Profile View | 1 | 30 min |
| Edit Panel | 1 | 1 hour |
| API Routes | 1 | 30 min |
| Utilities | 1 | 15 min |
| CSS Cleanup | 1 | 15 min |
| Testing | All | 1 hour |
| **Total** | **5** | **~3.5 hours** |

---

## Conclusion

Core onboarding flow is clean ✅, but profile management features need updates to complete the migration from old fields to new comprehensive fields.












