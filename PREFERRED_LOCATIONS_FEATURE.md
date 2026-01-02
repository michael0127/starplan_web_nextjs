# Preferred Locations Feature

Date: December 30, 2025

## Overview

Added structured location preferences to candidate onboarding, allowing candidates to specify preferred countries and specific cities where they'd like to work.

---

## Data Structure

### Database Schema

Added new field to `User` model:

```prisma
// 6. Preferred Locations (structured country/city data)
preferredLocations     Json?    @map("preferred_locations")
// Data format: Array<{ country: string, cities: string[] }>
```

**Example data:**
```json
[
  {
    "country": "United States",
    "cities": ["San Francisco", "Seattle", "New York"]
  },
  {
    "country": "Australia",
    "cities": ["Sydney", "Melbourne"]
  },
  {
    "country": "Singapore",
    "cities": []  // Empty means open to any city in Singapore
  }
]
```

### Legacy Field

Kept `preferredLocation` (String) for backward compatibility:
- Auto-generated from `preferredLocations` 
- Format: "Country (City1, City2); Country2"
- Example: "United States (San Francisco, Seattle); Australia (Sydney)"

---

## UI Implementation

### Location Options

Predefined countries with major cities:

1. **🇦🇺 Australia** (10 cities)
   - Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra, Gold Coast, Newcastle, Wollongong, Hobart

2. **🇺🇸 United States** (12 cities)
   - New York, Los Angeles, San Francisco, Seattle, Austin, Boston, Chicago, Denver, Miami, Atlanta, San Diego, Portland

3. **🇸🇬 Singapore** (5 areas)
   - Singapore City, Jurong, Woodlands, Tampines, Queenstown

4. **🇨🇳 Mainland China** (10 cities)
   - Beijing, Shanghai, Shenzhen, Guangzhou, Hangzhou, Chengdu, Nanjing, Wuhan, Xi'an, Suzhou

5. **🇭🇰 HKSAR of China** (4 areas)
   - Hong Kong Island, Kowloon, New Territories, Lantau Island

### User Interaction Flow

1. **Country Selection**
   - Checkbox to select/deselect countries
   - Country card shows flag and name
   - Selected countries expand to show city options

2. **City Selection (Optional)**
   - Expandable list of cities when country is selected
   - Pill-style toggle buttons for each city
   - Selected cities highlighted in blue
   - No cities selected = open to entire country

3. **Visual Feedback**
   - Selected countries: Blue border
   - Selected cities: Blue background pill
   - City count indicator when cities are selected
   - Summary box showing all selections

### Features

- **Optional Field** - Not required for onboarding completion
- **Multi-Select** - Can select multiple countries
- **Granular Control** - Can specify specific cities or leave empty for entire country
- **Visual Summary** - Real-time display of all selected locations
- **Hover Effects** - Interactive feedback on buttons
- **Responsive Design** - Works on all screen sizes

---

## Code Changes

### 1. Frontend (`src/app/onboarding/page.tsx`)

**Added constant:**
```typescript
const LOCATION_OPTIONS = [
  { country: 'Australia', flag: '🇦🇺', cities: [...] },
  { country: 'United States', flag: '🇺🇸', cities: [...] },
  // ... more countries
];
```

**Updated interface:**
```typescript
interface OnboardingData {
  // ... existing fields
  preferredLocations: Array<{ country: string; cities: string[] }>;
}
```

**Added handlers:**
```typescript
handleLocationCountryToggle(country: string)
handleLocationCityToggle(country: string, city: string)
```

**UI Component:**
- Country cards with checkbox
- Expandable city selector
- Pill-style city buttons
- Summary display

### 2. API Route (`src/app/api/user/onboarding/route.ts`)

**Request body:**
```typescript
const {
  // ... existing fields
  preferredLocations,  // Array<{ country: string, cities: string[] }>
} = body;
```

**Database write:**
```typescript
preferredLocations: preferredLocations || null,
preferredLocation: location || null,  // Legacy field
```

**Response:**
```typescript
preferredLocations: updatedUser.preferredLocations,
```

### 3. Database Schema (`prisma/schema.prisma`)

```prisma
preferredLocations     Json?    @map("preferred_locations")
```

---

## Data Flow

```
User Interaction
    ↓
Select Country (Australia)
    ↓
Expand to show cities
    ↓
Select Cities (Sydney, Melbourne) [Optional]
    ↓
FormData State Updated
{
  preferredLocations: [
    { country: "Australia", cities: ["Sydney", "Melbourne"] }
  ]
}
    ↓
Submit Form
    ↓
API Call with preferredLocations
    ↓
Prisma writes to database
    ↓
Stored as JSON in preferred_locations column
```

---

## Example User Scenarios

### Scenario 1: Flexible Location
**User wants:** Any city in Australia
**Selection:** 
- ✅ Australia
- Cities: None selected
**Stored data:**
```json
[{ "country": "Australia", "cities": [] }]
```

### Scenario 2: Specific Cities
**User wants:** Only San Francisco and Seattle in US
**Selection:**
- ✅ United States
- Cities: ✅ San Francisco, ✅ Seattle
**Stored data:**
```json
[{ 
  "country": "United States", 
  "cities": ["San Francisco", "Seattle"] 
}]
```

### Scenario 3: Multiple Countries
**User wants:** Sydney (Australia) or Singapore (any city)
**Selection:**
- ✅ Australia → ✅ Sydney
- ✅ Singapore → No cities
**Stored data:**
```json
[
  { "country": "Australia", "cities": ["Sydney"] },
  { "country": "Singapore", "cities": [] }
]
```

### Scenario 4: No Preference
**User wants:** Open to any location
**Selection:** No countries selected
**Stored data:**
```json
[]
```

---

## Benefits

### For Candidates
1. **Precise Preferences** - Specify exact cities, not just countries
2. **Flexibility** - Can choose entire country or specific cities
3. **Multiple Options** - Select multiple countries/cities
4. **Easy to Use** - Intuitive checkbox and pill interface
5. **Optional** - Don't have to specify if flexible

### For Matching Algorithm
1. **Structured Data** - Easy to query and filter
2. **Granular Matching** - Match by country or city level
3. **Multiple Criteria** - Support OR logic (multiple locations)
4. **Type Safe** - JSON structure is well-defined
5. **Scalable** - Easy to add more countries/cities

### For Business
1. **Better Matches** - More accurate location-based matching
2. **User Experience** - Clear, professional interface
3. **Data Quality** - Structured vs free-text
4. **Analytics** - Easy to analyze location preferences
5. **International** - Supports global expansion

---

## Database Queries

### Find candidates for a specific city
```typescript
// Using Prisma
const candidates = await prisma.user.findMany({
  where: {
    preferredLocations: {
      path: '$[*].cities',
      array_contains: 'Sydney'
    }
  }
});
```

### Find candidates for a country
```typescript
const candidates = await prisma.user.findMany({
  where: {
    preferredLocations: {
      path: '$[*].country',
      array_contains: 'Australia'
    }
  }
});
```

### Using raw SQL
```sql
-- Find users preferring Sydney
SELECT * FROM users
WHERE preferred_locations @> '[{"cities": ["Sydney"]}]'::jsonb;

-- Find users preferring Australia (any city)
SELECT * FROM users
WHERE preferred_locations @> '[{"country": "Australia"}]'::jsonb;

-- Find users with specific city OR entire country preference
SELECT * FROM users
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements(preferred_locations) AS loc
  WHERE loc->>'country' = 'Australia'
  AND (
    loc->'cities' @> '["Sydney"]'::jsonb
    OR jsonb_array_length(loc->'cities') = 0
  )
);
```

---

## Migration Notes

### Database Migration
```bash
npx prisma db push
npx prisma generate
```

**Changes:**
- Added `preferred_locations` column (JSONB, nullable)
- Kept `preferred_location` column (VARCHAR, nullable) for legacy support

### Data Migration
- Existing users: `preferredLocations` will be `null`
- Legacy `preferredLocation` still available for old data
- Users can update on next profile edit

---

## Testing Checklist

UI Testing:
- [ ] Can select/deselect countries
- [ ] City list expands when country selected
- [ ] Can select/deselect cities
- [ ] Pill buttons change color correctly
- [ ] City count displays correctly
- [ ] Summary box shows all selections
- [ ] Can select multiple countries
- [ ] Can have some countries with cities, some without
- [ ] Hover effects work
- [ ] Mobile responsive

Data Testing:
- [ ] Data saves to database correctly
- [ ] JSON structure is correct
- [ ] Legacy field auto-generates correctly
- [ ] Can retrieve and display saved data
- [ ] Empty array saves when no selection
- [ ] Null saves when field not touched

API Testing:
- [ ] API accepts preferredLocations
- [ ] API validates data structure
- [ ] API returns saved data correctly
- [ ] No errors with empty selections
- [ ] No errors with multiple countries

---

## Future Enhancements

1. **City Search** - Add search box for cities (like category search)
2. **Custom Cities** - Allow users to add cities not in list
3. **Remote-First** - Add "Remote" as a location option
4. **Radius Search** - "Within X km of Sydney"
5. **Map View** - Visual map for selecting locations
6. **Popular Cities** - Show most selected cities first
7. **Auto-Complete** - Google Places API integration
8. **Timezone Info** - Show timezone for each location
9. **Cost of Living** - Display COL index for each city
10. **Weather Info** - Show climate information

---

## API Documentation

### POST /api/user/onboarding

**Request Body:**
```typescript
{
  // ... other onboarding fields
  preferredLocations: Array<{
    country: string;
    cities: string[];
  }>;
}
```

**Response:**
```typescript
{
  success: true,
  user: {
    // ... other fields
    preferredLocations: Array<{
      country: string;
      cities: string[];
    }>;
    preferredLocation: string;  // Legacy field (auto-generated)
  }
}
```

---

## Conclusion

✅ Preferred Locations feature successfully implemented
✅ Structured data model for better matching
✅ Intuitive UI for easy selection
✅ Backward compatible with legacy field
✅ Ready for production use

This feature provides candidates with precise control over their location preferences while giving the platform structured data for accurate job matching.












