const DATA_DIRECTORY = 'src/data/complexes';
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
    return ['JSON 최상위 값은 객체여야 합니다.'];
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
    'X-GitHub-Api-Version': '2026-03-10',
  };
}

async function saveComplexFile(context) {
  const adminKey = context.request.headers.get('X-Admin-Key') ?? '';
  if (!(await matchesSecret(adminKey, context.env.ADMIN_SAVE_KEY))) {
    return json({ message: '관리자 저장 키가 올바르지 않습니다.' }, 401);
  }

  if (!context.env.GITHUB_TOKEN) {
    return json({ message: 'Cloudflare에 GITHUB_TOKEN Secret이 설정되지 않았습니다.' }, 500);
  }

  let data;
  try {
    data = await context.request.json();
  } catch {
    return json({ message: '요청 JSON을 읽을 수 없습니다.' }, 400);
  }

  const errors = validateComplexData(data);
  if (errors.length) return json({ message: errors.join(' ') }, 400);

  const id = text(data.id);
  const filePath = `${DATA_DIRECTORY}/${id}.json`;
  const owner = context.env.GITHUB_OWNER || DEFAULT_OWNER;
  const repo = context.env.GITHUB_REPO || DEFAULT_REPO;
  const branch = context.env.GITHUB_BRANCH || DEFAULT_BRANCH;
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}`;
  const headers = githubHeaders(context.env.GITHUB_TOKEN);
  const currentResponse = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });

  let sha;
  if (currentResponse.ok) {
    const current = await currentResponse.json();
    sha = current.sha;
  } else if (currentResponse.status !== 404) {
    const failure = await currentResponse.json().catch(() => null);
    return json({ message: failure?.message ?? '기존 GitHub 파일을 조회하지 못했습니다.' }, 502);
  }

  const content = `${JSON.stringify(data, null, 2)}\n`;
  const updateResponse = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `${sha ? 'Update' : 'Add'} listing data for ${data.name}`,
      branch,
      content: encodeBase64(content),
      ...(sha ? { sha } : {}),
    }),
  });
  const updateResult = await updateResponse.json().catch(() => null);
  if (!updateResponse.ok) {
    return json({ message: updateResult?.message ?? 'GitHub에 JSON 파일을 저장하지 못했습니다.' }, 502);
  }

  return json({
    message: `${data.name} JSON을 GitHub에 ${sha ? '갱신' : '추가'}했습니다. Cloudflare 재배포 후 화면에 반영됩니다.`,
    filePath,
    commitUrl: updateResult?.commit?.html_url ?? null,
  });
}

export function onRequest(context) {
  if (context.request.method !== 'POST') {
    return json({ message: 'POST 요청만 지원합니다.' }, 405);
  }
  return saveComplexFile(context);
}
