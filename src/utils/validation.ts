import type { ScenarioSettings } from '@/models';

export interface ValidationError {
  field: string;
  message: string;
}

// Validate scenario settings
export function validateSettings(settings: ScenarioSettings): ValidationError[] {
  const errors: ValidationError[] = [];

  if (settings.ouderbijdrage < 0) {
    errors.push({ field: 'ouderbijdrage', message: 'Ouderbijdrage kan niet negatief zijn' });
  }

  if (settings.ouderbijdrage < 50) {
    errors.push({ field: 'ouderbijdrage', message: 'Waarschuwing: Ouderbijdrage is ongebruikelijk laag' });
  }

  if (settings.betalingspercentage < 0 || settings.betalingspercentage > 100) {
    errors.push({ field: 'betalingspercentage', message: 'Betalingspercentage moet tussen 0 en 100 zijn' });
  }

  if (settings.kostenstijging < 0) {
    errors.push({ field: 'kostenstijging', message: 'Kostenstijging kan niet negatief zijn' });
  }

  if (settings.jarenVooruit < 1) {
    errors.push({ field: 'jarenVooruit', message: 'Minimaal 1 jaar vooruit kijken' });
  }

  if (settings.jarenVooruit > 15) {
    errors.push({ field: 'jarenVooruit', message: 'Maximaal 15 jaar vooruit kijken' });
  }

  if (settings.instroomKleuters < 0) {
    errors.push({ field: 'instroomKleuters', message: 'Instroom kleuters kan niet negatief zijn' });
  }

  if (settings.startReserve < 0) {
    errors.push({ field: 'startReserve', message: 'Start reserve kan niet negatief zijn' });
  }

  return errors;
}

// Validate scenario name
export function validateScenarioName(naam: string, existingNames: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!naam || naam.trim().length === 0) {
    errors.push({ field: 'naam', message: 'Scenario naam is verplicht' });
  }

  if (naam.trim().length > 100) {
    errors.push({ field: 'naam', message: 'Scenario naam mag maximaal 100 tekens zijn' });
  }

  if (existingNames.includes(naam.trim())) {
    errors.push({ field: 'naam', message: 'Er bestaat al een scenario met deze naam' });
  }

  return errors;
}

// Validate student counts
export function validateStudentCounts(counts: { groep: string; aantal: number }[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const count of counts) {
    if (count.aantal < 0) {
      errors.push({ field: count.groep, message: `Aantal leerlingen in ${count.groep} kan niet negatief zijn` });
    }
  }

  const total = counts.reduce((sum, c) => sum + c.aantal, 0);
  if (total === 0) {
    errors.push({ field: 'totaal', message: 'Er moet minimaal 1 leerling zijn' });
  }

  return errors;
}

// Check if any validation errors are critical (not warnings)
export function hasCriticalErrors(errors: ValidationError[]): boolean {
  return errors.some((e) => !e.message.startsWith('Waarschuwing:'));
}
