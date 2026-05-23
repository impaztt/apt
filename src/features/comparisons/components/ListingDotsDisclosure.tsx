import type { ApartmentComplex } from '../../complexes/types';
import type { ApartmentListing, AreaGroup } from '../../listings/types';
import { getAreaGroup } from '../../../shared/utils/area';
import { formatPrice } from '../../../shared/utils/price';

export function ListingDotsDisclosure({
  listings,
  complexes,
  complexIds,
  areaGroup,
}: {
  listings: ApartmentListing[];
  complexes: ApartmentComplex[];
  complexIds: string[];
  areaGroup: AreaGroup;
}) {
  const relevant = listings.filter(
    (listing): listing is ApartmentListing & { price: number } =>
      listing.deal_type === '매매' &&
      listing.price !== null &&
      complexIds.includes(listing.complex_id) &&
      getAreaGroup(listing) === areaGroup,
  );

  return (
    <details className="rounded-3xl bg-white px-4 py-4 shadow-card sm:px-6">
      <summary className="cursor-pointer list-none text-sm font-semibold text-brand-700">
        실제 매물 가격 하나씩 보기 <span className="ml-1 text-xs text-slate-400">총 {relevant.length}건</span>
      </summary>
      <div className="mt-4 space-y-4">
        {complexIds.map((id) => {
          const complexListings = relevant.filter((listing) => listing.complex_id === id).sort((a, b) => a.price - b.price);
          const color = complexes.find((complex) => complex.id === id)?.color ?? '#3182f6';
          if (!complexListings.length) return null;
          return (
            <div key={id}>
              <p className="mb-2 text-xs font-semibold text-slate-600">{complexes.find((complex) => complex.id === id)?.name ?? id}</p>
              <div className="flex flex-wrap gap-2">
                {complexListings.map((listing) => (
                  <span
                    key={listing.id}
                    className="rounded-full px-2.5 py-1.5 text-xs font-semibold"
                    style={{ backgroundColor: `${color}18`, color }}
                    title={`${listing.building_no ?? '-'} · ${listing.floor_text ?? '층 미입력'}`}
                  >
                    {formatPrice(listing.price)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}
