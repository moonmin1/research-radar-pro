# Research Radar · Three-Pillar Edition

개인 연구 관심사에 맞춰 **논문 / 학회·연구기회 / 대학원 공고**를 서로 다른 의사결정 흐름으로 관리하는 static PWA입니다. GitHub Actions가 metadata를 수집·정규화·검증하고 GitHub Pages에 매일 재배포합니다.

## 1. 세 개의 대분류

### 논문 (`#/papers`)
- Peer-reviewed paper, preprint, review, method, policy를 분리합니다.
- Topic fit, recency, source authority, novelty, actionability, Open Access를 반영해 개인화 점수를 계산합니다.
- `VERIFIED`, `PREPRINT`, `AUTO · REVIEW` provenance를 명시합니다.

### 학회·연구기회 (`#/opportunities`)
- 학회·workshop·webinar와 internship·postbac·visiting을 별도 lane으로 구성합니다.
- International eligibility, Visa/J-1 evidence, funding, deadline을 함께 표시합니다.
- 불확실한 eligibility는 추정하지 않고 `확인 필요`로 유지합니다.

### 대학원 공고 (`#/graduate`)
- PhD application cycle, opening date, deadline, GRE, English test, fee, recommendation, funding을 비교합니다.
- 프로그램별 개인 진행 단계를 `관심 → 랩 조사 → 지원 준비 → 제출 → 면접 → 합격·오퍼`로 저장합니다.
- 사용자 상태는 기존과 동일한 browser `localStorage` key에 저장되어 업데이트 후에도 북마크와 메모가 유지됩니다.

## 2. 자동 수집과 배포

Workflow: `.github/workflows/update-and-deploy.yml`

매일 08:05 KST 전후에:

1. Europe PMC 최근 논문 수집
2. bioRxiv preprint 수집
3. NIH Guide RSS funding 수집
4. 공식 학회·프로그램·대학원 페이지 변경 감시
5. 공통 schema와 3개 section으로 정규화
6. DOI·PMID·URL·title fingerprint 중복 제거
7. validator 실행
8. RSS, iCalendar, fallback snapshot 생성
9. GitHub Pages 재배포

## 3. 로컬 검증

```bash
python scripts/update_feed.py --offline
python scripts/validate.py
python scripts/build_site.py
python scripts/build_preview.py
node --check assets/js/app.js
node --check assets/js/scoring.js
node --check assets/js/storage.js
```

`_site/`은 GitHub Pages artifact이며, `dist/research-radar-pro-preview.html`은 서버 없이 여는 standalone preview입니다.

## 4. Editorial safeguard

자동 metadata는 원문을 Figure 수준으로 해석한 editorial article이 아닙니다. 자동 항목은 `AUTO · REVIEW`로 표시하고, 공식 페이지에서 확인한 자격·마감·재정지원만 확정 필드로 제공합니다. Page-watch 변화는 즉시 발행하지 않고 `data/review-queue.json`에 보냅니다.

## 5. 주요 파일

```text
index.html
assets/css/app.css
assets/js/app.js
assets/js/scoring.js
assets/js/storage.js
data/curated.json
data/feed.json
data/schema.json
scripts/update_feed.py
scripts/validate.py
.github/workflows/update-and-deploy.yml
```
