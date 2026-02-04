import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { Scenario, StudentCount, Activity, ScenarioSettings } from '@/models';
import { storageService } from '@/services/storage';
import { createDefaultScenario, cloneScenario } from '@/data/defaults';

interface ScenarioContextType {
  // Current scenario
  scenario: Scenario | null;
  scenarios: Scenario[];
  isLoading: boolean;
  error: string | null;

  // Scenario actions
  loadScenarios: () => Promise<void>;
  selectScenario: (id: string) => Promise<void>;
  createScenario: (naam: string, kopieVan?: string) => Promise<Scenario>;
  updateScenario: (scenario: Scenario) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  renameScenario: (id: string, newNaam: string) => Promise<void>;

  // Update parts of scenario
  updateSettings: (settings: Partial<ScenarioSettings>) => Promise<void>;
  updateStudentCounts: (counts: StudentCount[]) => Promise<void>;
  updateActivities: (activities: Activity[]) => Promise<void>;
  updateActivity: (activity: Activity) => Promise<void>;

  // Import/Export
  exportScenario: (id: string) => Promise<void>;
  importScenario: (file: File) => Promise<Scenario>;
  exportAllScenarios: () => Promise<void>;
  importAllScenarios: (file: File) => Promise<void>;

  // Reset
  resetToDefaults: () => Promise<void>;
}

const ScenarioContext = createContext<ScenarioContextType | null>(null);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all scenarios and active scenario
  const loadScenarios = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allScenarios = await storageService.listScenarios();
      setScenarios(allScenarios);

      const active = await storageService.getActiveScenario();
      setScenario(active);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij laden scenario\'s');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  // Select a different scenario
  const selectScenario = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      await storageService.setActiveScenario(id);
      const selected = await storageService.loadScenario(id);
      setScenario(selected);
      await loadScenarios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij selecteren scenario');
    } finally {
      setIsLoading(false);
    }
  }, [loadScenarios]);

  // Create new scenario
  const createScenario = useCallback(async (naam: string, kopieVan?: string): Promise<Scenario> => {
    let newScenario: Scenario;

    if (kopieVan) {
      const sourceScenario = await storageService.loadScenario(kopieVan);
      if (sourceScenario) {
        newScenario = cloneScenario(sourceScenario, naam);
      } else {
        newScenario = createDefaultScenario(naam);
      }
    } else {
      newScenario = createDefaultScenario(naam);
    }

    await storageService.saveScenario(newScenario);
    await storageService.setActiveScenario(newScenario.id);
    await loadScenarios();
    setScenario(newScenario);

    return newScenario;
  }, [loadScenarios]);

  // Update full scenario
  const updateScenario = useCallback(async (updatedScenario: Scenario) => {
    await storageService.saveScenario(updatedScenario);
    if (scenario?.id === updatedScenario.id) {
      setScenario(updatedScenario);
    }
    await loadScenarios();
  }, [scenario, loadScenarios]);

  // Delete scenario
  const deleteScenario = useCallback(async (id: string) => {
    await storageService.deleteScenario(id);
    await loadScenarios();

    // If deleted active scenario, load new active
    if (scenario?.id === id) {
      const active = await storageService.getActiveScenario();
      setScenario(active);
    }
  }, [scenario, loadScenarios]);

  // Rename scenario
  const renameScenario = useCallback(async (id: string, newNaam: string) => {
    const scenarioToRename = await storageService.loadScenario(id);
    if (scenarioToRename) {
      scenarioToRename.naam = newNaam;
      await updateScenario(scenarioToRename);
    }
  }, [updateScenario]);

  // Update settings
  const updateSettings = useCallback(async (settings: Partial<ScenarioSettings>) => {
    if (!scenario) return;
    const updated = {
      ...scenario,
      instellingen: { ...scenario.instellingen, ...settings },
    };
    await updateScenario(updated);
  }, [scenario, updateScenario]);

  // Update student counts
  const updateStudentCounts = useCallback(async (counts: StudentCount[]) => {
    if (!scenario) return;
    const updated = { ...scenario, leerlingaantallen: counts };
    await updateScenario(updated);
  }, [scenario, updateScenario]);

  // Update all activities
  const updateActivities = useCallback(async (activities: Activity[]) => {
    if (!scenario) return;
    const updated = { ...scenario, activiteiten: activities };
    await updateScenario(updated);
  }, [scenario, updateScenario]);

  // Update single activity
  const updateActivity = useCallback(async (activity: Activity) => {
    if (!scenario) return;
    const updatedActivities = scenario.activiteiten.map((a) =>
      a.code === activity.code ? activity : a
    );
    await updateActivities(updatedActivities);
  }, [scenario, updateActivities]);

  // Export single scenario
  const exportScenarioFn = useCallback(async (id: string) => {
    const json = await storageService.exportScenario(id);
    const scenarioToExport = await storageService.loadScenario(id);
    const filename = `aiquitas_scenario_${scenarioToExport?.naam.replace(/\s+/g, '_') || 'export'}_${new Date().toISOString().slice(0, 10)}.json`;
    downloadJson(json, filename);
  }, []);

  // Import scenario from file
  const importScenarioFn = useCallback(async (file: File): Promise<Scenario> => {
    const json = await file.text();
    const imported = await storageService.importScenario(json);
    await loadScenarios();
    return imported;
  }, [loadScenarios]);

  // Export all scenarios
  const exportAllScenarios = useCallback(async () => {
    const json = await storageService.exportAllScenarios();
    const filename = `aiquitas_backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadJson(json, filename);
  }, []);

  // Import all scenarios
  const importAllScenarios = useCallback(async (file: File) => {
    const json = await file.text();
    await storageService.importAllScenarios(json);
    await loadScenarios();
    const active = await storageService.getActiveScenario();
    setScenario(active);
  }, [loadScenarios]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    if (!scenario) return;
    const defaultScenario = createDefaultScenario(scenario.naam);
    defaultScenario.id = scenario.id;
    defaultScenario.actief = scenario.actief;
    defaultScenario.datumAangemaakt = scenario.datumAangemaakt;
    await updateScenario(defaultScenario);
  }, [scenario, updateScenario]);

  const value: ScenarioContextType = {
    scenario,
    scenarios,
    isLoading,
    error,
    loadScenarios,
    selectScenario,
    createScenario,
    updateScenario,
    deleteScenario,
    renameScenario,
    updateSettings,
    updateStudentCounts,
    updateActivities,
    updateActivity,
    exportScenario: exportScenarioFn,
    importScenario: importScenarioFn,
    exportAllScenarios,
    importAllScenarios,
    resetToDefaults,
  };

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}

// Helper to download JSON
function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
