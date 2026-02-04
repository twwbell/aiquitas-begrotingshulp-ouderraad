// Format currency in Dutch locale (€1.234,56)
export function formatCurrency(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Format number with Dutch locale (1.234,56)
export function formatNumber(amount: number, decimals: number = 0): string {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// Format percentage (80%)
export function formatPercentage(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

// Parse Dutch formatted number (1.234,56 -> 1234.56)
export function parseDutchNumber(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
