import type { ApartmentComplex } from '../../features/complexes/types';
import type { ComparisonGroup, ComparisonGroupComplex } from '../../features/comparisons/types';
import type {
  ApartmentListing,
  DealType,
  FloorGroup,
  ListingBrokerDetail,
  ListingInput,
  ListingKeywordAnalysis,
  ListingSnapshot,
} from '../../features/listings/types';
import type { AreaDisplayRule, DisplaySettings } from '../../features/settings/types';
import { fallbackComplexColor, formatDisplayAreaLabel } from '../../features/settings/display';
import { validateListingInput, isPossibleDuplicate } from '../../features/listings/validation';

export interface StaticDataset {
  complexes: ApartmentComplex[];
  listings: ApartmentListing[];
  snapshots: ListingSnapshot[];
  latestCapturedDates: Record<string, string>;
  groups: ComparisonGroup[];
  memberships: ComparisonGroupComplex[];
  displaySettings: DisplaySettings;
}

export interface ParsedComplexData {
  fileName: string;
  complex: ApartmentComplex;
  listings: ApartmentListing[];
  groupNames: string[];
  source: Record<string, unknown>;
  inputFormat: 'dashboard' | 'collected-items';
}

const modules = import.meta.glob('../../data/complexes/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const snapshotModules = import.meta.glob('../../data/snapshots/**/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

const displaySettingsModules = import.meta.glob('../../data/display-settings.json', {
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

function specialUnitType(row: Record<string, unknown>): string | null {
  const value =
    optionalText(row.special_unit_type) ??
    optionalText(row.special_type) ??
    optionalText(row.unit_variant);
  if (!value || ['일반', '일반세대', '일반형', '없음', 'false', 'N'].includes(value)) {
    return row.is_special_unit === true ? '특수세대' : null;
  }
  return value;
}

function m2ToPyeong(value: number | null): number | null {
  return value === null ? null : Math.round(value / 3.305785);
}

function optionalTextArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim())
    : [];
}

function keywordAnalysis(value: unknown): ListingKeywordAnalysis | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  return {
    occupancy_type: optionalText(source.occupancy_type),
    structure_type: optionalText(source.structure_type),
    condition_type: optionalText(source.condition_type),
  };
}

function brokerDetails(value: unknown): ListingBrokerDetail[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const source = recordValue(item, `중개사 상세 ${index + 1}`);
    return {
      id: typeof source.id === 'string' || typeof source.id === 'number' ? String(source.id) : String(index + 1),
      price_text: optionalText(source.price_text),
      verification_type: optionalText(source.verification_type),
      verified_date: normalizedDate(source.verified_date),
      description: optionalText(source.description),
      agent_name: optionalText(source.agent_name),
      platform: optionalText(source.platform),
      is_favorite: source.is_favorite === true,
      links: optionalTextArray(source.links),
      keyword_analysis: keywordAnalysis(source.keyword_analysis),
    };
  });
}

function positiveNumber(value: unknown, field: string): number {
  const result = optionalNumber(value);
  if (result === null || result <= 0) throw new Error(`표시 설정: ${field}은 0보다 커야 합니다.`);
  return result;
}

export function parseDisplaySettings(raw: unknown): DisplaySettings {
  const source = recordValue(raw, '표시 설정');
  const colors = recordValue(source.complex_colors ?? {}, '표시 설정 complex_colors');
  const complexColors = Object.fromEntries(
    Object.entries(colors)
      .filter(([, color]) => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color))
      .map(([id, color]) => [id, String(color)]),
  );
  if (!Array.isArray(source.area_groups)) throw new Error('표시 설정: area_groups는 배열이어야 합니다.');
  const areaGroups: AreaDisplayRule[] = source.area_groups.map((value, index) => {
    const row = recordValue(value, `표시 설정 평형 규칙 ${index + 1}`);
    const min = positiveNumber(row.source_area_pyeong_min, '원본 공급평 최소');
    const max = positiveNumber(row.source_area_pyeong_max, '원본 공급평 최대');
    if (min > max) throw new Error('표시 설정: 원본 공급평 최소값은 최대값보다 클 수 없습니다.');
    return {
      id: requiredText(row.id, 'id', `표시 설정 평형 규칙 ${index + 1}`),
      source_area_pyeong_min: min,
      source_area_pyeong_max: max,
      display_area_pyeong: positiveNumber(row.display_area_pyeong, '표시 평형'),
      exclusive_area_m2: positiveNumber(row.exclusive_area_m2, '전용면적'),
    };
  });
  const sortedGroups = [...areaGroups].sort((a, b) => a.source_area_pyeong_min - b.source_area_pyeong_min);
  if (new Set(sortedGroups.map((group) => group.id)).size !== sortedGroups.length) {
    throw new Error('표시 설정: 평형 규칙 ID는 중복될 수 없습니다.');
  }
  for (let index = 1; index < sortedGroups.length; index += 1) {
    if (sortedGroups[index].source_area_pyeong_min <= sortedGroups[index - 1].source_area_pyeong_max) {
      throw new Error('표시 설정: 원본 공급평 범위는 서로 겹칠 수 없습니다.');
    }
  }
  return {
    updated_at: normalizedDate(source.updated_at) ?? new Date().toISOString().slice(0, 10),
    complex_colors: complexColors,
    area_groups: sortedGroups,
  };
}

function currentDisplaySettings(): DisplaySettings {
  const raw = Object.values(displaySettingsModules)[0] ?? { updated_at: '2026-05-24', complex_colors: {}, area_groups: [] };
  return parseDisplaySettings(raw);
}

function applyAreaDisplayRule(listing: ApartmentListing, settings: DisplaySettings): ApartmentListing {
  const rule = settings.area_groups.find(
    (item) => listing.area_pyeong >= item.source_area_pyeong_min && listing.area_pyeong <= item.source_area_pyeong_max,
  );
  if (!rule) return listing;
  return {
    ...listing,
    display_area_key: rule.id,
    display_area_pyeong: rule.display_area_pyeong,
    display_exclusive_area_m2: rule.exclusive_area_m2,
    display_area_label: formatDisplayAreaLabel(rule),
  };
}

function normalizedDate(value: unknown): string | null {
  const date = optionalText(value);
  if (!date) return null;
  return /^\d{4}[./-]\d{2}[./-]\d{2}$/.test(date) ? date.replace(/[./]/g, '-') : date;
}

function timestamp(value: string): string {
  return value.length === 10 ? `${value}T00:00:00.000Z` : value;
}

function dealType(value: unknown, label: string): DealType {
  if (value === '매매' || value === '전세' || value === '월세') return value;
  throw new Error(`${label}: deal_type은 매매, 전세, 월세 중 하나여야 합니다.`);
}

function floorGroup(value: unknown): FloorGroup {
  if (value === '저층' || value === '저') return '저층';
  if (value === '중층' || value === '중') return '중층';
  if (value === '고층' || value === '고') return '고층';
  return null;
}

function classifiedFloorGroup(value: unknown, floor: number | null, floorText?: unknown): FloorGroup {
  const explicit = floorGroup(value) ?? floorGroup(optionalText(floorText)?.split('/')[0]);
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

function koreanPriceText(value: unknown): number | null {
  const text = optionalText(value);
  if (!text) return null;
  const lowerBoundText = text.split(/\s*(?:~|〜|∼|–|—|-)\s*/)[0]?.trim() ?? text;
  const cleaned = lowerBoundText.replace(/[,\s원]/g, '');
  if (cleaned.includes('/')) return null;

  const eokMatch = cleaned.match(/^(\d+(?:\.\d+)?)억(.*)$/);
  if (eokMatch) {
    const eok = Number(eokMatch[1]);
    const remainder = eokMatch[2] ? Number(eokMatch[2]) : 0;
    return Number.isFinite(eok) && Number.isFinite(remainder) ? eok * 100_000_000 + remainder * 10_000 : null;
  }

  const manwon = Number(cleaned);
  return Number.isFinite(manwon) ? manwon * 10_000 : null;
}

function collectedListing(row: Record<string, unknown>, index: number, id: string, sourceTextType: string | null): Record<string, unknown> {
  const type = dealType(row.deal_type, `입력 JSON 매물 ${index + 1}`);
  const rowId = typeof row.id === 'string' || typeof row.id === 'number' ? String(row.id) : String(index + 1);
  const floorText = optionalText(row.floor_text);
  const specialType = specialUnitType(row);
  const supplyAreaM2 = optionalNumber(row.supply_area_m2);
  const exclusiveAreaM2 = optionalNumber(row.exclusive_area_m2);
  const isPriceRange = row.is_price_range === true || optionalText(row.price_max_text) !== null;
  const primaryPrice =
    optionalNumber(row.price) ??
    (isPriceRange ? koreanPriceText(row.price_min_text) : null) ??
    koreanPriceText(row.sale_price_text) ??
    koreanPriceText(row.jeonse_price_text) ??
    koreanPriceText(row.price_text);

  return {
    id: `${id}-listing-${rowId}`,
    building_no: optionalText(row.building_no) ?? optionalText(row.building),
    deal_type: type,
    price: type === '매매' || type === '전세' ? primaryPrice : null,
    price_max: isPriceRange ? optionalNumber(row.price_max) ?? koreanPriceText(row.price_max_text) : null,
    is_price_range: isPriceRange,
    deposit: type === '월세' ? optionalNumber(row.deposit) ?? koreanPriceText(row.deposit_text) : null,
    monthly_rent: type === '월세' ? optionalNumber(row.monthly_rent) ?? koreanPriceText(row.monthly_rent_text) : null,
    supply_area_m2: supplyAreaM2,
    exclusive_area_m2: exclusiveAreaM2,
    supply_area_type: optionalText(row.supply_area_type),
    exclusive_area_type: optionalText(row.exclusive_area_type),
    area_pyeong: optionalNumber(row.area_pyeong) ?? optionalNumber(row.supply_area_pyeong) ?? m2ToPyeong(supplyAreaM2),
    exclusive_area_pyeong: optionalNumber(row.exclusive_area_pyeong) ?? m2ToPyeong(exclusiveAreaM2),
    area_type: optionalText(row.area_type) ?? optionalText(row.supply_area_type),
    floor_text: floorText,
    floor: optionalNumber(row.floor),
    total_floor: optionalNumber(row.total_floor),
    floor_group: classifiedFloorGroup(row.floor_group ?? row.floor, optionalNumber(row.floor), floorText),
    direction: optionalText(row.direction),
    verification_type: optionalText(row.verification_type),
    verified_date: normalizedDate(row.verified_date),
    agent_name: optionalText(row.agent_name),
    agent_count: optionalNumber(row.agent_count) ?? optionalNumber(row.registered_agent_count),
    source: optionalText(row.source) ?? optionalText(row.platform) ?? sourceTextType,
    description: optionalText(row.description),
    links: optionalTextArray(row.links),
    keyword_analysis: keywordAnalysis(row.keyword_analysis),
    broker_details: brokerDetails(row.broker_details),
    special_unit_type: specialType,
    is_special_unit: Boolean(specialType),
    is_favorite: row.is_favorite === true,
    is_duplicate_candidate: false,
  };
}

function normalizeComplexSource(
  submitted: Record<string, unknown>,
  label: string,
  existingSource?: Record<string, unknown> | null,
): { source: Record<string, unknown>; inputFormat: ParsedComplexData['inputFormat'] } {
  if (!Array.isArray(submitted.items)) return { source: submitted, inputFormat: 'dashboard' };

  const id = optionalText(submitted.id) ?? optionalText(existingSource?.id);
  if (!id) {
    throw new Error(`${label}: 새 단지로 저장하려면 id 값을 입력해야 합니다. 기존 단지 수정은 단지 목록의 매물 수정 버튼에서 진행해 주세요.`);
  }

  const name = optionalText(submitted.name) ?? optionalText(submitted.complex_name) ?? optionalText(existingSource?.name);
  if (!name) throw new Error(`${label}: complex_name 값은 필수입니다.`);

  const sourceTextType = optionalText(submitted.source_text_type);
  const listings = submitted.items.map((value, index) =>
    collectedListing(recordValue(value, `${label} 매물 ${index + 1}`), index, id, sourceTextType),
  );
  const verifiedDates = listings
    .map((listing) => optionalText(listing.verified_date))
    .filter((date): date is string => date !== null)
    .sort();
  const latestDate = verifiedDates[verifiedDates.length - 1];
  const comparisonGroups = submitted.comparison_groups ?? existingSource?.comparison_groups;
  if (!Array.isArray(comparisonGroups) || !comparisonGroups.length) {
    throw new Error(`${label}: 신규 단지 JSON에는 comparison_groups 배열을 입력해 주세요.`);
  }

  return {
    source: {
      ...(existingSource ?? {}),
      id,
      name,
      region: submitted.region ?? existingSource?.region,
      address: submitted.address ?? existingSource?.address,
      built_year: submitted.built_year ?? existingSource?.built_year,
      household_count: submitted.household_count ?? existingSource?.household_count,
      brand: submitted.brand ?? existingSource?.brand,
      data_version: submitted.data_version ?? existingSource?.data_version,
      updated_at: normalizedDate(submitted.updated_at) ?? latestDate ?? normalizedDate(existingSource?.updated_at) ?? new Date().toISOString().slice(0, 10),
      comparison_groups: comparisonGroups,
      listings,
    },
    inputFormat: 'collected-items',
  };
}

export function parseComplexDataFile(
  raw: unknown,
  pathOrName = '입력 JSON',
  existingSource?: Record<string, unknown> | null,
  displaySettings?: DisplaySettings,
): ParsedComplexData {
  const submitted = recordValue(raw, pathOrName);
  const normalized = normalizeComplexSource(submitted, pathOrName, existingSource);
  const source = normalized.source;
  const id = requiredText(source.id, 'id', pathOrName);
  const name = requiredText(source.name, 'name', pathOrName);
  const updatedAt = normalizedDate(requiredText(source.updated_at, 'updated_at', pathOrName)) as string;
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
    color: displaySettings?.complex_colors[id] ?? fallbackComplexColor(0),
    created_at: timestamp(updatedAt),
    updated_at: timestamp(updatedAt),
  };

  const observed: ApartmentListing[] = [];
  const listings = source.listings.map((value, index) => {
    const rowLabel = `${fileName} 매물 ${index + 1}`;
    const row = recordValue(value, rowLabel);
    const type = dealType(row.deal_type, rowLabel);
    const floor = optionalNumber(row.floor);
    const totalFloor = optionalNumber(row.total_floor);
    const specialType = specialUnitType(row);
    const supplyAreaM2 = optionalNumber(row.supply_area_m2);
    const exclusiveAreaM2 = optionalNumber(row.exclusive_area_m2);
    const isPriceRange = row.is_price_range === true || optionalText(row.price_max_text) !== null;
    const primaryPrice =
      optionalNumber(row.price) ??
      (isPriceRange ? koreanPriceText(row.price_min_text) : null) ??
      koreanPriceText(row.sale_price_text) ??
      koreanPriceText(row.jeonse_price_text) ??
      koreanPriceText(row.price_text);
    const input: ListingInput = {
      complex_id: id,
      building_no: optionalText(row.building_no) ?? optionalText(row.building),
      deal_type: type,
      price: type === '매매' || type === '전세' ? primaryPrice : null,
      price_max: isPriceRange ? optionalNumber(row.price_max) ?? koreanPriceText(row.price_max_text) : null,
      is_price_range: isPriceRange,
      deposit: type === '월세' ? optionalNumber(row.deposit) ?? koreanPriceText(row.deposit_text) : null,
      monthly_rent: type === '월세' ? optionalNumber(row.monthly_rent) ?? koreanPriceText(row.monthly_rent_text) : null,
      supply_area_m2: supplyAreaM2,
      exclusive_area_m2: exclusiveAreaM2,
      supply_area_type: optionalText(row.supply_area_type),
      exclusive_area_type: optionalText(row.exclusive_area_type),
      area_pyeong: optionalNumber(row.area_pyeong) ?? optionalNumber(row.supply_area_pyeong) ?? m2ToPyeong(supplyAreaM2) ?? 0,
      exclusive_area_pyeong: optionalNumber(row.exclusive_area_pyeong) ?? m2ToPyeong(exclusiveAreaM2) ?? 0,
      area_type: optionalText(row.area_type) ?? optionalText(row.supply_area_type),
      floor_text: optionalText(row.floor_text) ?? (floor !== null && totalFloor !== null ? `${floor}/${totalFloor}층` : null),
      floor,
      total_floor: totalFloor,
      floor_group: classifiedFloorGroup(row.floor_group, floor, row.floor_text),
      direction: optionalText(row.direction),
      verification_type: optionalText(row.verification_type),
      verified_date: normalizedDate(row.verified_date),
      registered_date: normalizedDate(row.registered_date),
      agent_name: optionalText(row.agent_name),
      agent_count: optionalNumber(row.agent_count) ?? optionalNumber(row.registered_agent_count),
      source: optionalText(row.source) ?? optionalText(row.platform),
      description: optionalText(row.description),
      raw_text: optionalText(row.raw_text),
      links: optionalTextArray(row.links),
      keyword_analysis: keywordAnalysis(row.keyword_analysis),
      broker_details: brokerDetails(row.broker_details),
      special_unit_type: specialType,
      is_special_unit: Boolean(specialType),
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
    return displaySettings ? applyAreaDisplayRule(listing, displaySettings) : listing;
  });

  return { fileName, complex, listings, groupNames, source, inputFormat: normalized.inputFormat };
}

function parseSnapshotFile(
  raw: unknown,
  path: string,
  complexFiles: Map<string, ParsedComplexData>,
  displaySettings: DisplaySettings,
): ListingSnapshot | null {
  const source = recordValue(raw, path);
  const complexId = requiredText(source.complex_id, 'complex_id', path);
  const base = complexFiles.get(complexId);
  if (!base) return null;
  const capturedDate = normalizedDate(requiredText(source.captured_date, 'captured_date', path)) as string;
  const snapshotListings = source.listings ?? source.items;
  if (!Array.isArray(snapshotListings)) throw new Error(`${path}: listings 또는 items 배열을 입력해 주세요.`);

  const parsed = parseComplexDataFile(
    {
      ...base.source,
      complex_name: source.complex_name ?? base.complex.name,
      source_text_type: source.source_text_type,
      updated_at: capturedDate,
      ...(Array.isArray(source.items) ? { items: snapshotListings } : { listings: snapshotListings }),
    },
    path,
    base.source,
    displaySettings,
  );

  return {
    id: `${complexId}:${capturedDate}`,
    complex_id: complexId,
    complex_name: base.complex.name,
    captured_date: capturedDate,
    listings: parsed.listings,
  };
}

export function loadStaticDataset(): StaticDataset {
  const displaySettings = currentDisplaySettings();
  const parsedFiles = Object.entries(modules).map(([path, data], index) => {
    const parsed = parseComplexDataFile(data, path, null, displaySettings);
    return {
      ...parsed,
      complex: {
        ...parsed.complex,
        color: displaySettings.complex_colors[parsed.complex.id] ?? fallbackComplexColor(index),
      },
    };
  });
  const duplicates = parsedFiles
    .map((file) => file.complex.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicates.length) throw new Error(`단지 JSON id가 중복되었습니다: ${[...new Set(duplicates)].join(', ')}`);

  const complexFiles = new Map(parsedFiles.map((file) => [file.complex.id, file]));
  const storedSnapshots = Object.entries(snapshotModules)
    .map(([path, data]) => parseSnapshotFile(data, path, complexFiles, displaySettings))
    .filter((snapshot): snapshot is ListingSnapshot => snapshot !== null);
  const snapshotsByComplex = new Map<string, ListingSnapshot[]>();
  for (const snapshot of storedSnapshots) {
    const values = snapshotsByComplex.get(snapshot.complex_id) ?? [];
    values.push(snapshot);
    snapshotsByComplex.set(snapshot.complex_id, values);
  }

  const snapshots = parsedFiles.flatMap((file) => {
    const fallbackDate = file.complex.updated_at.slice(0, 10);
    const values = new Map<string, ListingSnapshot>();
    if (file.listings.length) {
      values.set(fallbackDate, {
        id: `${file.complex.id}:${fallbackDate}`,
        complex_id: file.complex.id,
        complex_name: file.complex.name,
        captured_date: fallbackDate,
        listings: file.listings,
      });
    }
    snapshotsByComplex.get(file.complex.id)?.forEach((snapshot) => values.set(snapshot.captured_date, snapshot));
    return [...values.values()].sort((a, b) => a.captured_date.localeCompare(b.captured_date));
  });
  const latestSnapshots = new Map<string, ListingSnapshot>();
  snapshots.forEach((snapshot) => {
    const current = latestSnapshots.get(snapshot.complex_id);
    if (!current || current.captured_date < snapshot.captured_date) latestSnapshots.set(snapshot.complex_id, snapshot);
  });

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
    listings: parsedFiles.flatMap((file) => latestSnapshots.get(file.complex.id)?.listings ?? file.listings),
    snapshots,
    latestCapturedDates: Object.fromEntries(
      [...latestSnapshots.entries()].map(([complexId, snapshot]) => [complexId, snapshot.captured_date]),
    ),
    groups,
    memberships,
    displaySettings,
  };
}

export function getStaticDisplaySettings(): DisplaySettings {
  return currentDisplaySettings();
}

export function getStaticComplexSource(complexId: string): Record<string, unknown> | null {
  for (const [path, data] of Object.entries(modules)) {
    const source = recordValue(data, path);
    if (source.id !== complexId) continue;
    const latestSnapshot = Object.entries(snapshotModules)
      .map(([snapshotPath, snapshotValue]) => recordValue(snapshotValue, snapshotPath))
      .filter((snapshot) => snapshot.complex_id === complexId && typeof snapshot.captured_date === 'string')
      .sort((a, b) => String(a.captured_date).localeCompare(String(b.captured_date)))
      .pop();
    if (!latestSnapshot || !Array.isArray(latestSnapshot.listings)) return source;
    return {
      ...source,
      updated_at: latestSnapshot.captured_date,
      listings: latestSnapshot.listings,
    };
  }
  return null;
}
