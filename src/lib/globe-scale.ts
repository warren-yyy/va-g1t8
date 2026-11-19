/*
 * Colours and data types shared by the globe and its legend. Each disease has its own
 * log scale whose ramp ends at that disease's accent colour. There is one palette per theme.
 */
import { formatRate } from '@/lib/format';
import type { Theme } from '@/lib/theme';

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

/** Every colour the globe and its legend use, for one theme. */
export interface GlobePalette {
  /** Each ramp runs from the lowest rate to the highest, ending at the disease's colour. */
  ramps: Record<Disease, readonly [string, string]>;
  ocean: string;
  zero: string;
  noDataFill: string;
  noDataHatch: string;
  /** Older data is mixed towards this, by STALE_MIX. */
  staleTint: string;
  graticule: string;
  /** Country borders. */
  border: string;
  /** The extra outline round countries with older data. */
  staleOutline: string;
  /** The globe's edge. */
  rim: string;
  /** Singapore's marker and label, and the hovered country's outline. */
  marker: string;
  /** The halo behind the Singapore label. */
  labelHalo: string;
}

export const GLOBE_PALETTES: Record<Theme, GlobePalette> = {
  // On the dark page: ramps rise from dark to the disease colour, outlines are white.
  dark: {
    ramps: {
      dengue: ['#5a2a2c', '#E15759'],
      malaria: ['#223c58', '#4E79A7'],
    },
    ocean: '#101317',
    zero: '#565a61',
    noDataFill: '#16181c',
    noDataHatch: '#34383f',
    staleTint: '#c9ccd1',
    graticule: 'rgba(241, 239, 233, 0.05)',
    border: 'rgba(11, 12, 14, 0.7)',
    staleOutline: 'rgba(241, 239, 233, 0.85)',
    rim: 'rgba(241, 239, 233, 0.22)',
    marker: '#ffffff',
    labelHalo: 'rgba(11, 12, 14, 0.85)',
  },
  // On the light page: a pale ocean and land, ramps from a light tint to the disease colour,
  // and dark outlines.
  light: {
    ramps: {
      dengue: ['#f6d3d3', '#E15759'],
      malaria: ['#d3dfec', '#4E79A7'],
    },
    ocean: '#e4eaef',
    zero: '#a9adb3',
    noDataFill: '#f7f6f3',
    noDataHatch: '#c8c5be',
    staleTint: '#ffffff',
    graticule: 'rgba(23, 24, 26, 0.06)',
    border: 'rgba(23, 24, 26, 0.4)',
    staleOutline: 'rgba(23, 24, 26, 0.75)',
    rim: 'rgba(23, 24, 26, 0.28)',
    marker: '#17181a',
    labelHalo: 'rgba(250, 249, 246, 0.9)',
  },
};

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
