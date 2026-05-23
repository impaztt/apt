# 단지비교랩

단지별 JSON 파일에 저장된 아파트 매매 호가를 평형별로 비교하는 모바일 우선 React 웹서비스입니다. 데이터베이스나 서버 없이 정적 파일을 빌드에 포함하므로 Cloudflare Pages에서 그대로 배포할 수 있습니다.

## 포함 기능

- 단지별 JSON 파일 자동 수집 및 필수값 검증
- 대시보드와 단지 상세 조회
- 비교 그룹별 전용면적 탭 비교
- 최저가, 최고가, 평균가, 중앙값, 평당가, 매물 수 계산
- 가격 범위, 평균 호가, 가격 분포 차트
- JSON 붙여넣기/업로드 검증, 미리보기, 파일 다운로드 화면

## 실행

```bash
npm install
npm run dev
```

## 데이터 파일 구조

단지 하나당 파일 하나를 [src/data/complexes](./src/data/complexes) 폴더에 둡니다. Vite가 폴더의 `.json` 파일을 자동으로 읽으므로 새 단지를 추가할 때 별도 인덱스 파일은 필요하지 않습니다.

```json
{
  "id": "hwaseo-prugio-edu",
  "name": "화서역푸르지오더에듀포레",
  "region": "수원시 장안구 정자동",
  "address": "경기도 수원시 장안구 정자동",
  "built_year": 2009,
  "household_count": 2571,
  "brand": "푸르지오",
  "updated_at": "2026-05-23",
  "comparison_groups": ["화서역·정자동 대형단지 비교"],
  "listings": [
    {
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
}
```

필수 단지 필드는 `id`, `name`, `updated_at`, `comparison_groups`, `listings`입니다. 매매 매물의 필수 필드는 `deal_type`, `price`, `exclusive_area_m2`입니다.

같은 그룹에서 비교할 단지들은 각 파일의 `comparison_groups`에 동일한 그룹명을 넣습니다. 한 단지가 여러 그룹에 포함될 수도 있습니다.

## 실제 데이터 반영 방법

1. 웹의 `JSON 입력` 메뉴에서 단지 전체 JSON을 붙여넣거나 파일을 불러옵니다.
2. `JSON 검증 및 미리보기`로 형식과 가격 계산 결과를 확인합니다.
3. `JSON 파일 다운로드`로 파일을 생성합니다.
4. 신규 단지는 다운로드한 파일을 `src/data/complexes/`에 추가합니다.
5. 기존 단지는 동일한 `id`의 JSON 파일 내용을 교체합니다.
6. GitHub에 푸시하면 Cloudflare Pages가 다시 빌드하고 화면 데이터가 갱신됩니다.

정적 웹페이지 자체는 Git 저장소의 파일을 직접 쓰거나 전체 사용자에게 즉시 반영할 수 없습니다. 별도 DB 없이 운영하는 경우 파일 변경과 재배포가 데이터 저장 절차입니다.

## Cloudflare Pages

```text
Framework preset: React (Vite)
Build command: npm run build
Build output directory: dist
Root directory: /
```

Vite 8은 Node.js `^20.19.0 || >=22.12.0`을 요구합니다. 프로젝트 루트의 `.node-version`은 Cloudflare 빌드 Node를 `22.16.0`으로 고정합니다. 환경변수는 필요하지 않습니다.

## 주요 경로

- `src/data/complexes/*.json`: 실제 단지 및 매물 데이터 원본
- `src/shared/data/staticData.ts`: JSON 파일 로딩과 검증
- `src/pages/ComplexDataInputPage.tsx`: JSON 파일 생성/미리보기
- `src/pages/DashboardPage.tsx`: 메인 대시보드
- `src/pages/ComparisonPage.tsx`: 평형별 비교 화면
