# 단지비교랩

단지별 JSON 파일에 저장된 아파트 매매 호가를 평형별로 비교하는 모바일 우선 React 웹서비스입니다. 데이터베이스나 서버 없이 정적 파일을 빌드에 포함하므로 Cloudflare Pages에서 그대로 배포할 수 있습니다.

## 포함 기능

- 단지별 JSON 파일 자동 수집 및 필수값 검증
- 대시보드와 단지 상세 조회
- 비교 그룹별 `전체` / 평형 탭 비교
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
      "area_pyeong": 33,
      "exclusive_area_pyeong": 25,
      "floor": 2,
      "total_floor": 25,
      "direction": "남동향",
      "verified_date": "2026-05-23",
      "source": "네이버부동산"
    }
  ]
}
```

필수 단지 필드는 `id`, `name`, `updated_at`, `comparison_groups`, `listings`입니다. 매매 매물의 필수 필드는 `deal_type`, `price`, `area_pyeong`, `exclusive_area_pyeong`입니다.

면적 표기는 입력된 평형 데이터를 그대로 기준으로 합니다.

```text
area_pyeong: 33
exclusive_area_pyeong: 25
화면 표시: 33평형 (전용 25평)
```

대시보드의 `전체` 탭에서는 등록된 모든 평형을 평형별로 나눠 각 단지의 가격 범위를 함께 보여줍니다. 특정 평형 탭에서는 같은 평형만 대상으로 최저가, 평균가와 단지 간 비교를 표시합니다.

같은 그룹에서 비교할 단지들은 각 파일의 `comparison_groups`에 동일한 그룹명을 넣습니다. 한 단지가 여러 그룹에 포함될 수도 있습니다.

## 브라우저에서 실제 데이터 저장

배포된 `JSON 입력` 화면에서 JSON을 입력하고 `GitHub에 저장`을 누르면 Cloudflare Pages Function이 GitHub Repository Contents API를 호출해 `src/data/complexes/{id}.json` 파일을 생성하거나 갱신합니다. GitHub에 새 커밋이 들어가면 연결된 Cloudflare Pages 배포가 다시 실행되어 대시보드 데이터가 반영됩니다.

최초 1회 Cloudflare Pages의 `Settings > Variables and Secrets`에서 다음 값을 설정하세요.

| 이름 | 유형 | 값 |
|---|---|---|
| `GITHUB_TOKEN` | Secret | GitHub fine-grained PAT, 해당 저장소 `Contents: Read and write` 권한 |
| `ADMIN_SAVE_KEY` | Secret | 웹 화면에서 입력할 관리자 저장 비밀번호 |
| `GITHUB_OWNER` | Variable | `impaztt` (선택, 기본값 포함) |
| `GITHUB_REPO` | Variable | `apt` (선택, 기본값 포함) |
| `GITHUB_BRANCH` | Variable | `main` (선택, 기본값 포함) |

`GITHUB_TOKEN`은 브라우저 코드에 포함되지 않고 Cloudflare Function에서만 사용됩니다. `ADMIN_SAVE_KEY`는 저장 버튼을 누를 때 Function 요청을 인증하기 위한 별도 비밀번호입니다.
Secret을 추가하거나 변경한 뒤에는 Cloudflare Pages를 한 번 다시 배포해야 Function에서 사용할 수 있습니다.

### 입력 순서

1. 웹의 `JSON 입력` 메뉴에서 단지 전체 JSON을 붙여넣거나 파일을 불러옵니다.
2. `JSON 검증 및 미리보기`로 형식과 가격 계산 결과를 확인합니다.
3. Cloudflare에 설정한 `ADMIN_SAVE_KEY` 값을 입력합니다.
4. `GitHub에 저장`을 누릅니다.
5. 신규 단지는 새 JSON 파일로 추가되고, 기존 단지는 동일한 `id` 파일이 갱신됩니다.
6. Cloudflare Pages 재배포가 완료되면 화면 데이터가 갱신됩니다.

다운로드 버튼은 파일 백업 또는 수동 반영이 필요할 때 그대로 사용할 수 있습니다.

## Cloudflare Pages

```text
Framework preset: React (Vite)
Build command: npm run build
Build output directory: dist
Root directory: /
```

Vite 8은 Node.js `^20.19.0 || >=22.12.0`을 요구합니다. 프로젝트 루트의 `.node-version`은 Cloudflare 빌드 Node를 `22.16.0`으로 고정합니다. JSON 조회 화면만 사용할 경우 별도 환경변수가 필요하지 않습니다.

브라우저 저장 기능을 사용할 경우 위의 Function Secret/Variable을 설정해야 합니다. [public/_routes.json](./public/_routes.json)은 `/api/*` 요청만 Pages Function으로 전달하고 정적 화면 요청은 그대로 제공하도록 구성합니다.

## 주요 경로

- `src/data/complexes/*.json`: 실제 단지 및 매물 데이터 원본
- `src/shared/data/staticData.ts`: JSON 파일 로딩과 검증
- `src/pages/ComplexDataInputPage.tsx`: JSON 파일 생성/미리보기
- `functions/api/complex-files.js`: GitHub 파일 저장 Pages Function
- `src/pages/DashboardPage.tsx`: 메인 대시보드
- `src/pages/ComparisonPage.tsx`: 평형별 비교 화면
