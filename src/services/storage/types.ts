import type { Scenario } from '@/models';

// Storage service interface for future Baserow migration
export interface StorageService {
  // Scenarios
  saveScenario(scenario: Scenario): Promise<void>;
  loadScenario(id: string): Promise<Scenario | null>;
  listScenarios(): Promise<Scenario[]>;
  deleteScenario(id: string): Promise<void>;
  getActiveScenario(): Promise<Scenario | null>;
  setActiveScenario(id: string): Promise<void>;

  // Import/Export
  exportScenario(id: string): Promise<string>; // Returns JSON string
  importScenario(json: string): Promise<Scenario>;
  exportAllScenarios(): Promise<string>;
  importAllScenarios(json: string): Promise<void>;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Validate scenario structure
export function validateScenario(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data moet een object zijn'] };
  }

  const scenario = data as Record<string, unknown>;

  // Required string fields
  const stringFields = ['id', 'naam', 'schooljaar', 'datumAangemaakt'];
  for (const field of stringFields) {
    if (typeof scenario[field] !== 'string') {
      errors.push(`Veld '${field}' moet een tekst zijn`);
    }
  }

  // Boolean field
  if (typeof scenario.actief !== 'boolean') {
    errors.push("Veld 'actief' moet een boolean zijn");
  }

  // Instellingen object
  if (!scenario.instellingen || typeof scenario.instellingen !== 'object') {
    errors.push("Veld 'instellingen' moet een object zijn");
  } else {
    const settings = scenario.instellingen as Record<string, unknown>;
    const numberFields = [
      'ouderbijdrage',
      'betalingspercentage',
      'kostenstijging',
      'jarenVooruit',
      'instroomKleuters',
      'startReserve',
    ];
    for (const field of numberFields) {
      if (typeof settings[field] !== 'number') {
        errors.push(`Instellingen veld '${field}' moet een nummer zijn`);
      }
    }
  }

  // Leerlingaantallen array
  if (!Array.isArray(scenario.leerlingaantallen)) {
    errors.push("Veld 'leerlingaantallen' moet een array zijn");
  }

  // Activiteiten array
  if (!Array.isArray(scenario.activiteiten)) {
    errors.push("Veld 'activiteiten' moet een array zijn");
  }

  return { valid: errors.length === 0, errors };
}

// Validate export data structure
export function validateExportData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data moet een object zijn'] };
  }

  const exportData = data as Record<string, unknown>;

  if (typeof exportData.version !== 'string') {
    errors.push("Veld 'version' moet een tekst zijn");
  }

  if (typeof exportData.exportDate !== 'string') {
    errors.push("Veld 'exportDate' moet een tekst zijn");
  }

  // Either scenario or scenarios should exist
  if (!exportData.scenario && !exportData.scenarios) {
    errors.push("Export moet 'scenario' of 'scenarios' bevatten");
  }

  if (exportData.scenario) {
    const scenarioValidation = validateScenario(exportData.scenario);
    if (!scenarioValidation.valid) {
      errors.push(...scenarioValidation.errors.map((e) => `Scenario: ${e}`));
    }
  }

  if (exportData.scenarios && Array.isArray(exportData.scenarios)) {
    for (let i = 0; i < exportData.scenarios.length; i++) {
      const scenarioValidation = validateScenario(exportData.scenarios[i]);
      if (!scenarioValidation.valid) {
        errors.push(...scenarioValidation.errors.map((e) => `Scenario ${i + 1}: ${e}`));
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
