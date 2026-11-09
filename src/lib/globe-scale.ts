/*
 * Colours and data types shared by the globe and its legend. Each disease has its own
 * log scale whose ramp ends at that disease's accent colour.
 */
import { formatRate } from '@/lib/format';

export type Disease = 'dengue' | 'malaria';

export interface RateEntry {
  rate: number;
  year: number;
}

export interface GlobeCountry {
  name: string;
  dengue: RateEntry | null;
  malaria: RateEntry | null;
}

export interface DiseaseMeta {
  label: string;
  countries: number;
  minYear: number;
  maxYear: number;
  latestCount: number;
  yearLabel: string;
  minPositive: number;
  max: number;
  maxIso3: string;
  maxYearOfMax: number;
  zeroCount: number;
}

export interface GlobeData {
  generatedBy: string;
  dataEndYear: number;
  tableOnly: string[];
  meta: Record<Disease, DiseaseMeta>;
  countries: Record<string, GlobeCountry>;
}

export const RAMPS: Record<Disease, readonly [string, string]> = {
  dengue: ['#5a2a2c', '#E15759'],
  malaria: ['#223c58', '#4E79A7'],
};

export const OCEAN = '#101317';
export const ZERO_COLOUR = '#565a61';
export const NO_DATA_FILL = '#16181c';
export const NO_DATA_HATCH = '#34383f';
export const STALE_TINT = '#c9ccd1';
export const STALE_MIX = 0.45;

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** t = 0 gives a, t = 1 gives b. */
export function mixColours(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const channel = (from: number, to: number) => Math.round(from + (to - from) * t);
  const hex = (channel(ar, br) << 16) | (channel(ag, bg) << 8) | channel(ab, bb);
  return `#${hex.toString(16).padStart(6, '0')}`;
}

/** Where a rate falls on the disease's log scale, from 0 to 1. */
export function logPosition(rate: number, meta: DiseaseMeta): number {
  const low = Math.log10(meta.minPositive);
  const high = Math.log10(meta.max);
  return Math.min(1, Math.max(0, (Math.log10(rate) - low) / (high - low)));
}

export interface LegendTick {
  label: string;
  left: number;
}

/** Powers of ten inside the range, plus both ends, skipping any that would collide on a phone. */
export function legendTicks(meta: DiseaseMeta): LegendTick[] {
  const ticks: LegendTick[] = [{ label: formatRate(meta.minPositive), left: 0 }];
  const firstPower = Math.ceil(Math.log10(meta.minPositive));
  const lastPower = Math.floor(Math.log10(meta.max));
  for (let power = firstPower; power <= lastPower; power += 1) {
    const value = 10 ** power;
    const left = logPosition(value, meta);
    if (left > 0.15 && left < 0.82) ticks.push({ label: value.toLocaleString('en-US'), left });
  }
  ticks.push({ label: formatRate(meta.max), left: 1 });
  return ticks;
}
