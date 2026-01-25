/**
 * Location Data Utilities
 * 
 * Uses the country-state-city package to provide comprehensive
 * city data for all supported countries.
 * 
 * Data source: https://github.com/dr5hn/countries-states-cities-database
 * Contains 250+ countries, 5000+ states, and 151,000+ cities
 */

import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

// Map our country names to ISO country codes
// These match the countries in COUNTRIES_REGIONS from jobConstants.ts
export const COUNTRY_ISO_MAP: Record<string, string> = {
  'Australia': 'AU',
  'United States': 'US',
  'Singapore': 'SG',
  'Mainland China': 'CN',
  'HKSAR of China': 'HK',
};

// Country flags for display
export const COUNTRY_FLAGS: Record<string, string> = {
  'Australia': '🇦🇺',
  'United States': '🇺🇸',
  'Singapore': '🇸🇬',
  'Mainland China': '🇨🇳',
  'HKSAR of China': '🇭🇰',
};

// Supported countries for the application
export const SUPPORTED_COUNTRIES = [
  'Australia',
  'United States',
  'Singapore',
  'Mainland China',
  'HKSAR of China',
] as const;

export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

/**
 * Get all cities for a given country
 * @param countryName - The country name (e.g., 'Australia', 'United States')
 * @returns Array of city objects with name and state information
 */
export function getCitiesForCountry(countryName: string): ICity[] {
  const isoCode = COUNTRY_ISO_MAP[countryName];
  if (!isoCode) {
    console.warn(`Country "${countryName}" not found in ISO map`);
    return [];
  }
  
  return City.getCitiesOfCountry(isoCode) || [];
}

/**
 * Get city names for a given country (simple string array)
 * @param countryName - The country name
 * @returns Array of city name strings
 */
export function getCityNamesForCountry(countryName: string): string[] {
  const cities = getCitiesForCountry(countryName);
  return cities.map(city => city.name);
}

/**
 * Get states/provinces for a given country
 * @param countryName - The country name
 * @returns Array of state objects
 */
export function getStatesForCountry(countryName: string): IState[] {
  const isoCode = COUNTRY_ISO_MAP[countryName];
  if (!isoCode) {
    console.warn(`Country "${countryName}" not found in ISO map`);
    return [];
  }
  
  return State.getStatesOfCountry(isoCode) || [];
}

/**
 * Get cities grouped by state for a country
 * @param countryName - The country name
 * @returns Map of state name to array of city names
 */
export function getCitiesGroupedByState(countryName: string): Map<string, string[]> {
  const isoCode = COUNTRY_ISO_MAP[countryName];
  if (!isoCode) {
    return new Map();
  }
  
  const states = State.getStatesOfCountry(isoCode) || [];
  const result = new Map<string, string[]>();
  
  for (const state of states) {
    const cities = City.getCitiesOfState(isoCode, state.isoCode) || [];
    if (cities.length > 0) {
      result.set(state.name, cities.map(c => c.name));
    }
  }
  
  return result;
}

/**
 * Get major/popular cities for a country
 * Returns a curated list of the most important cities
 * @param countryName - The country name
 * @param limit - Maximum number of cities to return (default: 50)
 * @returns Array of city names
 */
export function getMajorCitiesForCountry(countryName: string, limit: number = 50): string[] {
  // Major cities by country (curated list of most important cities)
  const majorCities: Record<string, string[]> = {
    'Australia': [
      'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide',
      'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong',
      'Hobart', 'Geelong', 'Townsville', 'Cairns', 'Darwin',
      'Toowoomba', 'Ballarat', 'Bendigo', 'Albury', 'Launceston',
      'Mackay', 'Rockhampton', 'Bunbury', 'Bundaberg', 'Hervey Bay',
    ],
    'United States': [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
      'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
      'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
      'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston',
      'El Paso', 'Nashville', 'Detroit', 'Portland', 'Las Vegas',
      'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
      'Tucson', 'Fresno', 'Sacramento', 'Atlanta', 'Kansas City',
      'Miami', 'Oakland', 'Minneapolis', 'Cleveland', 'Raleigh',
      'Tampa', 'Pittsburgh', 'Cincinnati', 'Orlando', 'St. Louis',
      'Salt Lake City', 'Honolulu', 'Richmond', 'Buffalo', 'Hartford',
    ],
    'Singapore': [
      'Singapore', 'Jurong West', 'Woodlands', 'Tampines', 'Hougang',
      'Sengkang', 'Punggol', 'Yishun', 'Ang Mo Kio', 'Bukit Batok',
      'Choa Chu Kang', 'Bukit Panjang', 'Bedok', 'Clementi', 'Pasir Ris',
      'Toa Payoh', 'Queenstown', 'Geylang', 'Serangoon', 'Kallang',
    ],
    'Mainland China': [
      'Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Chengdu',
      'Hangzhou', 'Chongqing', 'Wuhan', 'Xi\'an', 'Suzhou',
      'Nanjing', 'Tianjin', 'Zhengzhou', 'Changsha', 'Dongguan',
      'Shenyang', 'Qingdao', 'Ningbo', 'Dalian', 'Xiamen',
      'Jinan', 'Fuzhou', 'Kunming', 'Harbin', 'Nanchang',
      'Changchun', 'Hefei', 'Nanning', 'Guiyang', 'Shijiazhuang',
      'Taiyuan', 'Wenzhou', 'Wuxi', 'Foshan', 'Zhuhai',
      'Huizhou', 'Zhongshan', 'Jiaxing', 'Shaoxing', 'Quanzhou',
      'Yantai', 'Weifang', 'Luoyang', 'Linyi', 'Tangshan',
      'Lanzhou', 'Urumqi', 'Hohhot', 'Xining', 'Yinchuan',
    ],
    'HKSAR of China': [
      'Hong Kong', 'Kowloon', 'Tsuen Wan', 'Sha Tin', 'Tuen Mun',
      'Yuen Long', 'Tai Po', 'Sai Kung', 'Kwai Chung', 'Tsing Yi',
      'Tseung Kwan O', 'Fanling', 'Sheung Shui', 'Tin Shui Wai', 'Ma On Shan',
      'Central', 'Wan Chai', 'Causeway Bay', 'North Point', 'Aberdeen',
    ],
  };
  
  const curated = majorCities[countryName];
  if (curated) {
    // Ensure unique values
    const unique = [...new Set(curated)];
    return unique.slice(0, limit);
  }
  
  // Fallback to getting cities from the package
  const cities = getCityNamesForCountry(countryName);
  // Ensure unique values
  const unique = [...new Set(cities)];
  return unique.slice(0, limit);
}

/**
 * Search cities by name with fuzzy matching
 * @param countryName - The country name
 * @param searchTerm - The search term
 * @param limit - Maximum results to return (default: 20)
 * @returns Array of unique matching city names
 */
export function searchCities(countryName: string, searchTerm: string, limit: number = 20): string[] {
  if (!searchTerm || searchTerm.length < 1) {
    return getMajorCitiesForCountry(countryName, limit);
  }
  
  const cities = getCityNamesForCountry(countryName);
  const lowerSearch = searchTerm.toLowerCase();
  
  // First, find exact prefix matches
  const prefixMatches = cities.filter(city => 
    city.toLowerCase().startsWith(lowerSearch)
  );
  
  // Then, find contains matches (excluding prefix matches)
  const containsMatches = cities.filter(city => 
    !city.toLowerCase().startsWith(lowerSearch) && 
    city.toLowerCase().includes(lowerSearch)
  );
  
  // Combine, deduplicate, and limit
  const combined = [...prefixMatches, ...containsMatches];
  const unique = [...new Set(combined)];
  return unique.slice(0, limit);
}

/**
 * Get location options for the onboarding page
 * Returns a structure compatible with LOCATION_OPTIONS
 */
export function getLocationOptions() {
  return SUPPORTED_COUNTRIES.map(country => ({
    country,
    flag: COUNTRY_FLAGS[country],
    cities: getMajorCitiesForCountry(country, 30),
  }));
}

/**
 * Get all cities for a country (for comprehensive search)
 * This is useful when you need the complete list
 */
export function getAllCitiesForCountry(countryName: string): string[] {
  return getCityNamesForCountry(countryName);
}

/**
 * Check if a city exists in a country
 */
export function cityExistsInCountry(countryName: string, cityName: string): boolean {
  const cities = getCityNamesForCountry(countryName);
  return cities.some(city => city.toLowerCase() === cityName.toLowerCase());
}

// Export types for external use
export type { ICountry, IState, ICity };
