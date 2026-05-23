export interface ComparisonGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComparisonGroupComplex {
  id: string;
  group_id: string;
  complex_id: string;
  sort_order: number;
  created_at: string;
}
