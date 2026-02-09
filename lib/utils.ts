import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Language helper functions
export function getEnglishLanguageId(languages: any[]): string {
  const englishLang = languages.find(lang => lang.code === 'en');
  if (!englishLang) {
    throw new Error('English language not found in loaded languages');
  }
  return englishLang.id;
}

export function getArabicLanguageId(languages: any[]): string {
  const arabicLang = languages.find(lang => lang.code === 'ar');
  if (!arabicLang) {
    throw new Error('Arabic language not found in loaded languages');
  }
  return arabicLang.id;
}
