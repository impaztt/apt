import type { ApartmentListing } from './types';

export interface PriceBucket {
  min: number;
  max: number;
  label: string;
}

function formatEok(value: number): string {
  const eok = value / 100_000_000;
  return Number.isInteger(eok) ? `${eok}` : eok.toFixed(1);
}

export function createPriceBuckets(prices: number[]): PriceBucket[] {
  if (!prices.length) return [];
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const spread = maximum - minimum;
  let step = spread <= 100_000_000 ? 20_000_000 : spread <= 300_000_000 ? 50_000_000 : 100_000_000;
  let start = Math.floor(minimum / step) * step;
  let end = Math.ceil((maximum + 1) / step) * step;

  while ((end - start) / step > 6) {
    step *= 2;
    start = Math.floor(minimum / step) * step;
    end = Math.ceil((maximum + 1) / step) * step;
  }

  const buckets: PriceBucket[] = [];
  for (let min = start; min < end; min += step) {
    buckets.push({
      min,
      max: min + step,
      label: `${formatEok(min)}~${formatEok(min + step)}`,
    });
  }
  return buckets;
}

export function getBucketCount(
  listings: Array<ApartmentListing & { price: number }>,
  bucket: PriceBucket,
): number {
  return listings.filter((listing) => listing.price >= bucket.min && listing.price < bucket.max).length;
}
