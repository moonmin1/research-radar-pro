# Architecture

## 1. Collect

`update_feed.py --live`가 Europe PMC, bioRxiv, NIH Guide RSS, curated page-watch를 독립적으로 실행합니다. 한 source의 실패가 다른 source 또는 배포 전체를 중단하지 않도록 source-level isolation을 사용합니다.

## 2. Normalize

모든 항목을 하나의 version 2 schema로 변환합니다. 자동 수집 item에는 다음을 강제합니다.

- `verification.level = automated-metadata` 또는 `preprint`
- eligibility 미추정
- abstract가 없으면 명시적인 metadata-only 설명
- `ingestedBy`에 provenance 저장

## 3. Curated-first deduplication

우선순위는 `curated → freshly automated → retained automated`입니다. 중복 fingerprint는 다음 순서로 평가합니다.

1. normalized DOI
2. PMID
3. canonical URL
4. normalized title
5. item ID

Page query parameter는 유지하되 일반적인 tracking parameter만 제거합니다.

## 4. Rank

서버 build score는 daily brief 순서를 만들기 위한 deterministic heuristic입니다. 실제 화면의 personalized score는 브라우저에서 다시 계산되며 다음 변수를 사용합니다.

- topic fit
- freshness
- source authority
- novelty
- actionability
- open access
- international eligibility
- visa/J-1 evidence
- deadline urgency

사용자는 `개인화 설정`에서 topic weight와 opportunity preference를 변경할 수 있습니다.

## 5. Publish

파이프라인은 다음 파생 artifact를 생성합니다.

- `data/feed.json`
- `data/daily-brief.json`
- `data/source-health.json`
- `data/review-queue.json`
- `assets/js/fallback-data.js`
- `feed.xml`
- `data/deadlines.ics`

`build_site.py`는 public deployment에 필요한 파일만 `_site/`로 복사합니다.

## 6. Offline/PWA

- JSON은 network-first
- app shell은 stale-while-revalidate
- navigation failure는 cached `index.html`, 그다음 `offline.html`
- standalone preview는 fallback snapshot을 inline하여 server 없이 작동
