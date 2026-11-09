/** Rates read as "4,843", "14.2" or "0.02": fewer decimals as the number grows. */
export function formatRate(rate: number): string {
  if (rate === 0) return '0';
  if (rate >= 100) return Math.round(rate).toLocaleString('en-US');
  if (rate >= 1) return rate.toFixed(1);
  return rate.toFixed(2);
}
