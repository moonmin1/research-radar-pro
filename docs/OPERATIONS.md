# Operations

## Daily run

Workflow schedule은 UTC 기준 `23:05`, 즉 KST 기준 다음 날 `08:05`입니다. GitHub scheduled workflow는 정확한 시각보다 늦게 시작될 수 있습니다.

## Failure interpretation

`수집 상태`의 source status:

- `healthy`: 직전 live run 성공
- `configured`: offline build 또는 아직 live run 전
- `error`: 직전 source fetch/parse 실패
- `disabled`: `data/sources.json`에서 비활성화

파이프라인은 source failure를 격리합니다. `--strict-network`를 사용한 경우에만 source failure를 exit code 2로 승격합니다.

## Page-watch review

공식 프로그램 페이지의 visible text hash가 바뀌면 `review-queue.json`에 `needs-review`가 추가됩니다. 변화가 반드시 deadline 변경을 뜻하는 것은 아니므로 자동 발행하지 않습니다.

검토 후:

1. 공식 페이지에서 변경 내용을 확인합니다.
2. `data/curated.json`의 해당 item을 수정합니다.
3. review queue entry를 삭제하거나 별도 archive로 이동합니다.
4. `python scripts/update_feed.py --offline`과 `python scripts/validate.py`를 실행합니다.

## Adding a source

공식 JSON/XML/RSS source는 별도 collector로 구현합니다. HTML scraping은 가능한 한 피하고 page-watch 용도로만 사용합니다. 새 collector는 source health에 latency, received, accepted count를 기록해야 합니다.

## Privacy

사용자의 bookmark, read, shortlist, memo, personalized weight는 browser `localStorage`에만 저장됩니다. 배포 repository로 업로드되지 않습니다. JSON export는 사용자가 직접 실행할 때만 생성됩니다.
