import type { ComplexGuide } from './types';

const guideModules = import.meta.glob('../../data/guides/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>;

function recordValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label}: JSON 값은 객체여야 합니다.`);
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, field: string, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}: ${field} 값은 필수입니다.`);
  return value.trim();
}

function defaultUseCenter() {
  return {
    title: '유즈센터',
    description: '단지 내 커뮤니티 공간입니다. 운영 시간과 이용 요금은 관리사무소 공지 또는 등록된 가격표를 확인해 주세요.',
    price_image_url: null,
    price_image_caption: '이용 가격표 이미지는 관리자 화면에서 등록할 수 있습니다.',
    facilities: [
      { name: '카페', category: '휴식', description: '입주민 휴식 공간', location: null, hours: null },
      { name: '수영장', category: '운동', description: '입주민 운동 시설', location: null, hours: null },
      { name: '헬스장', category: '운동', description: '입주민 운동 시설', location: null, hours: null },
      { name: '사우나', category: '편의', description: '입주민 편의 시설', location: null, hours: null },
      { name: '골프', category: '운동', description: '입주민 연습 시설', location: null, hours: null },
      { name: '독서실', category: '학습', description: '입주민 학습 공간', location: null, hours: null },
    ],
  };
}

export function parseComplexGuide(raw: unknown, label = '우리 단지 가이드'): ComplexGuide {
  const source = recordValue(raw, label);
  requiredText(source.complex_id, 'complex_id', label);
  requiredText(source.title, 'title', label);
  requiredText(source.subtitle, 'subtitle', label);
  requiredText(source.updated_at, 'updated_at', label);
  requiredText(source.introduction, 'introduction', label);
  const contact = recordValue(source.contact, `${label} contact`);
  ['address', 'office_phone', 'homepage_url', 'map_url'].forEach((field) => requiredText(contact[field], field, `${label} contact`));
  const siteMap = recordValue(source.site_map, `${label} site_map`);
  requiredText(siteMap.caption, 'caption', `${label} site_map`);
  if (siteMap.image_url !== null && siteMap.image_url !== undefined) requiredText(siteMap.image_url, 'image_url', `${label} site_map`);

  ['overview', 'move_in_sections', 'living_guides', 'facilities', 'building_notes', 'nearby_places', 'faqs', 'sources'].forEach((field) => {
    if (!Array.isArray(source[field])) throw new Error(`${label}: ${field}는 배열이어야 합니다.`);
  });
  if (!Array.isArray(siteMap.links)) throw new Error(`${label}: site_map.links는 배열이어야 합니다.`);
  const useCenter = source.use_center === undefined
    ? defaultUseCenter()
    : recordValue(source.use_center, `${label} use_center`);
  requiredText(useCenter.title, 'title', `${label} use_center`);
  requiredText(useCenter.description, 'description', `${label} use_center`);
  requiredText(useCenter.price_image_caption, 'price_image_caption', `${label} use_center`);
  if (useCenter.price_image_url !== null && useCenter.price_image_url !== undefined) {
    requiredText(useCenter.price_image_url, 'price_image_url', `${label} use_center`);
  }
  if (!Array.isArray(useCenter.facilities)) throw new Error(`${label}: use_center.facilities는 배열이어야 합니다.`);

  (source.overview as unknown[]).forEach((value, index) => {
    const item = recordValue(value, `${label} overview ${index + 1}`);
    requiredText(item.label, 'label', `${label} overview ${index + 1}`);
    requiredText(item.value, 'value', `${label} overview ${index + 1}`);
  });
  [...(source.move_in_sections as unknown[]), ...(source.living_guides as unknown[])].forEach((value, index) => {
    const item = recordValue(value, `${label} 안내 ${index + 1}`);
    requiredText(item.title, 'title', `${label} 안내 ${index + 1}`);
    requiredText(item.description, 'description', `${label} 안내 ${index + 1}`);
    if (!Array.isArray(item.items) || item.items.some((detail) => typeof detail !== 'string' || !detail.trim())) {
      throw new Error(`${label} 안내 ${index + 1}: items에는 설명 문구를 입력해 주세요.`);
    }
  });
  (source.facilities as unknown[]).forEach((value, index) => {
    const item = recordValue(value, `${label} 시설 ${index + 1}`);
    ['name', 'category', 'description'].forEach((field) => requiredText(item[field], field, `${label} 시설 ${index + 1}`));
  });
  (useCenter.facilities as unknown[]).forEach((value, index) => {
    const item = recordValue(value, `${label} 유즈센터 시설 ${index + 1}`);
    ['name', 'category', 'description'].forEach((field) => requiredText(item[field], field, `${label} 유즈센터 시설 ${index + 1}`));
  });
  (source.building_notes as unknown[]).forEach((value, index) => {
    const item = recordValue(value, `${label} 동별 설명 ${index + 1}`);
    ['building_no', 'title', 'description'].forEach((field) => requiredText(item[field], field, `${label} 동별 설명 ${index + 1}`));
    if (!Array.isArray(item.tags)) throw new Error(`${label} 동별 설명 ${index + 1}: tags는 배열이어야 합니다.`);
  });
  (source.nearby_places as unknown[]).forEach((value, index) => {
    const item = recordValue(value, `${label} 주변 생활 ${index + 1}`);
    ['name', 'category', 'description', 'url'].forEach((field) => requiredText(item[field], field, `${label} 주변 생활 ${index + 1}`));
    if (item.map_url !== undefined) requiredText(item.map_url, 'map_url', `${label} 주변 생활 ${index + 1}`);
  });
  (source.faqs as unknown[]).forEach((value, index) => {
    const item = recordValue(value, `${label} FAQ ${index + 1}`);
    requiredText(item.question, 'question', `${label} FAQ ${index + 1}`);
    requiredText(item.answer, 'answer', `${label} FAQ ${index + 1}`);
  });
  (siteMap.links as unknown[]).forEach((value, index) => {
    const item = recordValue(value, `${label} 지도 링크 ${index + 1}`);
    requiredText(item.label, 'label', `${label} 지도 링크 ${index + 1}`);
    requiredText(item.url, 'url', `${label} 지도 링크 ${index + 1}`);
  });
  (source.sources as unknown[]).forEach((value, index) => {
    const item = recordValue(value, `${label} 출처 ${index + 1}`);
    requiredText(item.label, 'label', `${label} 출처 ${index + 1}`);
    requiredText(item.url, 'url', `${label} 출처 ${index + 1}`);
    requiredText(item.checked_at, 'checked_at', `${label} 출처 ${index + 1}`);
  });
  return { ...source, use_center: useCenter } as unknown as ComplexGuide;
}

export function loadComplexGuides(): ComplexGuide[] {
  return Object.entries(guideModules).map(([path, data]) => parseComplexGuide(data, path));
}
