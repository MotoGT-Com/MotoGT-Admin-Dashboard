/**
 * Settings Service
 * Manages store and language configuration for the admin dashboard
 */

import { storeService, Store as ApiStore, SupportedLanguage } from './store.service';

// Re-export Store type
export type Store = ApiStore;

// Language interface for UI
export interface Language {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fallback store in case API fails
const FALLBACK_STORE: Store = {
  id: '19bf2cb6-1b50-4b95-80d6-9da6560588fc',
  code: 'JO',
  name: 'MotoGT Main Store',
  currencyCode: 'JOD',
  country: 'JO',
  timezone: 'Asia/Amman',
  isActive: true,
  supportedLanguages: [
    {
      languageId: '1',
      languageCode: 'en',
      languageName: 'English',
      isDefault: true,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Fallback languages in case API fails
const FALLBACK_LANGUAGES: Language[] = [
  {
    id: '1',
    name: 'English',
    code: 'en',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Arabic',
    code: 'ar',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Fuel Type Options
export const FUEL_TYPES = [
  'Petrol',
  'Diesel',
  'Electric',
  'Hybrid',
  'Plug-in Hybrid',
  'CNG',
  'LPG',
] as const;

export type FuelType = typeof FUEL_TYPES[number];

// Transmission Options
export const TRANSMISSION_TYPES = [
  'Manual',
  'Automatic',
  'CVT',
  'Semi-Automatic',
  'DCT',
] as const;

export type TransmissionType = typeof TRANSMISSION_TYPES[number];

// Body Type Options
export const BODY_TYPES = [
  'Sedan',
  'SUV',
  'Coupe',
  'Hatchback',
  'Wagon',
  'Convertible',
  'Pickup',
  'Van',
  'Minivan',
] as const;

export type BodyType = typeof BODY_TYPES[number];

class SettingsService {
  private STORAGE_KEY_STORE = 'motogt_selected_store';
  private STORAGE_KEY_LANGUAGE = 'motogt_selected_language';
  private cachedStores: Store[] | null = null;
  private cachedLanguages: Language[] | null = null;

  /**
   * Get all available stores from API
   */
  async getStores(): Promise<Store[]> {
    try {
      // Return cached if available
      if (this.cachedStores && this.cachedStores.length > 0) {
        return this.cachedStores;
      }

      console.log("Fetching Stores")

      const response = await storeService.listStores({ limit: 100, isActive: true });
      console.log("Stores Response", response)
      this.cachedStores = response;
      return response;
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      // Return fallback store on error
      return [FALLBACK_STORE];
    }
  }

  /**
   * Get all available languages extracted from stores
   */
  async getLanguages(): Promise<Language[]> {
    try {
      // Return cached if available
      if (this.cachedLanguages && this.cachedLanguages.length > 0) {
        return this.cachedLanguages;
      }

      // Get stores first (will use cached if available)
      const stores = await this.getStores();
      
      // Extract unique languages from all stores
      const languagesMap = new Map<string, Language>();
      
      stores.forEach(store => {
        if (store.supportedLanguages) {
          store.supportedLanguages.forEach(lang => {
            if (!languagesMap.has(lang.languageId)) {
              languagesMap.set(lang.languageId, {
                id: lang.languageId,
                name: lang.languageName,
                code: lang.languageCode,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
            }
          });
        }
      });
      
      const languages = Array.from(languagesMap.values());
      this.cachedLanguages = languages.length > 0 ? languages : FALLBACK_LANGUAGES;
      return this.cachedLanguages;
    } catch (error) {
      console.error('Failed to extract languages from stores:', error);
      // Return fallback languages on error
      return FALLBACK_LANGUAGES;
    }
  }

  /**
   * Get currently selected store (synchronous, uses cached data)
   */
  getSelectedStore(): Store | null {
    if (typeof window === 'undefined') {
      return null; // Return null for SSR, components should handle this
    }

    const storedId = localStorage.getItem(this.STORAGE_KEY_STORE);
    if (storedId && this.cachedStores) {
      const store = this.cachedStores.find(s => s.id === storedId);
      if (store) return store;
    }
    
    // Return first cached store or null
    return this.cachedStores && this.cachedStores.length > 0 ? this.cachedStores[0] : null;
  }

  /**
   * Set selected store
   */
  setSelectedStore(storeId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_STORE, storeId);
    }
  }

  /**
   * Get currently selected language (synchronous, uses cached data)
   */
  getSelectedLanguage(): Language | null {
    if (typeof window === 'undefined') {
      return null; // Return null for SSR, components should handle this
    }

    const storedId = localStorage.getItem(this.STORAGE_KEY_LANGUAGE);
    if (storedId && this.cachedLanguages) {
      const language = this.cachedLanguages.find(l => l.id === storedId);
      if (language) return language;
    }
    
    // Return first cached language or null
    return this.cachedLanguages && this.cachedLanguages.length > 0 ? this.cachedLanguages[0] : null;
  }

  /**
   * Set selected language
   */
  setSelectedLanguage(languageId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY_LANGUAGE, languageId);
    }
  }

  /**
   * Get fuel type options
   */
  getFuelTypes(): readonly string[] {
    return FUEL_TYPES;
  }

  /**
   * Get transmission type options
   */
  getTransmissionTypes(): readonly string[] {
    return TRANSMISSION_TYPES;
  }

  /**
   * Get body type options
   */
  getBodyTypes(): readonly string[] {
    return BODY_TYPES;
  }
}

export const settingsService = new SettingsService();
