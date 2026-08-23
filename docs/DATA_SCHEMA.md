# Data schema v3

Every item contains `section` and `subsection` in addition to the common metadata fields.

## Required taxonomy

```json
{
  "section": "papers | opportunities | graduate",
  "subsection": "paper | preprint | review | method | insight | events | research-experience | funding | phd | other-programs"
}
```

## Graduate admissions extension

Graduate records may include:

```json
{
  "admission": {
    "cycle": "Fall 2027",
    "degree": "PhD",
    "applicationOpen": "2026-10-01",
    "applicationOpenText": "October 1, 2026",
    "deadlineText": "December 1, 2026 · 5:00 pm EST",
    "gre": "Not required",
    "english": "Required unless exempt",
    "fee": "US$90",
    "letters": "3",
    "funding": "Full tuition + stipend",
    "applicationAid": "BAAP ...",
    "researchModel": "Rotations / interdisciplinary training"
  }
}
```

Only fields confirmed from official sources should be populated as definitive facts. Unknown values remain null or are shown as `확인 필요`.
