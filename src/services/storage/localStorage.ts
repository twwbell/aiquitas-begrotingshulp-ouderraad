import type { Scenario, ExportData } from '@/models';
import type { StorageService } from './types';
import { validateScenario, validateExportData } from './types';
import { createDefaultScenario, EXPORT_VERSION } from '@/data/defaults';

const STORAGE_KEY = 'aiquitas_scenarios';
const ACTIVE_SCENARIO_KEY = 'aiquitas_active_scenario';

export class LocalStorageService implements StorageService {
  private getStoredScenarios(): Record<string, Scenario> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};
      return JSON.parse(stored);
    } catch (error) {
      console.error('Fout bij laden van scenario\'s:', error);
      return {};
    }
  }

  private saveStoredScenarios(scenarios: Record<string, Scenario>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
  }

  async saveScenario(scenario: Scenario): Promise<void> {
    const scenarios = this.getStoredScenarios();
    scenarios[scenario.id] = scenario;
    this.saveStoredScenarios(scenarios);
  }

  async loadScenario(id: string): Promise<Scenario | null> {
    const scenarios = this.getStoredScenarios();
    return scenarios[id] || null;
  }

  async listScenarios(): Promise<Scenario[]> {
    const scenarios = this.getStoredScenarios();
    return Object.values(scenarios).sort(
      (a, b) => new Date(b.datumAangemaakt).getTime() - new Date(a.datumAangemaakt).getTime()
    );
  }

  async deleteScenario(id: string): Promise<void> {
    const scenarios = this.getStoredScenarios();
    delete scenarios[id];
    this.saveStoredScenarios(scenarios);

    // If deleted scenario was active, clear active
    const activeId = localStorage.getItem(ACTIVE_SCENARIO_KEY);
    if (activeId === id) {
      localStorage.removeItem(ACTIVE_SCENARIO_KEY);
    }
  }

  async getActiveScenario(): Promise<Scenario | null> {
    const activeId = localStorage.getItem(ACTIVE_SCENARIO_KEY);
    if (!activeId) {
      // Return first scenario or create default
      const scenarios = await this.listScenarios();
      if (scenarios.length > 0) {
        await this.setActiveScenario(scenarios[0].id);
        return scenarios[0];
      }
      // Create default scenario
      const defaultScenario = createDefaultScenario();
      await this.saveScenario(defaultScenario);
      await this.setActiveScenario(defaultScenario.id);
      return defaultScenario;
    }

    const scenario = await this.loadScenario(activeId);
    if (!scenario) {
      // Active scenario not found, get first or create default
      const scenarios = await this.listScenarios();
      if (scenarios.length > 0) {
        await this.setActiveScenario(scenarios[0].id);
        return scenarios[0];
      }
      const defaultScenario = createDefaultScenario();
      await this.saveScenario(defaultScenario);
      await this.setActiveScenario(defaultScenario.id);
      return defaultScenario;
    }

    return scenario;
  }

  async setActiveScenario(id: string): Promise<void> {
    // Update all scenarios' actief status
    const scenarios = this.getStoredScenarios();
    for (const scenarioId of Object.keys(scenarios)) {
      scenarios[scenarioId].actief = scenarioId === id;
    }
    this.saveStoredScenarios(scenarios);
    localStorage.setItem(ACTIVE_SCENARIO_KEY, id);
  }

  async exportScenario(id: string): Promise<string> {
    const scenario = await this.loadScenario(id);
    if (!scenario) {
      throw new Error('Scenario niet gevonden');
    }

    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      scenario,
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importScenario(json: string): Promise<Scenario> {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new Error('Ongeldig JSON formaat');
    }

    // Try to parse as ExportData first
    const validation = validateExportData(data);
    if (validation.valid) {
      const exportData = data as ExportData;
      if (exportData.scenario) {
        // Generate new ID to avoid conflicts
        const scenario = {
          ...exportData.scenario,
          actief: false,
          datumAangemaakt: new Date().toISOString(),
        };
        await this.saveScenario(scenario);
        return scenario;
      }
    }

    // Try to parse as direct Scenario
    const scenarioValidation = validateScenario(data);
    if (scenarioValidation.valid) {
      const scenario = {
        ...(data as Scenario),
        actief: false,
        datumAangemaakt: new Date().toISOString(),
      };
      await this.saveScenario(scenario);
      return scenario;
    }

    throw new Error('Ongeldig bestandsformaat: ' + validation.errors.join(', '));
  }

  async exportAllScenarios(): Promise<string> {
    const scenarios = await this.listScenarios();

    const exportData: ExportData = {
      version: EXPORT_VERSION,
      exportDate: new Date().toISOString(),
      scenarios,
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importAllScenarios(json: string): Promise<void> {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new Error('Ongeldig JSON formaat');
    }

    const validation = validateExportData(data);
    if (!validation.valid) {
      throw new Error('Ongeldig backup formaat: ' + validation.errors.join(', '));
    }

    const exportData = data as ExportData;
    if (!exportData.scenarios || exportData.scenarios.length === 0) {
      throw new Error('Backup bevat geen scenario\'s');
    }

    // Clear existing data
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SCENARIO_KEY);

    // Import all scenarios
    const scenarios: Record<string, Scenario> = {};
    for (const scenario of exportData.scenarios) {
      scenarios[scenario.id] = {
        ...scenario,
        datumAangemaakt: new Date().toISOString(),
      };
    }
    this.saveStoredScenarios(scenarios);

    // Set first scenario as active
    const firstScenario = exportData.scenarios[0];
    if (firstScenario) {
      await this.setActiveScenario(firstScenario.id);
    }
  }
}

// Singleton instance
export const storageService = new LocalStorageService();
