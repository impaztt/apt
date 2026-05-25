export interface AreaDisplayRule {
  id: string;
  source_area_pyeong_min: number;
  source_area_pyeong_max: number;
  display_area_pyeong: number;
  exclusive_area_m2: number;
}

export interface DisplaySettings {
  updated_at: string;
  complex_colors: Record<string, string>;
  default_dashboard_complex_ids: string[];
  area_groups: AreaDisplayRule[];
}
