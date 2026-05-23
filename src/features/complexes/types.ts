export interface ApartmentComplex {
  id: string;
  name: string;
  region: string | null;
  address: string | null;
  legal_dong_code: string | null;
  built_year: number | null;
  household_count: number | null;
  parking_count: number | null;
  floor_area_ratio: number | null;
  building_coverage_ratio: number | null;
  builder: string | null;
  brand: string | null;
  transit_note: string | null;
  school_note: string | null;
  infrastructure_note: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export type ComplexInput = Omit<ApartmentComplex, 'id' | 'created_at' | 'updated_at'>;
