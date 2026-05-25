export interface GuideOverviewItem {
  label: string;
  value: string;
}

export interface GuideContact {
  address: string;
  office_phone: string;
  office_fax: string | null;
  homepage_url: string;
  map_url: string;
}

export interface GuideChecklistSection {
  title: string;
  description: string;
  items: string[];
}

export interface GuideContentCard {
  title: string;
  description: string;
  items: string[];
}

export interface GuideFacility {
  name: string;
  category: string;
  description: string;
  location: string | null;
  hours: string | null;
}

export interface GuideExternalLink {
  label: string;
  url: string;
}

export interface GuideSiteMap {
  image_url: string | null;
  caption: string;
  links: GuideExternalLink[];
}

export interface GuideUseCenter {
  title: string;
  description: string;
  price_image_url: string | null;
  price_image_caption: string;
  facilities: GuideFacility[];
}

export interface GuideBuildingNote {
  building_no: string;
  title: string;
  description: string;
  tags: string[];
}

export interface GuideNearbyPlace {
  name: string;
  category: string;
  description: string;
  url: string;
  map_url?: string;
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface GuideSource {
  label: string;
  url: string;
  checked_at: string;
}

export interface ComplexGuide {
  complex_id: string;
  title: string;
  subtitle: string;
  updated_at: string;
  introduction: string;
  contact: GuideContact;
  overview: GuideOverviewItem[];
  move_in_sections: GuideChecklistSection[];
  use_center: GuideUseCenter;
  living_guides: GuideContentCard[];
  facilities: GuideFacility[];
  site_map: GuideSiteMap;
  building_notes: GuideBuildingNote[];
  nearby_places: GuideNearbyPlace[];
  faqs: GuideFaq[];
  sources: GuideSource[];
}
