import { useMemo } from 'react';
import type { Scenario, Forecast } from '@/models';
import { calculateForecast } from '@/services/calculations';

// Hook to calculate forecast with memoization
export function useForecast(scenario: Scenario | null): Forecast | null {
  return useMemo(() => {
    if (!scenario) return null;
    return calculateForecast(scenario);
  }, [scenario]);
}

// Hook for debounced forecast (use when sliders are adjusting)
export function useDebouncedForecast(
  scenario: Scenario | null,
  _delay: number = 300
): Forecast | null {
  // For simplicity, we use the regular forecast
  // In a production app, you might add actual debouncing here
  return useForecast(scenario);
}
