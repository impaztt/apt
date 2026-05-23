import { formatPrice } from '../utils/price';

export function PriceText({ value, className = '' }: { value: number | null; className?: string }) {
  return <span className={`metric-number font-bold ${className}`}>{formatPrice(value)}</span>;
}
