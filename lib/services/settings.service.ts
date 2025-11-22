/**
 * Settings Service
 * Manages store and language configuration for the admin dashboard
 */

export interface Store {
  id: string;
  name: string;
  currency: string;
}

export interface Language {
  id: string;
  name: string;
  code: string;
}

// Default stores - can be configured based on your setup
export const STORES: Store[] = [
  {
    id: '19bf2cb6-1b50-4b95-80d6-9da6560588fc',
    name: 'MotoGT Main Store',
    currency: 'JOD',
  },
  // Add more stores as needed
];

// Default languages
export const LANGUAGES: Language[] = [
  {
    id: '1',
    name: 'English',
    code: 'en',
  },
  {
    id: '2',
    name: 'Arabic',
    code: 'ar',
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

  /**
   * Get all available stores
   */
  getStores(): Store[] {
    return STORES;
  }

  /**
   * Get all available languages
   */
  getLanguages(): Language[] {
    return LANGUAGES;
  }

  /**
   * Get currently selected store
   */
  getSelectedStore(): Store {
    if (typeof window === 'undefined') {
      return STORES[0]; // Default for SSR
    }

    const storedId = localStorage.getItem(this.STORAGE_KEY_STORE);
    if (storedId) {
      const store = STORES.find(s => s.id === storedId);
      if (store) return store;
    }
    return STORES[0];
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
   * Get currently selected language
   */
  getSelectedLanguage(): Language {
    if (typeof window === 'undefined') {
      return LANGUAGES[0]; // Default for SSR
    }

    const storedId = localStorage.getItem(this.STORAGE_KEY_LANGUAGE);
    if (storedId) {
      const language = LANGUAGES.find(l => l.id === storedId);
      if (language) return language;
    }
    return LANGUAGES[0];
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
