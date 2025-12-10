import type { SavedCompany } from '../types';

const STORAGE_KEY = 'gostender_companies';

export class CompanyManager {
  static getCompanies(): SavedCompany[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load companies:', e);
      return [];
    }
  }

  static saveCompany(company: SavedCompany): void {
    try {
      const companies = this.getCompanies();
      const existingIndex = companies.findIndex(
        c => c.company_id === company.company_id
      );

      if (existingIndex >= 0) {
        companies[existingIndex] = company;
      } else {
        companies.push(company);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    } catch (e) {
      console.error('Failed to save company:', e);
    }
  }

  static getCompanyById(companyId: string): SavedCompany | null {
    const companies = this.getCompanies();
    return companies.find(c => c.company_id === companyId) || null;
  }

  static deleteCompany(companyId: string): void {
    try {
      const companies = this.getCompanies();
      const filtered = companies.filter(c => c.company_id !== companyId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete company:', e);
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear companies:', e);
    }
  }
}
