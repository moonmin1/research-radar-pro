# Architecture · Three-Pillar Edition

## Product model

Research Radar separates every record into one primary `section`:

- `papers`: paper, preprint, review, method, news, commentary, guideline, policy
- `opportunities`: conference, workshop, webinar, internship, postbac, visiting, fellowship, funding
- `graduate`: PhD, master's, graduate program, application assistance

This is a decision taxonomy, not merely a visual category. Each section has a different ranking model and interface.

## Data flow

```text
Europe PMC ─┐
bioRxiv ────┼─> collectors -> normalized item schema -> deduplication
NIH RSS ────┤                                      ├-> curated override
page-watch ─┘                                      └-> review queue
                                                       |
                                                       v
                                             feed.json / RSS / ICS
                                                       |
                                                       v
                                              GitHub Pages PWA
```

## Ranking

- Papers: topic fit, base relevance, recency, novelty, source authority, actionability, Open Access
- Opportunities: topic fit, international eligibility, Visa/J-1 evidence, actionability, deadline
- Graduate admissions: international eligibility, exam requirements, funding evidence, deadline, program fit

## Client state

Bookmarks, read status, shortlist, notes, theme, and graduate application stages remain in the browser under `researchRadarProState.v2`. The storage key is intentionally retained during the v4 migration so existing personal state survives.

## Safety model

- Automated metadata never becomes a verified editorial interpretation automatically.
- Eligibility is not inferred from vague language.
- Page changes enter `data/review-queue.json` before publication.
- Curated records win DOI, PMID, canonical URL, and normalized-title conflicts.
