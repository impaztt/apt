# 단지비교랩

사용자가 입력한 아파트 매매 호가를 단지와 전용면적별로 비교하는 모바일 우선 React MVP입니다. 실거래가 API 연동은 다음 단계로 남겨 두고, 현재 버전은 수기 입력 및 JSON 일괄 입력 데이터를 중심으로 동작합니다.

## 포함 기능

- 단지 등록, 수정, 삭제 및 상세 조회
- 매물 단건 등록, JSON 미리보기/일괄 등록, 삭제
- 거래유형별 필수값 검사 및 중복 의심 매물 자동 표시
- 비교 그룹 생성, 단지 추가 및 제거
- 전용면적 그룹별 최저가, 최고가, 평균가, 중앙값, 매물 수 계산
- 가격 범위, 평균 호가, 가격 분포 Recharts 차트
- 모바일 하단 내비게이션과 데스크톱 사이드바 UI

## 실행

```bash
npm install
npm run dev
```

환경변수가 없으면 브라우저 `localStorage`에 제공되는 데모 데이터로 즉시 동작합니다. Supabase 프로젝트와 연결하려면 `.env.example`을 기준으로 `.env`를 만들고 값을 입력합니다.

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase 설정

1. Supabase SQL Editor에서 [001_initial_schema.sql](./supabase/migrations/001_initial_schema.sql)을 실행합니다.
2. 프로젝트 루트의 `.env`에 URL과 anon key를 설정합니다.
3. 앱을 재시작하면 좌측 배지 또는 모바일 헤더가 `Supabase 연결됨`/`LIVE`로 표시됩니다.

마이그레이션에는 `apartment_actual_transactions`와 실거래 요약 뷰도 2차 개발을 위해 준비되어 있습니다. 현재 앱은 `apartment_complexes`, `apartment_listings`, `comparison_groups`, `comparison_group_complexes`를 사용합니다.

## 배포

`npm run build`의 결과물은 `dist/`에 생성됩니다. Vercel 배포 시 상세 경로 새로고침을 위한 SPA rewrite가 [vercel.json](./vercel.json)에 포함되어 있습니다. Cloudflare Pages에서는 Vite 빌드 명령과 `dist` 출력 디렉터리를 지정하면 됩니다.

Cloudflare Pages 설정값:

```text
Framework preset: React (Vite)
Build command: npm run build
Build output directory: dist
Root directory: /
```

Vite 8은 Node.js `^20.19.0 || >=22.12.0`을 요구합니다. Cloudflare Pages 빌드에서도 안정적으로 같은 범위를 사용하도록 프로젝트 루트의 `.node-version`을 `22.16.0`으로 고정했습니다.

## 보안 주의

초기 MVP SQL은 로그인 없이 데이터를 입력할 수 있도록 anon 역할에 CRUD 정책을 허용합니다. 외부 공개 전에는 Supabase Auth 기반 관리자 권한을 적용하고 공개 쓰기 정책을 교체해야 합니다. 공공데이터 API 키도 추후 Edge Function 또는 서버 배치에만 보관해야 합니다.

## JSON 입력 형식

등록된 단지의 `complex_name` 또는 `complex_id`를 포함한 배열을 입력합니다.

```json
[
  {
    "complex_name": "화서역푸르지오더에듀포레",
    "building_no": "108동",
    "deal_type": "매매",
    "price": 670000000,
    "exclusive_area_m2": 59,
    "floor": 2,
    "total_floor": 25,
    "direction": "남동향",
    "verified_date": "2026-05-23",
    "source": "네이버부동산"
  }
]
```

필수값은 `complex_name`/`complex_id`, `deal_type`, `price`, `exclusive_area_m2`입니다. 같은 단지, 동, 전용면적, 가격, 층/층구분, 방향에 유사 확인일이 겹치면 저장 시 `중복 의심`으로 표시합니다.

## 주요 경로

- `src/pages`: 화면 단위 컴포넌트
- `src/features/*/api.ts`: Supabase 또는 데모 저장소 CRUD
- `src/features/listings/statistics.ts`: 평형 요약 계산
- `src/shared/data/AppDataContext.tsx`: 화면 공통 데이터 갱신
- `supabase/migrations`: 데이터베이스 스키마와 뷰
