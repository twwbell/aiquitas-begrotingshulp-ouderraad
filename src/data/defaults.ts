import type { Activity, StudentCount, ScenarioSettings, Scenario, StudentGroep } from '@/models';
import { STUDENT_GROEPEN } from '@/models';
import { v4 as uuidv4 } from 'uuid';

// Re-export STUDENT_GROEPEN for convenience
export { STUDENT_GROEPEN };

// Default activities based on uploaded Excel data
export const DEFAULT_ACTIVITIES: Activity[] = [
  {
    code: 400,
    naam: "Onvoorzien/eenmalig",
    type: "Lumpsum",
    bedrag: 300,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 402,
    naam: "Sinterklaas",
    type: "Lumpsum",
    bedrag: 5900,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 403,
    naam: "Kerst",
    type: "Lumpsum",
    bedrag: 1200,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 404,
    naam: "Meesters- en Juffendag",
    type: "Lumpsum",
    bedrag: 2000,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 405,
    naam: "Avond4daagse",
    type: "PerLeerling",
    bedrag: 1,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 406,
    naam: "Pasen",
    type: "PerLeerling",
    bedrag: 3,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 407,
    naam: "Afscheidsboek",
    type: "PerLeerling",
    bedrag: 20,
    groepen: ["Groep 8"],
  },
  {
    code: 408,
    naam: "Uitstapjes",
    type: "Lumpsum",
    bedrag: 6000,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 409,
    naam: "Sportdag",
    type: "Lumpsum",
    bedrag: 1000,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 410,
    naam: "Musical",
    type: "Lumpsum",
    bedrag: 1500,
    groepen: ["Groep 8"],
  },
  {
    code: 411,
    naam: "Fietsrally en eindfeest",
    type: "Lumpsum",
    bedrag: 1000,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 412,
    naam: "Attenties",
    type: "Lumpsum",
    bedrag: 300,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 413,
    naam: "Kamp groep 8",
    type: "PerLeerling",
    bedrag: 70,
    groepen: ["Groep 8"],
  },
  {
    code: 414,
    naam: "Kamp groep 4-7",
    type: "Lumpsum",
    bedrag: 14000,
    groepen: ["Groep 4", "Groep 5", "Groep 6", "Groep 7"],
  },
  {
    code: 416,
    naam: "IJsjes Laatste Lesweek",
    type: "Lumpsum",
    bedrag: 800,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
  {
    code: 450,
    naam: "Bankkosten",
    type: "Lumpsum",
    bedrag: 1200,
    groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"],
  },
];

// Default student counts for 2025/2026
export const DEFAULT_STUDENT_COUNTS: StudentCount[] = [
  { groep: "Groep 0-2", aantal: 149 }, // 6 classes combined
  { groep: "Groep 3", aantal: 92 },    // 4 classes combined
  { groep: "Groep 4", aantal: 84 },    // 3 classes combined
  { groep: "Groep 5", aantal: 71 },    // 3 classes combined
  { groep: "Groep 6", aantal: 62 },    // 2 classes combined
  { groep: "Groep 7", aantal: 27 },    // 1 class
  { groep: "Groep 8", aantal: 57 },    // 2 classes combined
];

// Default scenario settings
export const DEFAULT_SETTINGS: ScenarioSettings = {
  ouderbijdrage: 75,
  betalingspercentage: 80,
  kostenstijging: 2,
  jarenVooruit: 5,
  instroomKleuters: 65, 
  startReserve: 19258.99,
  specifiekeBijdrageActiviteiten: [], // No activities selected by default
  specifiekeBijdragePercentage: 100, // 100% of activity cost
};

// Preset scenarios
export const PRESET_SCENARIOS = {
  conservatief: {
    naam: "Conservatief",
    instellingen: {
      ...DEFAULT_SETTINGS,
      ouderbijdrage: 70,
      betalingspercentage: 75,
      kostenstijging: 3,
    },
  },
  realistisch: {
    naam: "Realistisch",
    instellingen: DEFAULT_SETTINGS,
  },
  optimistisch: {
    naam: "Optimistisch",
    instellingen: {
      ...DEFAULT_SETTINGS,
      ouderbijdrage: 80,
      betalingspercentage: 85,
      kostenstijging: 1.5,
    },
  },
};

// Create a new default scenario
export function createDefaultScenario(naam: string = "Standaard scenario"): Scenario {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  const schooljaar = `${currentYear}/${nextYear}`;

  return {
    id: uuidv4(),
    naam,
    schooljaar,
    datumAangemaakt: now.toISOString(),
    actief: true,
    instellingen: { ...DEFAULT_SETTINGS },
    leerlingaantallen: DEFAULT_STUDENT_COUNTS.map((s) => ({ ...s })),
    activiteiten: DEFAULT_ACTIVITIES.map((a) => ({ ...a, groepen: [...a.groepen] })),
  };
}

// Clone a scenario with new ID
export function cloneScenario(scenario: Scenario, newNaam: string): Scenario {
  return {
    ...scenario,
    id: uuidv4(),
    naam: newNaam,
    datumAangemaakt: new Date().toISOString(),
    actief: false,
    instellingen: {
      ...scenario.instellingen,
      specifiekeBijdrageActiviteiten: [...(scenario.instellingen.specifiekeBijdrageActiviteiten || [])],
    },
    leerlingaantallen: scenario.leerlingaantallen.map((s) => ({ ...s })),
    activiteiten: scenario.activiteiten.map((a) => ({ ...a, groepen: [...a.groepen] })),
  };
}

// Get total students for a scenario
export function getTotalStudents(counts: StudentCount[]): number {
  return counts.reduce((sum, sc) => sum + sc.aantal, 0);
}

// Get students for specific groups
export function getStudentsForGroepen(counts: StudentCount[], groepen: StudentGroep[]): number {
  return counts
    .filter((sc) => groepen.includes(sc.groep))
    .reduce((sum, sc) => sum + sc.aantal, 0);
}

// Export data version
export const EXPORT_VERSION = "1.0";
