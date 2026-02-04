# AIquitas Begrotingshulp Ouderraad - Build Prompt

## Project Overview
Build "AIquitas Begrotingshulp" - a financial forecasting tool for Dutch primary school parent councils (ouderraad). The tool helps treasurers plan multi-year budgets, run scenarios, and forecast when reserves will deplete due to uneven student distribution across grades.

## Business Context
- Parent councils collect voluntary contributions (€75/child)
- Money funds school activities/trips
- Problem: More students in lower grades (cheaper activities) than upper grades (expensive activities like camps)
- Need: Multi-year forecasting to determine when contribution needs to increase
- User: Single treasurer, used for planning and presenting to board

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts
- **PDF Export**: Use browser's print functionality with print-optimized CSS
- **State**: React hooks (useState, useContext)
- **Storage**: localStorage + JSON import/export
- **Deployment**: Vercel (static site)

## Architecture Principles
- **Clean data layer separation**: Use StorageService interface pattern for future Baserow migration
- **Relational data structure**: Scenarios → Activities, StudentCounts
- **UUID-based IDs**: Compatible with future Baserow integration
- **TypeScript strict mode**
- **Responsive design**: Works on desktop/tablet
- **Print-friendly**: Dedicated print stylesheet for PDF export

## Core Data Models

### Scenario
```typescript
interface Scenario {
  id: string; // UUID
  naam: string;
  schooljaar: string; // "2025/2026"
  datumAangemaakt: string; // ISO date
  actief: boolean; // Which scenario is currently active
  instellingen: ScenarioSettings;
  leerlingaantallen: StudentCount[];
  activiteiten: Activity[];
}

interface ScenarioSettings {
  ouderbijdrage: number; // €60-€90
  betalingspercentage: number; // 70-95%
  kostenstijging: number; // 0-5% jaarlijks
  jarenVooruit: number; // 5-10 jaar
  instroomKleuters: number; // Aantal nieuwe groep 0-2 leerlingen per jaar
  startReserve: number; // Begin reserve saldo
}
```

### StudentCount
```typescript
interface StudentCount {
  groep: StudentGroep;
  aantal: number;
}

type StudentGroep = 
  | "Groep 0-2" 
  | "Groep 3" 
  | "Groep 4" 
  | "Groep 5" 
  | "Groep 6" 
  | "Groep 7" 
  | "Groep 8";
```

### Activity
```typescript
interface Activity {
  code: number; // 402, 403, etc.
  naam: string;
  type: "Lumpsum" | "PerLeerling";
  bedrag: number;
  groepen: StudentGroep[]; // Which grades this applies to
  bereik?: string; // Legacy field from Excel, optional
}
```

## Initial Data (from uploaded Excel)

### Default Activities
```typescript
const DEFAULT_ACTIVITIES: Activity[] = [
  { code: 400, naam: "Onvoorzien/eenmalig", type: "Lumpsum", bedrag: 300, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 402, naam: "Sinterklaas", type: "Lumpsum", bedrag: 5900, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 403, naam: "Kerst", type: "Lumpsum", bedrag: 1200, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 404, naam: "Meesters- en Juffendag", type: "Lumpsum", bedrag: 2000, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 405, naam: "Avond4daagse", type: "PerLeerling", bedrag: 1, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 406, naam: "Pasen", type: "PerLeerling", bedrag: 3, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 407, naam: "Afscheidsboek", type: "PerLeerling", bedrag: 20, groepen: ["Groep 8"] },
  { code: 408, naam: "Uitstapjes", type: "Lumpsum", bedrag: 6000, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 409, naam: "Sportdag", type: "Lumpsum", bedrag: 1000, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 410, naam: "Musical", type: "Lumpsum", bedrag: 1500, groepen: ["Groep 8"] },
  { code: 411, naam: "Fietsrally en eindfeest", type: "Lumpsum", bedrag: 1000, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 412, naam: "Attenties", type: "Lumpsum", bedrag: 300, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 413, naam: "Kamp groep 8", type: "PerLeerling", bedrag: 70, groepen: ["Groep 8"] },
  { code: 414, naam: "Kamp groep 4-7", type: "Lumpsum", bedrag: 5000, groepen: ["Groep 4", "Groep 5", "Groep 6", "Groep 7"] },
  { code: 416, naam: "IJsjes Laatste Lesweek", type: "Lumpsum", bedrag: 800, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
  { code: 450, naam: "Bankkosten", type: "Lumpsum", bedrag: 1200, groepen: ["Groep 0-2", "Groep 3", "Groep 4", "Groep 5", "Groep 6", "Groep 7", "Groep 8"] },
];
```

### Default Student Counts (2025/2026)
```typescript
const DEFAULT_STUDENT_COUNTS: StudentCount[] = [
  { groep: "Groep 0-2", aantal: 149 }, // 6 classes combined
  { groep: "Groep 3", aantal: 92 },    // 4 classes combined
  { groep: "Groep 4", aantal: 84 },    // 3 classes combined
  { groep: "Groep 5", aantal: 71 },    // 3 classes combined
  { groep: "Groep 6", aantal: 62 },    // 2 classes combined
  { groep: "Groep 7", aantal: 27 },    // 1 class
  { groep: "Groep 8", aantal: 57 },    // 2 classes combined
];
```

### Default Scenario Settings
```typescript
const DEFAULT_SETTINGS: ScenarioSettings = {
  ouderbijdrage: 75,
  betalingspercentage: 80,
  kostenstijging: 2,
  jarenVooruit: 5,
  instroomKleuters: 149, // Same as current Groep 0-2
  startReserve: 15000, // Starting reserve balance
};
```

## Calculation Logic

### Multi-Year Forecast
For each year (0 to jarenVooruit):

1. **Student Progression**:
   - Groep 8 leaves school
   - Each group moves up: Groep 7 → Groep 8, Groep 6 → Groep 7, etc.
   - New Groep 0-2: `instroomKleuters` students join

2. **Income Calculation**:
   ```
   totalStudents = sum(all groepen)
   income = totalStudents * ouderbijdrage * (betalingspercentage / 100)
   ```

3. **Expense Calculation**:
   For each activity:
   - If type === "Lumpsum": cost = bedrag * (1 + kostenstijging/100)^year
   - If type === "PerLeerling": 
     ```
     relevantStudents = sum(students in activity.groepen)
     cost = relevantStudents * bedrag * (1 + kostenstijging/100)^year
     ```

4. **Reserve Calculation**:
   ```
   year0: reserve = startReserve + income - expenses
   yearN: reserve = previousYearReserve + income - expenses
   ```

### Key Metrics
- **Reserve Depletion Year**: First year where reserve < 0
- **Minimum Required Contribution**: Ouderbijdrage needed for reserve to stay positive
- **Annual Surplus/Deficit**: income - expenses per year
- **Cost per Student**: total expenses / total students

## UI Components & Layout

### Main Layout
```
┌─────────────────────────────────────────────────┐
│ Header: AIquitas Begrotingshulp Ouderraad      │
│ [Scenario Dropdown] [Nieuw] [Import] [Export]  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Tabs: [Invoer] [Activiteiten] [Scenario's]     │
│       [Forecast] [Rapport (PDF)]                │
└─────────────────────────────────────────────────┘
```

### Tab 1: Invoer (Input)

**Section: Leerlingaantallen**
- Table with 7 rows (one per groep)
- Columns: Groep | Aantal (editable number input)
- Button: "Reset naar standaard"
- Show total at bottom

**Section: Instellingen**
- Input: Start Reserve (€)
- Input: Instroom Kleuters per jaar (number)
- Info text: "Deze leerlingen starten in Groep 0-2"

### Tab 2: Activiteiten (Activities)

**Activity List** (15+ items):
- Table view with columns:
  - Code (read-only)
  - Naam (read-only)
  - Type (toggle: Lumpsum / Per Leerling)
  - Bedrag (€ input)
  - Groepen (multi-select checkboxes or tags)
- Sortable by code
- Search/filter by name
- Button: "Reset naar standaard"

### Tab 3: Scenario's

**Scenario Controls** (sliders with live value display):
1. **Ouderbijdrage**: €60 - €90 (step: €5)
   - Show: "Bij €X = €Y totaal inkomsten"
2. **Betalingspercentage**: 70% - 95% (step: 1%)
   - Show: "X% van ouders betaalt"
3. **Jaarlijkse Kostenstijging**: 0% - 5% (step: 0.5%)
   - Show: "Inflatie correctie"
4. **Jaren Vooruit**: 5 - 10 (step: 1)
   - Show: "Forecast periode"

**Preset Scenarios** (buttons):
- Conservatief (bijdrage: €70, betaling: 75%, stijging: 3%)
- Realistisch (bijdrage: €75, betaling: 80%, stijging: 2%)
- Optimistisch (bijdrage: €80, betaling: 85%, stijging: 1.5%)

**Scenario Management**:
- Dropdown: Select active scenario
- Button: Nieuw Scenario (modal: naam, kopieer van...)
- Button: Hernoem
- Button: Verwijder
- Auto-save to localStorage

### Tab 4: Forecast

**Key Metrics Cards** (top):
```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Reserve raakt op │ │ Minimale Bijdrage│ │ Huidig Tekort    │
│ Jaar: 2028       │ │ €82 per kind     │ │ -€2.450 per jaar │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Reserve Chart**:
- Line chart: X-axis = jaren (2025, 2026, ...), Y-axis = reserve (€)
- Color zones:
  - Green: reserve > €10.000
  - Orange: €0 < reserve < €10.000
  - Red: reserve < €0
- Horizontal line at €0
- Responsive, min height 400px

**Yearly Breakdown Table**:
Columns: Jaar | Leerlingen | Inkomsten | Uitgaven | Saldo | Reserve
- Format currency as €X.XXX
- Highlight negative reserves in red
- Show totals row
- Exportable as CSV

**Cost per Grade Visualization**:
- Bar chart: groepen on X-axis, cost per student on Y-axis
- Shows which grades are most expensive
- Helps visualize the "lopsided" problem

### Tab 5: Rapport (Print/PDF)

**Print-Optimized Layout**:
- Header: Logo placeholder + "AIquitas Begrotingshulp"
- Scenario name + date
- Settings summary table
- Key metrics (big numbers, visual)
- Reserve chart (full width)
- Yearly breakdown table
- Activity costs breakdown
- Footer: "Gegenereerd op [date]"

**Print Stylesheet** (@media print):
- Hide navigation, buttons, sliders
- Force white background
- Page breaks before major sections
- Ensure charts render at good resolution
- A4 format optimization
- Headers/footers on each page

**Button**: "Print / Download PDF" → triggers window.print()

## Storage Service Architecture

```typescript
// src/services/storage/types.ts
interface StorageService {
  // Scenarios
  saveScenario(scenario: Scenario): Promise<void>;
  loadScenario(id: string): Promise<Scenario | null>;
  listScenarios(): Promise<Scenario[]>;
  deleteScenario(id: string): Promise<void>;
  getActiveScenario(): Promise<Scenario | null>;
  setActiveScenario(id: string): Promise<void>;
  
  // Import/Export
  exportScenario(id: string): string; // Returns JSON string
  importScenario(json: string): Promise<Scenario>;
  exportAllScenarios(): string;
  importAllScenarios(json: string): Promise<void>;
}

// src/services/storage/localStorage.ts
class LocalStorageService implements StorageService {
  private STORAGE_KEY = 'aiquitas_scenarios';
  private ACTIVE_SCENARIO_KEY = 'aiquitas_active_scenario';
  
  // Implementation using localStorage
  // Store as: { [id: string]: Scenario }
  // UUIDs for future Baserow compatibility
}
```

## Import/Export Features

### Export Scenario
1. Button: "Exporteer Scenario"
2. Downloads: `aiquitas_scenario_[naam]_[date].json`
3. JSON structure: Single Scenario object
4. User feedback: Toast "Scenario geëxporteerd"

### Import Scenario
1. Button: "Importeer Scenario"
2. File picker: accepts `.json`
3. Validates JSON structure
4. If duplicate naam: prompt "Hernoemen of overschrijven?"
5. Adds to scenario list
6. User feedback: Toast "Scenario geïmporteerd"

### Export All Scenarios (Backup)
1. Button in settings: "Backup Alle Scenario's"
2. Downloads: `aiquitas_backup_[date].json`
3. JSON structure: `{ scenarios: Scenario[], version: "1.0" }`

### Import Backup
1. Button: "Herstel Backup"
2. Warning: "Dit overschrijft alle huidige scenario's"
3. Confirmation dialog
4. Restores from backup file

## User Experience Details

### Loading States
- Show skeleton loaders during calculations
- Debounce slider changes (300ms) before recalculation
- Loading spinner on import/export

### Validation
- Prevent negative numbers for amounts
- Prevent empty scenario names
- Warn if ouderbijdrage < €50 (unusually low)
- Warn if reserve < €0 in forecast

### Error Handling
- Try-catch on all storage operations
- User-friendly error messages (Dutch)
- Fallback to default data if corruption detected

### Responsive Design
- Mobile: Stack components vertically, collapsible sections
- Tablet: 2-column layout for metrics
- Desktop: Full layout as designed
- Charts: Responsive, maintain aspect ratio

### Accessibility
- Proper ARIA labels on sliders
- Keyboard navigation support
- Focus indicators
- Semantic HTML

## Visual Design (Tailwind + shadcn/ui)

**Color Scheme**:
- Primary: Blue-600 (trust, professional)
- Success: Green-600 (positive reserve)
- Warning: Orange-500 (low reserve)
- Danger: Red-600 (negative reserve)
- Neutral: Gray-50 to Gray-900

**Typography**:
- Headers: font-bold text-2xl/xl
- Body: text-base
- Numbers: font-mono for alignment

**Components** (use shadcn/ui):
- Slider: shadcn Slider
- Tabs: shadcn Tabs
- Cards: shadcn Card
- Buttons: shadcn Button
- Dialog: shadcn Dialog (for confirmations)
- Toast: shadcn Toast (for feedback)
- Select: shadcn Select
- Input: shadcn Input
- Table: shadcn Table

## Implementation Checklist

### Phase 1: Setup & Data Layer
- [ ] Initialize Vite + React + TypeScript project
- [ ] Install dependencies (Tailwind, shadcn/ui, Recharts, uuid)
- [ ] Create data models (types.ts)
- [ ] Implement StorageService (localStorage)
- [ ] Create default data constants
- [ ] Test storage operations

### Phase 2: Core Components
- [ ] App shell with tabs navigation
- [ ] Scenario selector in header
- [ ] Tab 1: Invoer (student counts + settings)
- [ ] Tab 2: Activiteiten (activity list/editor)
- [ ] Tab 3: Scenario's (sliders + presets)
- [ ] Implement calculation engine
- [ ] Connect all inputs to state management

### Phase 3: Visualization
- [ ] Tab 4: Forecast metrics cards
- [ ] Reserve line chart (Recharts)
- [ ] Yearly breakdown table
- [ ] Cost per grade bar chart
- [ ] Format numbers as Dutch currency

### Phase 4: Import/Export
- [ ] Export scenario button + download
- [ ] Import scenario button + file picker
- [ ] JSON validation
- [ ] Backup/restore all scenarios
- [ ] Error handling + user feedback

### Phase 5: PDF/Print
- [ ] Tab 5: Rapport layout
- [ ] Print stylesheet (@media print)
- [ ] Test print output across browsers
- [ ] Ensure charts render in print
- [ ] Page break optimization

### Phase 6: Polish
- [ ] Responsive design testing
- [ ] Loading states + debouncing
- [ ] Form validation
- [ ] Error messages
- [ ] Accessibility audit
- [ ] Dutch translations for all UI text
- [ ] README with usage instructions

## File Structure
```
aiquitas-begroting/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── TabNavigation.tsx
│   │   │   └── AppShell.tsx
│   │   ├── invoer/
│   │   │   ├── StudentCountTable.tsx
│   │   │   └── SettingsForm.tsx
│   │   ├── activiteiten/
│   │   │   ├── ActivityList.tsx
│   │   │   └── ActivityEditor.tsx
│   │   ├── scenarios/
│   │   │   ├── ScenarioControls.tsx
│   │   │   ├── PresetButtons.tsx
│   │   │   └── ScenarioManager.tsx
│   │   ├── forecast/
│   │   │   ├── MetricsCards.tsx
│   │   │   ├── ReserveChart.tsx
│   │   │   ├── YearlyBreakdownTable.tsx
│   │   │   └── CostPerGradeChart.tsx
│   │   ├── rapport/
│   │   │   └── PrintableReport.tsx
│   │   └── ui/ (shadcn components)
│   ├── services/
│   │   ├── storage/
│   │   │   ├── types.ts
│   │   │   ├── localStorage.ts
│   │   │   └── index.ts
│   │   └── calculations.ts
│   ├── models/
│   │   ├── Scenario.ts
│   │   ├── Activity.ts
│   │   └── StudentCount.ts
│   ├── data/
│   │   └── defaults.ts
│   ├── hooks/
│   │   ├── useScenario.ts
│   │   ├── useForecast.ts
│   │   └── useStorage.ts
│   ├── utils/
│   │   ├── currency.ts
│   │   ├── validation.ts
│   │   └── uuid.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

## Dutch Language Requirements
All UI text must be in Dutch:
- Button labels
- Form labels
- Error messages
- Placeholder text
- Chart labels
- Table headers
- Toast notifications

## Testing Checklist
- [ ] Create new scenario
- [ ] Edit student counts → forecast updates
- [ ] Edit activities → forecast updates
- [ ] Adjust sliders → live recalculation
- [ ] Switch between scenarios
- [ ] Export scenario → download JSON
- [ ] Import scenario → loads correctly
- [ ] Print report → looks professional
- [ ] Responsive on mobile/tablet
- [ ] Negative reserve shows in red
- [ ] localStorage persists after refresh

## Success Criteria
1. Treasurer can input current state in <5 minutes
2. Slider adjustments show results in <500ms
3. PDF export looks professional (ready to present)
4. Can save/load 10+ scenarios without performance issues
5. Works offline (static site, no API calls)
6. Deployable to Vercel with one command
7. Code is clean enough for future Baserow migration

## Additional Notes
- Use semantic HTML for better print output
- Optimize bundle size (code splitting if needed)
- Add meta tags for when sharing link
- Consider adding a "Help" tooltip system
- Version the JSON export format for future compatibility

---

**Build this as a production-ready application. Focus on clean code architecture, user experience, and professional visual design. The treasurer should feel confident presenting this to the parent council board.**