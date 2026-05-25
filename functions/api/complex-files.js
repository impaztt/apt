const COMPLEX_DIRECTORY = 'src/data/complexes';
const SNAPSHOT_DIRECTORY = 'src/data/snapshots';
const DISPLAY_SETTINGS_PATH = 'src/data/display-settings.json';
const GUIDE_DIRECTORY = 'src/data/guides';
const DEFAULT_OWNER = 'impaztt';
const DEFAULT_REPO = 'apt';
const DEFAULT_BRANCH = 'main';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function validateComplexData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['입력 JSON 최상위 값은 객체여야 합니다.'];
  }

  const errors = [];
  const id = text(data.id);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    errors.push('id는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.');
  }
  if (!text(data.name)) errors.push('name 값은 필수입니다.');
  if (!text(data.updated_at)) errors.push('updated_at 값은 필수입니다.');
  if (!Array.isArray(data.comparison_groups) || data.comparison_groups.length === 0) {
    errors.push('comparison_groups 배열에 그룹명을 입력해 주세요.');
  }
  if (!Array.isArray(data.listings)) {
    errors.push('listings는 배열이어야 합니다.');
    return errors;
  }

  data.listings.forEach((listing, index) => {
    const label = `매물 ${index + 1}`;
    if (!listing || typeof listing !== 'object' || Array.isArray(listing)) {
      errors.push(`${label}은 객체여야 합니다.`);
      return;
    }
    if (!['매매', '전세', '월세'].includes(listing.deal_type)) {
      errors.push(`${label}: deal_type은 매매, 전세, 월세 중 하나여야 합니다.`);
    }
    if (!number(listing.area_pyeong) || listing.area_pyeong <= 0) {
      errors.push(`${label}: area_pyeong은 0보다 커야 합니다.`);
    }
    if (!number(listing.exclusive_area_pyeong) || listing.exclusive_area_pyeong <= 0) {
      errors.push(`${label}: exclusive_area_pyeong은 0보다 커야 합니다.`);
    }
    if (listing.deal_type === '매매' && (!number(listing.price) || listing.price <= 0)) {
      errors.push(`${label}: 매매 가격은 0보다 커야 합니다.`);
    }
    if (listing.deal_type === '전세' && (!number(listing.price) || listing.price <= 0) && (!number(listing.deposit) || listing.deposit <= 0)) {
      errors.push(`${label}: 전세 가격 또는 보증금을 입력해 주세요.`);
    }
    if (
      listing.deal_type === '월세' &&
      (number(listing.deposit) === null || listing.deposit < 0 || !number(listing.monthly_rent) || listing.monthly_rent <= 0)
    ) {
      errors.push(`${label}: 월세는 보증금과 월세를 입력해 주세요.`);
    }
  });
  return errors;
}

function validateDisplaySettings(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['표시 설정 데이터가 올바르지 않습니다.'];
  if (!text(data.updated_at)) errors.push('표시 설정 updated_at 값은 필수입니다.');
  if (!data.complex_colors || typeof data.complex_colors !== 'object' || Array.isArray(data.complex_colors)) {
    errors.push('complex_colors는 객체여야 합니다.');
  } else {
    Object.entries(data.complex_colors).forEach(([id, color]) => {
      if (!/^#[0-9a-f]{6}$/i.test(text(color))) errors.push(`${id}: 색상은 #RRGGBB 형식이어야 합니다.`);
    });
  }
  if (data.default_dashboard_complex_ids !== undefined) {
    if (!Array.isArray(data.default_dashboard_complex_ids)) {
      errors.push('default_dashboard_complex_ids는 배열이어야 합니다.');
    } else {
      const ids = data.default_dashboard_complex_ids.map((id) => text(id));
      if (!ids.length || ids.some((id) => !id)) errors.push('초기 표시 단지를 하나 이상 선택해 주세요.');
      if (new Set(ids).size !== ids.length) errors.push('초기 표시 단지는 중복될 수 없습니다.');
    }
  }
  if (!Array.isArray(data.area_groups)) {
    errors.push('area_groups는 배열이어야 합니다.');
    return errors;
  }
  const ranges = [];
  const ids = new Set();
  data.area_groups.forEach((rule, index) => {
    const label = `평형 규칙 ${index + 1}`;
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
      errors.push(`${label}은 객체여야 합니다.`);
      return;
    }
    if (!text(rule.id)) {
      errors.push(`${label}: id 값을 입력해 주세요.`);
    } else if (ids.has(text(rule.id))) {
      errors.push(`${label}: id 값은 중복될 수 없습니다.`);
    } else {
      ids.add(text(rule.id));
    }
    const min = number(rule.source_area_pyeong_min);
    const max = number(rule.source_area_pyeong_max);
    if (!min || min <= 0 || !max || max <= 0) errors.push(`${label}: 원본 공급평 범위는 0보다 커야 합니다.`);
    if (min && max && min > max) errors.push(`${label}: 최소평은 최대평보다 클 수 없습니다.`);
    if (!number(rule.display_area_pyeong) || rule.display_area_pyeong <= 0) errors.push(`${label}: 표시 평형은 0보다 커야 합니다.`);
    if (!number(rule.exclusive_area_m2) || rule.exclusive_area_m2 <= 0) errors.push(`${label}: 전용면적은 0보다 커야 합니다.`);
    if (min && max) ranges.push({ min, max, label });
  });
  ranges.sort((a, b) => a.min - b.min);
  for (let index = 1; index < ranges.length; index += 1) {
    if (ranges[index].min <= ranges[index - 1].max) errors.push('평형 규칙의 원본 공급평 범위는 서로 겹칠 수 없습니다.');
  }
  return errors;
}

function validateComplexGuide(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['우리 단지 가이드 데이터가 올바르지 않습니다.'];
  const id = text(data.complex_id);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) errors.push('가이드 complex_id는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.');
  ['title', 'subtitle', 'updated_at', 'introduction'].forEach((field) => {
    if (!text(data[field])) errors.push(`가이드 ${field} 값은 필수입니다.`);
  });
  if (!data.contact || typeof data.contact !== 'object' || Array.isArray(data.contact)) {
    errors.push('가이드 contact는 객체여야 합니다.');
  } else {
    ['address', 'office_phone', 'homepage_url', 'map_url'].forEach((field) => {
      if (!text(data.contact[field])) errors.push(`가이드 contact.${field} 값은 필수입니다.`);
    });
  }
  if (!data.site_map || typeof data.site_map !== 'object' || Array.isArray(data.site_map)) {
    errors.push('가이드 site_map은 객체여야 합니다.');
  } else {
    if (!text(data.site_map.caption)) errors.push('가이드 site_map.caption 값은 필수입니다.');
    if (!Array.isArray(data.site_map.links)) errors.push('가이드 site_map.links는 배열이어야 합니다.');
    else data.site_map.links.forEach((link, index) => {
      if (!link || !text(link.label) || !text(link.url)) errors.push(`가이드 지도 링크 ${index + 1}의 label과 url을 입력해 주세요.`);
    });
  }
  ['overview', 'move_in_sections', 'living_guides', 'facilities', 'building_notes', 'nearby_places', 'faqs', 'sources'].forEach((field) => {
    if (!Array.isArray(data[field])) errors.push(`가이드 ${field}는 배열이어야 합니다.`);
  });
  if (Array.isArray(data.overview)) data.overview.forEach((item, index) => {
    if (!item || !text(item.label) || !text(item.value)) errors.push(`가이드 요약 ${index + 1}의 label과 value를 입력해 주세요.`);
  });
  ['move_in_sections', 'living_guides'].forEach((field) => {
    if (Array.isArray(data[field])) data[field].forEach((item, index) => {
      if (!item || !text(item.title) || !text(item.description) || !Array.isArray(item.items)) {
        errors.push(`가이드 ${field} ${index + 1}의 title, description, items를 입력해 주세요.`);
      }
    });
  });
  if (Array.isArray(data.facilities)) data.facilities.forEach((item, index) => {
    if (!item || !text(item.name) || !text(item.category) || !text(item.description)) errors.push(`가이드 시설 ${index + 1} 내용을 입력해 주세요.`);
  });
  if (Array.isArray(data.building_notes)) data.building_notes.forEach((item, index) => {
    if (!item || !text(item.building_no) || !text(item.title) || !text(item.description) || !Array.isArray(item.tags)) {
      errors.push(`가이드 동별 설명 ${index + 1} 내용을 입력해 주세요.`);
    }
  });
  if (Array.isArray(data.nearby_places)) data.nearby_places.forEach((item, index) => {
    if (!item || !text(item.name) || !text(item.category) || !text(item.description) || !text(item.url)) {
      errors.push(`가이드 주변 생활 ${index + 1} 내용을 입력해 주세요.`);
    }
    if (item?.map_url !== undefined && !text(item.map_url)) errors.push(`가이드 주변 생활 ${index + 1}의 map_url을 확인해 주세요.`);
  });
  if (Array.isArray(data.faqs)) data.faqs.forEach((item, index) => {
    if (!item || !text(item.question) || !text(item.answer)) errors.push(`가이드 FAQ ${index + 1} 내용을 입력해 주세요.`);
  });
  if (Array.isArray(data.sources)) data.sources.forEach((item, index) => {
    if (!item || !text(item.label) || !text(item.url) || !text(item.checked_at)) errors.push(`가이드 출처 ${index + 1} 내용을 입력해 주세요.`);
  });
  return errors;
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function matchesSecret(received, expected) {
  if (!received || !expected) return false;
  const encoder = new TextEncoder();
  const [receivedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(received)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(receivedHash);
  const right = new Uint8Array(expectedHash);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < left.length; index += 1) mismatch |= left[index] ^ right[index];
  return mismatch === 0;
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'apt-price-compare-pages-function',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function authorize(context) {
  const adminKey = context.request.headers.get('X-Admin-Key') ?? '';
  if (!(await matchesSecret(adminKey, context.env.ADMIN_SAVE_KEY))) {
    return json({ message: '관리자 저장 키가 올바르지 않습니다.' }, 401);
  }
  if (!context.env.GITHUB_TOKEN) {
    return json({ message: 'Cloudflare에 GITHUB_TOKEN Secret이 설정되지 않았습니다.' }, 500);
  }
  return null;
}

function repositoryRequest(context, filePath) {
  const owner = context.env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = context.env.GITHUB_REPO || DEFAULT_REPO;
  const branch = context.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const encodedPath = filePath.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return {
    branch,
    apiUrl: `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`,
    headers: githubHeaders(context.env.GITHUB_TOKEN),
  };
}

async function getEntry(context, filePath) {
  const request = repositoryRequest(context, filePath);
  const response = await fetch(`${request.apiUrl}?ref=${encodeURIComponent(request.branch)}`, { headers: request.headers });
  return { ...request, response };
}

async function failureMessage(response, fallback) {
  const result = await response.json().catch(() => null);
  return result?.message ?? fallback;
}

async function putFile(context, filePath, content, message) {
  const current = await getEntry(context, filePath);
  let sha;
  if (current.response.ok) {
    const entry = await current.response.json();
    sha = entry.sha;
  } else if (current.response.status !== 404) {
    return { error: await failureMessage(current.response, '기존 GitHub 파일을 조회하지 못했습니다.') };
  }

  const response = await fetch(current.apiUrl, {
    method: 'PUT',
    headers: current.headers,
    body: JSON.stringify({
      message,
      branch: current.branch,
      content: encodeBase64(`${JSON.stringify(content, null, 2)}\n`),
      ...(sha ? { sha } : {}),
    }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) return { error: result?.message ?? 'GitHub에 JSON 파일을 저장하지 못했습니다.' };
  return { created: !sha, commitUrl: result?.commit?.html_url ?? null };
}

async function deleteFile(context, filePath, sha, message) {
  const request = repositoryRequest(context, filePath);
  const response = await fetch(request.apiUrl, {
    method: 'DELETE',
    headers: request.headers,
    body: JSON.stringify({ message, branch: request.branch, sha }),
  });
  if (!response.ok) return await failureMessage(response, 'GitHub에서 JSON 파일을 삭제하지 못했습니다.');
  const result = await response.json().catch(() => null);
  return { commitUrl: result?.commit?.html_url ?? null };
}

async function saveLegacyComplex(context, data) {
  const errors = validateComplexData(data);
  if (errors.length) return json({ message: errors.join(' ') }, 400);
  const filePath = `${COMPLEX_DIRECTORY}/${text(data.id)}.json`;
  const saved = await putFile(context, filePath, data, `Update complex data for ${data.name}`);
  if (saved.error) return json({ message: saved.error }, 502);
  return json({
    message: `${data.name} JSON을 GitHub에 저장했습니다. Cloudflare 재배포 후 화면에 반영됩니다.`,
    filePath,
    commitUrl: saved.commitUrl,
  });
}

async function saveSnapshot(context, body) {
  const capturedDate = text(body.captured_date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(capturedDate)) {
    return json({ message: '수집 기준일은 YYYY-MM-DD 형식이어야 합니다.' }, 400);
  }
  const data = body.complex;
  const errors = validateComplexData(data);
  if (errors.length) return json({ message: errors.join(' ') }, 400);

  const id = text(data.id);
  const complexPath = `${COMPLEX_DIRECTORY}/${id}.json`;
  const currentComplex = await getEntry(context, complexPath);
  if (currentComplex.response.status === 404) {
    const created = await putFile(
      context,
      complexPath,
      { ...data, listings: [] },
      `Add complex metadata for ${data.name}`,
    );
    if (created.error) return json({ message: created.error }, 502);
  } else if (!currentComplex.response.ok) {
    return json({ message: await failureMessage(currentComplex.response, '단지 기본 파일을 조회하지 못했습니다.') }, 502);
  }

  const snapshotPath = `${SNAPSHOT_DIRECTORY}/${id}/${capturedDate}.json`;
  const snapshot = {
    complex_id: id,
    complex_name: data.name,
    captured_date: capturedDate,
    listings: data.listings,
  };
  const saved = await putFile(context, snapshotPath, snapshot, `Save ${capturedDate} listing snapshot for ${data.name}`);
  if (saved.error) return json({ message: saved.error }, 502);
  return json({
    message: `${data.name}의 ${capturedDate} 수집 데이터를 저장했습니다. 재배포 후 최신 분포와 기간별 변화에 반영됩니다.`,
    filePath: snapshotPath,
    commitUrl: saved.commitUrl,
  });
}

async function saveDisplaySettings(context, body) {
  const settings = body.settings;
  const errors = validateDisplaySettings(settings);
  if (errors.length) return json({ message: errors.join(' ') }, 400);
  const saved = await putFile(context, DISPLAY_SETTINGS_PATH, settings, 'Update dashboard display settings');
  if (saved.error) return json({ message: saved.error }, 502);
  return json({
    message: '표시 설정을 GitHub에 저장했습니다. Cloudflare 재배포 후 초기 표시 단지, 색상, 평형 그룹이 분석 화면에 반영됩니다.',
    filePath: DISPLAY_SETTINGS_PATH,
    commitUrl: saved.commitUrl,
  });
}

async function saveComplexGuide(context, body) {
  const guide = body.guide;
  const errors = validateComplexGuide(guide);
  if (errors.length) return json({ message: errors.join(' ') }, 400);
  const filePath = `${GUIDE_DIRECTORY}/${text(guide.complex_id)}.json`;
  const saved = await putFile(context, filePath, guide, `Update resident guide for ${guide.title}`);
  if (saved.error) return json({ message: saved.error }, 502);
  return json({
    message: `${guide.title} 생활 가이드를 GitHub에 저장했습니다. Cloudflare 재배포 후 우리 단지 탭에 반영됩니다.`,
    filePath,
    commitUrl: saved.commitUrl,
  });
}

async function saveComplexFile(context) {
  const unauthorized = await authorize(context);
  if (unauthorized) return unauthorized;
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ message: '요청 JSON을 읽을 수 없습니다.' }, 400);
  }
  if (body?.operation === 'save_snapshot') return saveSnapshot(context, body);
  if (body?.operation === 'save_display_settings') return saveDisplaySettings(context, body);
  if (body?.operation === 'save_complex_guide') return saveComplexGuide(context, body);
  return saveLegacyComplex(context, body);
}

async function deleteComplexFile(context) {
  const unauthorized = await authorize(context);
  if (unauthorized) return unauthorized;
  let data;
  try {
    data = await context.request.json();
  } catch {
    return json({ message: '삭제할 단지 정보를 읽을 수 없습니다.' }, 400);
  }
  const id = text(data.id);
  const name = text(data.name) || id;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) return json({ message: '삭제할 단지 id가 올바르지 않습니다.' }, 400);

  const snapshotFolder = await getEntry(context, `${SNAPSHOT_DIRECTORY}/${id}`);
  if (snapshotFolder.response.ok) {
    const entries = await snapshotFolder.response.json();
    for (const entry of entries.filter((item) => item.type === 'file' && item.name.endsWith('.json'))) {
      const deleted = await deleteFile(context, entry.path, entry.sha, `Delete snapshot data for ${name} (${entry.name})`);
      if (typeof deleted === 'string') return json({ message: deleted }, 502);
    }
  } else if (snapshotFolder.response.status !== 404) {
    return json({ message: await failureMessage(snapshotFolder.response, '스냅샷 목록을 조회하지 못했습니다.') }, 502);
  }

  const complexPath = `${COMPLEX_DIRECTORY}/${id}.json`;
  const current = await getEntry(context, complexPath);
  if (current.response.status === 404) return json({ message: '삭제할 단지 JSON 파일을 찾지 못했습니다.' }, 404);
  if (!current.response.ok) return json({ message: await failureMessage(current.response, '기존 GitHub 파일을 조회하지 못했습니다.') }, 502);
  const entry = await current.response.json();
  const deleted = await deleteFile(context, complexPath, entry.sha, `Delete complex data for ${name}`);
  if (typeof deleted === 'string') return json({ message: deleted }, 502);
  return json({
    message: `${name} 단지와 저장된 날짜별 스냅샷을 삭제했습니다. Cloudflare 재배포 후 화면에서 사라집니다.`,
    filePath: complexPath,
    commitUrl: deleted.commitUrl,
  });
}

export function onRequest(context) {
  if (context.request.method === 'POST') return saveComplexFile(context);
  if (context.request.method === 'DELETE') return deleteComplexFile(context);
  return json({ message: 'POST 또는 DELETE 요청만 지원합니다.' }, 405);
}
