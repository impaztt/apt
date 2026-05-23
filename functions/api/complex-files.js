const COMPLEX_DIRECTORY = 'src/data/complexes';
const SNAPSHOT_DIRECTORY = 'src/data/snapshots';
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

async function saveComplexFile(context) {
  const unauthorized = await authorize(context);
  if (unauthorized) return unauthorized;
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ message: '요청 JSON을 읽을 수 없습니다.' }, 400);
  }
  return body?.operation === 'save_snapshot' ? saveSnapshot(context, body) : saveLegacyComplex(context, body);
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
