import type { ApartmentComplex } from '../../features/complexes/types';
import type { ComparisonGroup, ComparisonGroupComplex } from '../../features/comparisons/types';
import type { ApartmentListing, DealType, FloorGroup, ListingInput } from '../../features/listings/types';
import { validateListingInput, isPossibleDuplicate } from '../../features/listings/validation';

export interface StaticDataset {
  complexes: ApartmentComplex[];
  listings: ApartmentListing[];
  groups: ComparisonGroup[];
  memberships: ComparisonGroupComplex[];
}

export interface ParsedComplexData {
  fileName: string;
  complex: ApartmentComplex;
  listings: ApartmentListing[];
  groupNames: string[];
  source: Record<string, unknown>;
}

const modules = import.meta.glob('../../data/complexes/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function recordValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}: JSON 최상위 값은 객체여야 합니다.`);
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, field: string, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}: ${field} 값은 필수입니다.`);
  return value.trim();
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value.replace(/,/g, '')))) {
    return Number(value.replace(/,/g, ''));
  }
  return null;
}

function timestamp(value: string): string {
  return value.length === 10 ? `${value}T00:00:00.000Z` : value;
}

function dealType(value: unknown, label: string): DealType {
  if (value === '매매' || value === '전세' || value === '월세') return value;
  throw new Error(`${label}: deal_type은 매매, 전세, 월세 중 하나여야 합니다.`);
}

function floorGroup(value: unknown): FloorGroup {
  return value === '저층' || value === '중층' || value === '고층' ? value : null;
}

function classifiedFloorGroup(value: unknown, floor: number | null): FloorGroup {
  const explicit = floorGroup(value);
  if (explicit || floor === null) return explicit;
  if (floor <= 5) return '저층';
  if (floor >= 18) return '고층';
  return '중층';
}

function textArray(value: unknown, field: string, label: string): string[] {
  if (!Array.isArray(value) || !value.length) throw new Error(`${label}: ${field} 배열에 비교 그룹명을 입력해 주세요.`);
  const values = value.map((item) => requiredText(item, field, label));
  return [...new Set(values)];
}

function dataFileName(pathOrName: string, id: string): string {
  const name = pathOrName.split('/').pop()?.split('\\').pop();
  return name?.endsWith('.json') ? name : `${id}.json`;
}

export function parseComplexDataFile(raw: unknown, pathOrName = '입력 JSON'): ParsedComplexData {
  const source = recordValue(raw, pathOrName);
  const id = requiredText(source.id, 'id', pathOrName);
  const name = requiredText(source.name, 'name', pathOrName);
  const updatedAt = requiredText(source.updated_at, 'updated_at', pathOrName);
  const fileName = dataFileName(pathOrName, id);
  const groupNames = textArray(source.comparison_groups, 'comparison_groups', pathOrName);
  if (!Array.isArray(source.listings)) throw new Error(`${fileName}: listings는 배열이어야 합니다.`);

  const complex: ApartmentComplex = {
    id,
    name,
    region: optionalText(source.region),
    address: optionalText(source.address),
    legal_dong_code: optionalText(source.legal_dong_code),
    built_year: optionalNumber(source.built_year),
    household_count: optionalNumber(source.household_count),
    parking_count: optionalNumber(source.parking_count),
    floor_area_ratio: optionalNumber(source.floor_area_ratio),
    building_coverage_ratio: optionalNumber(source.building_coverage_ratio),
    builder: optionalText(source.builder),
    brand: optionalText(source.brand),
    transit_note: optionalText(source.transit_note),
    school_note: optionalText(source.school_note),
    infrastructure_note: optionalText(source.infrastructure_note),
    memo: optionalText(source.memo),
    data_file: fileName,
    created_at: timestamp(updatedAt),
    updated_at: timestamp(updatedAt),
  };

  const observed: ApartmentListing[] = [];
  const listings = source.listings.map((value, index) => {
    const rowLabel = `${fileName} 매물 ${index + 1}`;
    const row = recordValue(value, rowLabel);
    const floor = optionalNumber(row.floor);
    const totalFloor = optionalNumber(row.total_floor);
    const input: ListingInput = {
      complex_id: id,
      building_no: optionalText(row.building_no),
      deal_type: dealType(row.deal_type, rowLabel),
      price: optionalNumber(row.price),
      deposit: optionalNumber(row.deposit),
      monthly_rent: optionalNumber(row.monthly_rent),
      supply_area_m2: optionalNumber(row.supply_area_m2),
      exclusive_area_m2: optionalNumber(row.exclusive_area_m2) ?? 0,
      area_type: optionalText(row.area_type),
      floor_text: optionalText(row.floor_text) ?? (floor !== null && totalFloor !== null ? `${floor}/${totalFloor}층` : null),
      floor,
      total_floor: totalFloor,
      floor_group: classifiedFloorGroup(row.floor_group, floor),
      direction: optionalText(row.direction),
      verified_date: optionalText(row.verified_date),
      registered_date: optionalText(row.registered_date),
      agent_name: optionalText(row.agent_name),
      agent_count: optionalNumber(row.agent_count),
      source: optionalText(row.source),
      description: optionalText(row.description),
      raw_text: optionalText(row.raw_text),
      is_favorite: row.is_favorite === true,
      is_duplicate_candidate: row.is_duplicate_candidate === true,
    };
    const errors = validateListingInput(input);
    if (errors.length) throw new Error(`${rowLabel}: ${errors.join(' ')}`);
    const listing: ApartmentListing = {
      ...input,
      is_duplicate_candidate: input.is_duplicate_candidate || isPossibleDuplicate(input, observed),
      id: optionalText(row.id) ?? `${id}-listing-${index + 1}`,
      created_at: timestamp(updatedAt),
      updated_at: timestamp(updatedAt),
    };
    observed.push(listing);
    return listing;
  });

  return { fileName, complex, listings, groupNames, source };
}

export function loadStaticDataset(): StaticDataset {
  const parsedFiles = Object.entries(modules).map(([path, data]) => parseComplexDataFile(data, path));
  const duplicates = parsedFiles
    .map((file) => file.complex.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicates.length) throw new Error(`단지 JSON id가 중복되었습니다: ${[...new Set(duplicates)].join(', ')}`);

  const now = new Date().toISOString();
  const groupNames = [...new Set(parsedFiles.flatMap((file) => file.groupNames))];
  const groups: ComparisonGroup[] = groupNames.map((name) => ({
    id: name,
    name,
    description: '단지별 JSON의 comparison_groups에서 구성된 비교 그룹',
    created_at: now,
    updated_at: now,
  }));
  const memberships: ComparisonGroupComplex[] = parsedFiles.flatMap((file, fileIndex) =>
    file.groupNames.map((groupName) => ({
      id: `${groupName}:${file.complex.id}`,
      group_id: groupName,
      complex_id: file.complex.id,
      sort_order: fileIndex,
      created_at: file.complex.updated_at,
    })),
  );

  return {
    complexes: parsedFiles.map((file) => file.complex).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    listings: parsedFiles.flatMap((file) => file.listings),
    groups,
    memberships,
  };
}
