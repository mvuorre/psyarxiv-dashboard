---
title: Contributor Affiliations
---

# Contributor Affiliations

```js
const affiliations = FileAttachment("data/contributors-by-affiliation.csv").csv({typed: true});
```

```js
const topN = view(Inputs.range([10, 200], {value: 20, step: 10, label: "Show top N institutions"}));
```

## Top Institutions by Contributors

```js
import * as Plot from "npm:@observablehq/plot";
```

```js
const topAffiliations = affiliations.slice(0, topN);
```

```js
Plot.plot({
  marginLeft: 200,
  height: Math.max(400, topN * 20),
  x: {label: "Number of contributors"},
  y: {label: null},
  marks: [
    Plot.barX(topAffiliations, {
      x: "contributor_count",
      y: "institution",
      fill: "contributor_count",
      sort: {y: "-x"},
      tip: true
    })
  ]
})
```

## Top Institutions by Preprints

```js
const topByPreprints = affiliations.slice(0, topN);
```

```js
Plot.plot({
  marginLeft: 200,
  height: Math.max(400, topN * 20),
  x: {label: "Number of preprints"},
  y: {label: null},
  marks: [
    Plot.barX(topByPreprints, {
      x: "preprint_count",
      y: "institution",
      fill: "preprint_count",
      sort: {y: "-x"},
      tip: true
    })
  ]
})
```

## All Affiliations

```js
const search = view(Inputs.search(affiliations, {placeholder: "Search institutions..."}));
```

```js
Inputs.table(search, {
  columns: ["institution", "contributor_count", "preprint_count"],
  header: {
    institution: "Institution",
    contributor_count: "Contributors",
    preprint_count: "Preprints"
  },
  width: {
    institution: 500,
    contributor_count: 120,
    preprint_count: 120
  },
  select: false
})
```

---

## Methodology and Data Notes

- **Total unique institutions**: ${affiliations.length.toLocaleString()}
- **Data source**: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com)

**Contributor counts**: Each unique contributor is counted once per institution that appears anywhere in their employment history (past or present positions).

**Preprint counts**:
- Only latest versions of preprints are counted
- Only bibliographic authors are counted
- Only current/ongoing affiliations are credited

**Limitations**: Affiliations are extracted as-is from OSF users' self-reported metadata. This means:
- Institution names may have spelling variations or inconsistencies
- Employment history completeness and accuracy varies by user
- Users may not keep their "ongoing" status updated
- Some institutions may be over/under-represented due to data quality issues
