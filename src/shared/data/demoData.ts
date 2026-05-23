import type { ApartmentComplex } from '../../features/complexes/types';
import type { ComparisonGroup, ComparisonGroupComplex } from '../../features/comparisons/types';
import type { ApartmentListing, ListingInput } from '../../features/listings/types';

export interface DemoDataset {
  complexes: ApartmentComplex[];
  listings: ApartmentListing[];
  groups: ComparisonGroup[];
  memberships: ComparisonGroupComplex[];
}

const STORAGE_KEY = 'apt-price-compare-demo-v1';
const CREATED_AT = '2026-05-23T12:00:00.000Z';

const COMPLEX_IDS = {
  edu: '00000000-0000-4000-8000-000000000001',
  park: '00000000-0000-4000-8000-000000000002',
  sk: '00000000-0000-4000-8000-000000000003',
  cheoncheon: '00000000-0000-4000-8000-000000000004',
};
const GROUP_ID = '10000000-0000-4000-8000-000000000001';

function complex(id: string, name: string, region: string, year: number, households: number, brand: string): ApartmentComplex {
  return {
    id,
    name,
    region,
    address: `경기도 수원시 ${region}`,
    legal_dong_code: '41111',
    built_year: year,
    household_count: households,
    parking_count: null,
    floor_area_ratio: null,
    building_coverage_ratio: null,
    builder: brand,
    brand,
    transit_note: '역세권 접근성 확인 필요',
    school_note: null,
    infrastructure_note: null,
    memo: '데모 데이터입니다.',
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  };
}
function listing(
  id: string,
  complexId: string,
  buildingNo: string,
  price: number,
  area: number,
  floor: number,
  direction: string,
  verifiedDate = '2026-05-23',
): ApartmentListing {
  return {
    id,
    complex_id: complexId,
    building_no: buildingNo,
    deal_type: '매매',
    price,
    deposit: null,
    monthly_rent: null,
    supply_area_m2: null,
    exclusive_area_m2: area,
    area_type: String(Math.round(area)),
    floor_text: `${floor}/25층`,
    floor,
    total_floor: 25,
    floor_group: floor <= 5 ? '저층' : floor >= 18 ? '고층' : '중층',
    direction,
    verified_date: verifiedDate,
    registered_date: verifiedDate,
    agent_name: null,
    agent_count: null,
    source: '데모 데이터',
    description: null,
    raw_text: null,
    is_favorite: false,
    is_duplicate_candidate: false,
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  };
}

function seedDataset(): DemoDataset {
  const complexes = [
    complex(COMPLEX_IDS.edu, '화서역푸르지오더에듀포레', '장안구 정자동', 2009, 2571, '푸르지오'),
    complex(COMPLEX_IDS.park, '화서역파크푸르지오', '장안구 정자동', 2021, 2355, '푸르지오'),
    complex(COMPLEX_IDS.sk, '정자동 SK뷰', '장안구 정자동', 2013, 3498, 'SK뷰'),
    complex(COMPLEX_IDS.cheoncheon, '천천푸르지오', '장안구 천천동', 2009, 2571, '푸르지오'),
  ];

  const listings = [
    listing('20000000-0000-4000-8000-000000000001', COMPLEX_IDS.edu, '108동', 670_000_000, 59, 2, '남동향'),
    listing('20000000-0000-4000-8000-000000000002', COMPLEX_IDS.edu, '110동', 710_000_000, 59, 14, '남향'),
    listing('20000000-0000-4000-8000-000000000003', COMPLEX_IDS.edu, '112동', 780_000_000, 84, 4, '남동향'),
    listing('20000000-0000-4000-8000-000000000004', COMPLEX_IDS.edu, '113동', 830_000_000, 84, 12, '남향'),
    listing('20000000-0000-4000-8000-000000000005', COMPLEX_IDS.edu, '115동', 880_000_000, 84, 21, '남서향'),
    listing('20000000-0000-4000-8000-000000000006', COMPLEX_IDS.park, '201동', 720_000_000, 59, 9, '남향'),
    listing('20000000-0000-4000-8000-000000000007', COMPLEX_IDS.park, '204동', 820_000_000, 84, 3, '남동향'),
    listing('20000000-0000-4000-8000-000000000008', COMPLEX_IDS.park, '206동', 870_000_000, 84, 15, '남향'),
    listing('20000000-0000-4000-8000-000000000009', COMPLEX_IDS.park, '209동', 910_000_000, 84, 23, '남향'),
    listing('20000000-0000-4000-8000-000000000010', COMPLEX_IDS.sk, '301동', 650_000_000, 59, 10, '남향'),
    listing('20000000-0000-4000-8000-000000000011', COMPLEX_IDS.sk, '305동', 750_000_000, 84, 5, '남동향'),
    listing('20000000-0000-4000-8000-000000000012', COMPLEX_IDS.sk, '308동', 800_000_000, 84, 12, '남향'),
    listing('20000000-0000-4000-8000-000000000013', COMPLEX_IDS.sk, '309동', 850_000_000, 84, 20, '남서향'),
    listing('20000000-0000-4000-8000-000000000014', COMPLEX_IDS.cheoncheon, '401동', 770_000_000, 84, 4, '남동향'),
    listing('20000000-0000-4000-8000-000000000015', COMPLEX_IDS.cheoncheon, '407동', 815_000_000, 84, 10, '남향'),
    listing('20000000-0000-4000-8000-000000000016', COMPLEX_IDS.cheoncheon, '410동', 860_000_000, 84, 19, '남서향'),
    listing('20000000-0000-4000-8000-000000000017', COMPLEX_IDS.edu, '117동', 1_050_000_000, 113, 11, '남향'),
    listing('20000000-0000-4000-8000-000000000018', COMPLEX_IDS.park, '210동', 1_130_000_000, 113, 16, '남향'),
  ];

  return {
    complexes,
    listings,
    groups: [
      {
        id: GROUP_ID,
        name: '화서역·정자동 대형단지 비교',
        description: '전용 59㎡ 및 84㎡ 중심 비교 그룹',
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ],
    memberships: complexes.map((item, index) => ({
      id: `30000000-0000-4000-8000-00000000000${index + 1}`,
      group_id: GROUP_ID,
      complex_id: item.id,
      sort_order: index,
      created_at: CREATED_AT,
    })),
  };
}

function cloneDataset(data: DemoDataset): DemoDataset {
  return JSON.parse(JSON.stringify(data)) as DemoDataset;
}

export function readDemoDataset(): DemoDataset {
  if (typeof window === 'undefined') return seedDataset();
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const data = seedDataset();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return cloneDataset(data);
  }
  return JSON.parse(stored) as DemoDataset;
}

export function changeDemoDataset(mutator: (data: DemoDataset) => void): DemoDataset {
  const data = readDemoDataset();
  mutator(data);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return cloneDataset(data);
}

export function toListingRecord(input: ListingInput): ApartmentListing {
  const now = new Date().toISOString();
  return {
    ...input,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
}
