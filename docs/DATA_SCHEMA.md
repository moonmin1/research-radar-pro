# Data schema

핵심 schema는 `data/schema.json`에 있습니다. 주요 필드의 의미는 다음과 같습니다.

| Field | Meaning |
|---|---|
| `id` | 영구 식별자. URL이나 display title 변경 시에도 가능하면 유지 |
| `title` | 원문 제목 |
| `titleKo` | 편집된 한국어 제목. 자동 수집 시 원문 제목과 동일할 수 있음 |
| `kind` | paper, preprint, review, method, phd, postbac, internship, visiting, conference 등 |
| `topics` | `data/topics.json`의 ID 목록 |
| `source` | 기관·저널·index와 authority level |
| `publishedAt` | 논문 발표일 또는 공고 확인일 |
| `deadlineAt` | 실제 지원·등록·abstract 마감일 |
| `summary` | 핵심 내용. 자동 item은 abstract 또는 metadata 설명 |
| `whyItMatters` | 사용자 연구 관심사와 연결되는 이유 |
| `recommendedAction` | 읽기·지원·저장 등 다음 행동 |
| `eligibility` | international, career stage, visa, funding. 불확실하면 `null` |
| `verification` | official-page, official-feed, peer-reviewed, preprint, automated-metadata 등 |
| `signals` | 0–100 범위의 relevance/novelty/actionability/authority |
| `ingestedBy` | curated, europepmc, biorxiv, nih-rss 등 provenance |

## Editorial record 최소 원칙

1. official URL 또는 DOI를 사용합니다.
2. 날짜와 deadline을 구분합니다.
3. international eligibility는 명시적 근거가 없으면 `null`입니다.
4. `whyItMatters`는 단순 주제 반복이 아니라 사용자의 연구 방향과의 연결을 적습니다.
5. preprint는 `verification.level = preprint`로 유지합니다.
