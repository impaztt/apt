export type DealType = '매매' | '전세' | '월세';
export type FloorGroup = '저층' | '중층' | '고층' | null;
export type AreaGroup = string;
export type AreaSelection = 'all' | AreaGroup;

export interface ApartmentListing {
  id: string;
  complex_id: string;
  building_no: string | null;
  deal_type: DealType;
  price: number | null;
  deposit: number | null;
  monthly_rent: number | null;
  supply_area_m2: number | null;
  exclusive_area_m2: number | null;
  area_pyeong: number;
  exclusive_area_pyeong: number;
  area_type: string | null;
  floor_text: string | null;
  floor: number | null;
  total_floor: number | null;
  floor_group: FloorGroup;
  direction: string | null;
  verified_date: string | null;
  registered_date: string | null;
  agent_name: string | null;
  agent_count: number | null;
  source: string | null;
  description: string | null;
  raw_text: string | null;
  is_favorite: boolean;
  is_duplicate_candidate: boolean;
  created_at: string;
  updated_at: string;
}

export type ListingInput = Omit<ApartmentListing, 'id' | 'created_at' | 'updated_at'>;

export interface ListingAreaSummary {
  complex_id: string;
  complex_name: string;
  area_group: AreaGroup;
  area_pyeong: number;
  exclusive_area_pyeong: number;
  area_label: string;
  listing_count: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  median_price: number;
  price_per_pyeong: number;
  latest_verified_date: string | null;
  min_listing: ApartmentListing;
  max_listing: ApartmentListing;
}

export interface ListingSnapshot {
  id: string;
  complex_id: string;
  complex_name: string;
  captured_date: string;
  listings: ApartmentListing[];
}

export interface ListingTrendPoint {
  complex_id: string;
  complex_name: string;
  area_group: AreaGroup;
  area_label: string;
  captured_date: string;
  listing_count: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  median_price: number;
}

export interface RepricedListingCandidate {
  before: ApartmentListing;
  after: ApartmentListing;
}

export interface SnapshotChangeSummary {
  complex_id: string;
  complex_name: string;
  previous_date: string;
  current_date: string;
  added: ApartmentListing[];
  removed: ApartmentListing[];
  repriced: RepricedListingCandidate[];
}
