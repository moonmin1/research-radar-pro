# Operations

## Scheduled run

The workflow runs daily at 23:05 UTC, approximately 08:05 KST the following day. GitHub may delay scheduled jobs.

## Routine checks

1. Confirm the latest Actions run is green.
2. Open `수집 상태` and inspect source failures.
3. Review `data/review-queue.json` before turning a page-watch change into a curated record.
4. Verify graduate deadlines, international eligibility, exam rules, and funding against official pages.

## Release update

Uploading changed source files to `main` triggers validation, build, commit of refreshed data, and Pages deployment. Do not create a second Pages workflow.

## Failure diagnosis

- `scripts/update_feed.py not found`: project files are not at repository root.
- validation failure: inspect the item ID and required field in the log.
- Pages artifact missing: `scripts/build_site.py` did not produce `_site`.
- push permission failure: repository Actions workflow permissions must allow read/write.
- stale interface after a successful deploy: hard refresh once so the new service-worker cache version activates.
