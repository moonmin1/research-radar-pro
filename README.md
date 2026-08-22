# Research Radar Pro

개인 관심사를 기준으로 **논문·preprint·미국 연구기회·학회·마감일**을 수집하고, 검증 수준과 지원 가능성을 분리해 보여주는 정적 연구정보 포털입니다. BRIC처럼 분야별 정보가 누적되지만, 일반 생명과학 뉴스가 아니라 다음 프로필에 맞춰 설계했습니다.

- 3D genome / chromatin architecture / cohesin / CTCF / enhancer–promoter
- Epigenetics / epigenome editing / chromatin engineering / CRISPR
- IVG / germline / oocyte / sperm / early development
- Single-molecule biophysics / TIRF / FRET / advanced imaging
- 미국 PhD·postbac·visiting·internship·fellowship 및 international/J-1 조건

## 구현 수준

### 사용자 화면

- `오늘의 레이더`: daily brief, high-fit signal, 72시간 신규 항목, 마감 경보
- `연구 피드`: 분야·유형·상태·키워드·맞춤도·최신순 필터
- `미국 연구기회`: international eligibility, visa/J-1, 제한 공고 분리
- `마감 캘린더`: 월간 달력, 개별/전체 `.ics` 내보내기
- `내 라이브러리`: 북마크, Shortlist, 읽음, 보관, 개인 메모, JSON/CSV export
- `수집 상태`: source health, provenance, page-watch review queue
- Command palette (`Ctrl/Cmd + K`), dark mode, 반응형 layout, offline snapshot

### 자동화

- Europe PMC REST API: 최근 논문 metadata
- bioRxiv API: 최근 preprint metadata
- NIH Guide RSS: 관련 funding notice
- Page watch: 선정한 프로그램·행사 공식 페이지의 visible-text hash 변경 감시
- DOI → PMID → canonical URL → normalized title 순서의 중복 제거
- `curated-first`: editorial record와 자동 수집 record가 충돌하면 editorial record 우선
- GitHub Actions: 매일 08:05 KST 수집 → 검증 → commit → GitHub Pages 배포
- RSS (`feed.xml`) 및 deadline iCalendar (`data/deadlines.ics`) 자동 생성

자동 수집 항목은 번역·해설이 완성된 editorial article로 가장하지 않습니다. 화면에서 `AUTO · REVIEW`, `PREPRINT`, `VERIFIED` provenance badge로 구분합니다.

## 가장 빠른 배포

1. 새 GitHub repository를 만들고 이 프로젝트의 **내용물 전체**를 repository root에 올립니다.
2. 기본 branch 이름을 `main`으로 유지합니다.
3. GitHub repository의 `Settings → Pages → Build and deployment → Source`를 **GitHub Actions**로 설정합니다.
4. `Actions → Update Research Radar and deploy Pages → Run workflow`를 한 번 실행합니다.
5. 이후 workflow가 매일 08:05 KST에 데이터를 갱신하고 Pages를 다시 배포합니다.

수집 스크립트는 Python standard library만 사용하므로 별도의 API key나 package 설치가 필요 없습니다.

## 로컬 실행

정적 파일은 `file://`로도 열리지만, PWA·Service Worker·JSON fetch까지 검증하려면 local HTTP server를 사용하십시오.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

파생 파일 재생성 및 검증:

```bash
python scripts/update_feed.py --offline
python scripts/validate.py
python scripts/build_site.py
python scripts/build_preview.py
```

실제 외부 source 수집:

```bash
python scripts/update_feed.py --live
```

## 편집 지점

- 관심도 가중치: `data/profile.json`
- topic label·색상: `data/topics.json`
- source 및 page-watch 목록: `data/sources.json`
- 검증된 editorial item: `data/curated.json`
- 자동 생성 feed: `data/feed.json`
- 검토 대기열: `data/review-queue.json`

Editorial item은 `data/feed.json`을 직접 수정하지 말고 `data/curated.json`에 추가하십시오. 다음 자동 실행에서 feed가 재생성됩니다.

## 안전장치

- 자동 수집은 metadata와 abstract 기반 relevance filter입니다. scientific correctness를 자동 보증하지 않습니다.
- `preprint`는 peer review 전 상태를 별도 표시합니다.
- international eligibility와 visa는 자동 추정하지 않습니다. 공식 페이지에서 검증된 curated item만 `true/false`를 사용합니다.
- page-watch 변화는 바로 게시하지 않고 `review-queue.json`에 기록합니다.
- GitHub Actions source failure가 발생해도 직전 automated record를 75일간 유지해 transient outage로 feed가 비는 것을 방지합니다.

구조와 운영 규칙은 `docs/ARCHITECTURE.md`, `docs/DATA_SCHEMA.md`, `docs/OPERATIONS.md`에 정리되어 있습니다.
