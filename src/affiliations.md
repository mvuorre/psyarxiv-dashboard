---
title: Contributor Affiliations
---

# PsyArXiv Contributor Affiliations

```js
import {aggregateData, toCumulative, timeSeriesChart} from "./components/timeseries.js";
```

```js
import {
  datasetteSqlPageUrl,
  contributorsByAffiliationContributorSql,
  contributorsByAffiliationContributorUrl,
  contributorsByAffiliationPreprintSql,
  contributorsByAffiliationPreprintUrl,
  affiliationsFirstAppearanceByDateSql,
  affiliationsFirstAppearanceByDateUrl,
  affiliationsOnPreprintsByDateSql,
  affiliationsOnPreprintsByDateUrl
} from "./data/queries.js";
```

```js
const affiliations = FileAttachment("data/contributors-by-affiliation.csv").csv({typed: true});
```

```js
const affiliationsByDate = FileAttachment("data/affiliations-first-appearance-by-date.csv").csv({typed: true});
```

```js
const affiliationsOnPreprintsByDate = FileAttachment("data/affiliations-on-preprints-by-date.csv").csv({typed: true});
```

```js
// Parse dates and calculate totals
const affiliationsData = affiliationsByDate.map(d => ({...d, date: new Date(d.date)}));
const affiliationsOnPreprintsData = affiliationsOnPreprintsByDate.map(d => ({...d, date: new Date(d.date)}));
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Total Unique Institutions</h2>
    <span class="big">${affiliations.length.toLocaleString()}</span>
  </div>
</div>

```js
const affiliationsGranularity = view(Inputs.radio(
  ["daily", "weekly", "monthly", "yearly"],
  {label: "Granularity", value: "weekly"}
));
```

```js
const affiliationsCumulative = view(Inputs.radio(
  ["regular", "cumulative"],
  {label: "Count type", value: "regular"}
));
```

```js
const aggregatedAffiliations = aggregateData(affiliationsData, affiliationsGranularity);
const displayAffiliations = affiliationsCumulative === "cumulative" ? toCumulative(aggregatedAffiliations) : aggregatedAffiliations;

const aggregatedAffiliationsOnPreprints = aggregateData(affiliationsOnPreprintsData, affiliationsGranularity);
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>${affiliationsCumulative === "cumulative" ? "Cumulative" : "New"} ${affiliationsGranularity} affiliations</h2>
    ${resize((width) => timeSeriesChart(displayAffiliations, {width, granularity: affiliationsGranularity}))}
  </div>
</div>

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Total ${affiliationsGranularity} affiliations</h2>
    ${resize((width) => timeSeriesChart(aggregatedAffiliationsOnPreprints, {width, granularity: affiliationsGranularity}))}
  </div>
</div>

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
  x: {label: "Number of contributors", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(topAffiliations, {
      x: "contributor_count",
      y: "institution",
      fill: "var(--theme-foreground-focus)",
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
  x: {label: "Number of preprints", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(topByPreprints, {
      x: "preprint_count",
      y: "institution",
      fill: "var(--theme-foreground-focus)",
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

<div style="max-width: 1000px;">

```js
Inputs.table(search, {
  columns: ["institution", "contributor_count", "preprint_count"],
  header: {
    institution: "Institution",
    contributor_count: "Contributors",
    preprint_count: "Preprints"
  },
  sort: "preprint_count",
  reverse: true,
  select: false
})
```

</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

```js
html`<div>
  <p>Data source queries:</p>
  <ul>
    <li>
      Contributors per institution (all known affiliations):
      <a href="${contributorsByAffiliationContributorUrl}">JSON</a>
      |
      <a href="${datasetteSqlPageUrl(contributorsByAffiliationContributorSql)}">SQL page</a>
    </li>
    <li>
      Preprints per institution (current affiliations):
      <a href="${contributorsByAffiliationPreprintUrl}">JSON</a>
      |
      <a href="${datasetteSqlPageUrl(contributorsByAffiliationPreprintSql)}">SQL page</a>
    </li>
    <li>
      New affiliations by first appearance on preprints:
      <a href="${affiliationsFirstAppearanceByDateUrl}">JSON</a>
      |
      <a href="${datasetteSqlPageUrl(affiliationsFirstAppearanceByDateSql)}">SQL page</a>
    </li>
    <li>
      Distinct affiliations on preprints by date:
      <a href="${affiliationsOnPreprintsByDateUrl}">JSON</a>
      |
      <a href="${datasetteSqlPageUrl(affiliationsOnPreprintsByDateSql)}">SQL page</a>
    </li>
  </ul>
</div>`
```

Contributor counts: Each unique contributor is counted once per institution that appears anywhere in their employment history (past or present positions).

Preprint counts:
- Only latest versions of preprints are counted
- Only bibliographic authors are counted
- Only current/ongoing affiliations are credited

New affiliations:
- First appearance of an institution on any preprint in the selected time bucket
- Only latest versions of preprints are counted
- Only bibliographic authors are counted
- Only current/ongoing affiliations are credited

Total affiliations:
- Distinct institutions appearing on preprints in the selected time bucket
- Only latest versions of preprints are counted
- Only bibliographic authors are counted
- Only current/ongoing affiliations are credited

Affiliations are extracted as-is from OSF users' self-reported metadata. This means:
- Institution names may have spelling variations or inconsistencies
- Employment history completeness and accuracy varies by user
- Users may not keep their "ongoing" status updated
- Some institutions may be over/under-represented due to data quality issues
