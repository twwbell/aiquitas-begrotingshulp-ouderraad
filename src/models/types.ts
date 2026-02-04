// Student group types for Dutch primary school
export type StudentGroep =
  | "Groep 0-2"
  | "Groep 3"
  | "Groep 4"
  | "Groep 5"
  | "Groep 6"
  | "Groep 7"
  | "Groep 8";

// All available groups in order
export const STUDENT_GROEPEN: StudentGroep[] = [
  "Groep 0-2",
  "Groep 3",
  "Groep 4",
  "Groep 5",
  "Groep 6",
  "Groep 7",
  "Groep 8",
];

// Activity cost type
export type ActivityType = "Lumpsum" | "PerLeerling";

// Student count per group
export interface StudentCount {
  groep: StudentGroep;
  aantal: number;
}

// Activity (expense item)
export interface Activity {
  code: number;
  naam: string;
  type: ActivityType;
  bedrag: number;
  groepen: StudentGroep[];
  bereik?: string; // Legacy field from Excel, optional
}

// Scenario settings
export interface ScenarioSettings {
  ouderbijdrage: number; // €60-€90
  betalingspercentage: number; // 70-95%
  kostenstijging: number; // 0-5% annual
  jarenVooruit: number; // 5-10 years
  instroomKleuters: number; // New kindergarten students per year
  startReserve: number; // Starting reserve balance
  // Activity-specific contribution (additional charge on top of ouderbijdrage)
  specifiekeBijdrageActiviteiten: number[]; // Activity codes that get charged separately
  specifiekeBijdragePercentage: number; // 0-100%, percentage of activity cost to charge
}

// Main scenario model
export interface Scenario {
  id: string; // UUID
  naam: string;
  schooljaar: string; // "2025/2026"
  datumAangemaakt: string; // ISO date
  actief: boolean;
  instellingen: ScenarioSettings;
  leerlingaantallen: StudentCount[];
  activiteiten: Activity[];
}

// Forecast result for a single year
export interface YearForecast {
  jaar: number;
  schooljaar: string; // "2025/2026"
  leerlingaantallen: StudentCount[];
  totaalLeerlingen: number;
  inkomsten: number;
  inkomstenOuderbijdrage: number; // Income from regular ouderbijdrage
  inkomstenSpecifiekeBijdrage: number; // Income from activity-specific contributions
  uitgaven: number;
  saldo: number; // inkomsten - uitgaven
  reserve: number; // cumulative reserve
  uitgavenPerActiviteit: { activity: Activity; kosten: number }[];
}

// Complete forecast
export interface Forecast {
  scenario: Scenario;
  jaren: YearForecast[];
  reserveOpraakJaar: number | null; // Year when reserve becomes negative
  minimaalBenodrigdeBijdrage: number; // Minimum contribution to stay positive
  kostenPerLeerlingPerGroep: { groep: StudentGroep; kosten: number }[];
}

// Export format version for compatibility
export interface ExportData {
  version: string;
  exportDate: string;
  scenario?: Scenario;
  scenarios?: Scenario[];
}
