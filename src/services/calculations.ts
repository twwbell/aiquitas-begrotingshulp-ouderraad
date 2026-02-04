import type {
  Scenario,
  StudentCount,
  Activity,
  YearForecast,
  Forecast,
  StudentGroep,
} from '@/models';
import { STUDENT_GROEPEN, getStudentsForGroepen, getTotalStudents } from '@/data/defaults';

// Progress students to next year
// Groep 8 leaves, everyone moves up, new kindergarteners join
function progressStudents(
  counts: StudentCount[],
  instroomKleuters: number
): StudentCount[] {
  const newCounts: StudentCount[] = [];
  const currentG02 = counts.find((c) => c.groep === "Groep 0-2")?.aantal || 0;

  for (let i = 0; i < STUDENT_GROEPEN.length; i++) {
    const groep = STUDENT_GROEPEN[i];

    if (groep === "Groep 0-2") {
      // G0-2 contains 2 years of students: 50% stays (completing 1st year) + new kindergarteners
      newCounts.push({ groep, aantal: Math.round(currentG02 * 0.5) + instroomKleuters });
    } else if (groep === "Groep 3") {
      // 50% of G0-2 moves to G3 (those completing 2nd year of kindergarten)
      newCounts.push({ groep, aantal: Math.round(currentG02 * 0.5) });
    } else {
      // Students from previous group (G8 students leave, not carried forward)
      const prevGroep = STUDENT_GROEPEN[i - 1];
      const prevCount = counts.find((c) => c.groep === prevGroep);
      newCounts.push({ groep, aantal: prevCount?.aantal || 0 });
    }
  }

  return newCounts;
}

// Calculate income from regular ouderbijdrage
function calculateOuderbijdrageIncome(
  totalStudents: number,
  ouderbijdrage: number,
  betalingspercentage: number
): number {
  return totalStudents * ouderbijdrage * (betalingspercentage / 100);
}

// Calculate income from activity-specific contributions
function calculateSpecifiekeBijdrageIncome(
  activities: Activity[],
  studentCounts: StudentCount[],
  specifiekeBijdrageActiviteiten: number[],
  specifiekeBijdragePercentage: number,
  betalingspercentage: number,
  yearIndex: number,
  kostenstijging: number
): number {
  if (specifiekeBijdrageActiviteiten.length === 0) {
    return 0;
  }

  let totalSpecifiekeInkomsten = 0;

  for (const activityCode of specifiekeBijdrageActiviteiten) {
    const activity = activities.find((a) => a.code === activityCode);
    if (!activity) continue;

    // Calculate the cost of this activity
    const activityCost = calculateActivityCost(activity, studentCounts, yearIndex, kostenstijging);

    // The specific contribution is a percentage of this cost, adjusted by payment percentage
    const specificIncome = activityCost * (specifiekeBijdragePercentage / 100) * (betalingspercentage / 100);
    totalSpecifiekeInkomsten += specificIncome;
  }

  return totalSpecifiekeInkomsten;
}

// Calculate cost for a single activity
function calculateActivityCost(
  activity: Activity,
  studentCounts: StudentCount[],
  yearIndex: number,
  kostenstijging: number
): number {
  const inflationFactor = Math.pow(1 + kostenstijging / 100, yearIndex);

  if (activity.type === "Lumpsum") {
    return activity.bedrag * inflationFactor;
  } else {
    // PerLeerling
    const relevantStudents = getStudentsForGroepen(studentCounts, activity.groepen);
    return relevantStudents * activity.bedrag * inflationFactor;
  }
}

// Calculate total expenses for a year
function calculateExpenses(
  activities: Activity[],
  studentCounts: StudentCount[],
  yearIndex: number,
  kostenstijging: number
): { total: number; perActivity: { activity: Activity; kosten: number }[] } {
  const perActivity: { activity: Activity; kosten: number }[] = [];
  let total = 0;

  for (const activity of activities) {
    const kosten = calculateActivityCost(activity, studentCounts, yearIndex, kostenstijging);
    perActivity.push({ activity, kosten });
    total += kosten;
  }

  return { total, perActivity };
}

// Generate school year string (e.g., "2025/2026")
function generateSchoolYear(startYear: number, yearOffset: number): string {
  const year = startYear + yearOffset;
  return `${year}/${year + 1}`;
}

// Parse start year from school year string
function parseStartYear(schooljaar: string): number {
  const match = schooljaar.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : new Date().getFullYear();
}

// Calculate cost per student per group
function calculateCostPerGroup(
  activities: Activity[],
  studentCounts: StudentCount[]
): { groep: StudentGroep; kosten: number }[] {
  const result: { groep: StudentGroep; kosten: number }[] = [];

  for (const groep of STUDENT_GROEPEN) {
    const studentCount = studentCounts.find((c) => c.groep === groep)?.aantal || 0;
    if (studentCount === 0) {
      result.push({ groep, kosten: 0 });
      continue;
    }

    let totalCost = 0;
    for (const activity of activities) {
      if (!activity.groepen.includes(groep)) continue;

      if (activity.type === "Lumpsum") {
        // Distribute lumpsum evenly across all students in applicable groups
        const totalApplicableStudents = getStudentsForGroepen(studentCounts, activity.groepen);
        if (totalApplicableStudents > 0) {
          totalCost += (activity.bedrag * studentCount) / totalApplicableStudents;
        }
      } else {
        // PerLeerling
        totalCost += activity.bedrag * studentCount;
      }
    }

    result.push({ groep, kosten: totalCost / studentCount });
  }

  return result;
}

// Binary search for minimum required contribution
function findMinimumContribution(
  scenario: Scenario,
  tolerance: number = 0.5
): number {
  let low = 0;
  let high = 200; // Max €200 per student

  const { instellingen, activiteiten } = scenario;

  while (high - low > tolerance) {
    const mid = (low + high) / 2;

    let reserve = instellingen.startReserve;
    let currentCounts = scenario.leerlingaantallen.map((c) => ({ ...c }));

    for (let year = 0; year <= instellingen.jarenVooruit; year++) {
      const totalStudents = getTotalStudents(currentCounts);

      // Income from ouderbijdrage
      const incomeOuderbijdrage = calculateOuderbijdrageIncome(
        totalStudents,
        mid,
        instellingen.betalingspercentage
      );

      // Income from activity-specific contributions
      const incomeSpecifiek = calculateSpecifiekeBijdrageIncome(
        activiteiten,
        currentCounts,
        instellingen.specifiekeBijdrageActiviteiten || [],
        instellingen.specifiekeBijdragePercentage || 100,
        instellingen.betalingspercentage,
        year,
        instellingen.kostenstijging
      );

      const income = incomeOuderbijdrage + incomeSpecifiek;

      const { total: expenses } = calculateExpenses(
        activiteiten,
        currentCounts,
        year,
        instellingen.kostenstijging
      );

      reserve += income - expenses;

      if (year < instellingen.jarenVooruit) {
        currentCounts = progressStudents(currentCounts, instellingen.instroomKleuters);
      }
    }

    if (reserve >= 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.ceil(high);
}

// Main forecast calculation
export function calculateForecast(scenario: Scenario): Forecast {
  const { instellingen, activiteiten, leerlingaantallen, schooljaar } = scenario;
  const startYear = parseStartYear(schooljaar);

  const jaren: YearForecast[] = [];
  let reserve = instellingen.startReserve;
  let currentCounts = leerlingaantallen.map((c) => ({ ...c }));
  let reserveOpraakJaar: number | null = null;

  for (let yearIndex = 0; yearIndex <= instellingen.jarenVooruit; yearIndex++) {
    const totaalLeerlingen = getTotalStudents(currentCounts);

    // Income from regular ouderbijdrage
    const inkomstenOuderbijdrage = calculateOuderbijdrageIncome(
      totaalLeerlingen,
      instellingen.ouderbijdrage,
      instellingen.betalingspercentage
    );

    // Income from activity-specific contributions
    const inkomstenSpecifiekeBijdrage = calculateSpecifiekeBijdrageIncome(
      activiteiten,
      currentCounts,
      instellingen.specifiekeBijdrageActiviteiten || [],
      instellingen.specifiekeBijdragePercentage || 100,
      instellingen.betalingspercentage,
      yearIndex,
      instellingen.kostenstijging
    );

    const inkomsten = inkomstenOuderbijdrage + inkomstenSpecifiekeBijdrage;

    const { total: uitgaven, perActivity } = calculateExpenses(
      activiteiten,
      currentCounts,
      yearIndex,
      instellingen.kostenstijging
    );

    const saldo = inkomsten - uitgaven;
    reserve += saldo;

    // Track first year reserve goes negative
    if (reserve < 0 && reserveOpraakJaar === null) {
      reserveOpraakJaar = startYear + yearIndex;
    }

    jaren.push({
      jaar: startYear + yearIndex,
      schooljaar: generateSchoolYear(startYear, yearIndex),
      leerlingaantallen: currentCounts.map((c) => ({ ...c })),
      totaalLeerlingen,
      inkomsten,
      inkomstenOuderbijdrage,
      inkomstenSpecifiekeBijdrage,
      uitgaven,
      saldo,
      reserve,
      uitgavenPerActiviteit: perActivity,
    });

    // Progress students for next year
    if (yearIndex < instellingen.jarenVooruit) {
      currentCounts = progressStudents(currentCounts, instellingen.instroomKleuters);
    }
  }

  const minimaalBenodrigdeBijdrage = findMinimumContribution(scenario);
  const kostenPerLeerlingPerGroep = calculateCostPerGroup(activiteiten, leerlingaantallen);

  return {
    scenario,
    jaren,
    reserveOpraakJaar,
    minimaalBenodrigdeBijdrage,
    kostenPerLeerlingPerGroep,
  };
}

// Calculate total cost for specific activities (used in UI)
export function calculateSpecifiekeActiviteitenKosten(
  activities: Activity[],
  studentCounts: StudentCount[],
  specifiekeBijdrageActiviteiten: number[]
): number {
  let total = 0;
  for (const code of specifiekeBijdrageActiviteiten) {
    const activity = activities.find((a) => a.code === code);
    if (activity) {
      total += calculateActivityCost(activity, studentCounts, 0, 0);
    }
  }
  return total;
}

// Calculate number of unique students participating in specific activities
export function calculateSpecifiekeActiviteitenStudenten(
  activities: Activity[],
  studentCounts: StudentCount[],
  specifiekeBijdrageActiviteiten: number[]
): number {
  // Collect all unique groups from selected activities
  const groepen = new Set<StudentGroep>();
  for (const code of specifiekeBijdrageActiviteiten) {
    const activity = activities.find((a) => a.code === code);
    if (activity) {
      activity.groepen.forEach((g) => groepen.add(g));
    }
  }

  // Sum students in those groups
  let total = 0;
  for (const groep of groepen) {
    const count = studentCounts.find((c) => c.groep === groep);
    if (count) {
      total += count.aantal;
    }
  }
  return total;
}

// Calculate per-student amount for specific activities
export function calculateSpecifiekeBijdragePerStudent(
  activities: Activity[],
  studentCounts: StudentCount[],
  specifiekeBijdrageActiviteiten: number[]
): number {
  const totalKosten = calculateSpecifiekeActiviteitenKosten(
    activities,
    studentCounts,
    specifiekeBijdrageActiviteiten
  );
  const totalStudenten = calculateSpecifiekeActiviteitenStudenten(
    activities,
    studentCounts,
    specifiekeBijdrageActiviteiten
  );

  if (totalStudenten === 0) return 0;
  return totalKosten / totalStudenten;
}

// Export utilities for reuse
export {
  progressStudents,
  calculateOuderbijdrageIncome,
  calculateSpecifiekeBijdrageIncome,
  calculateActivityCost,
  calculateExpenses,
  calculateCostPerGroup,
  findMinimumContribution,
};
