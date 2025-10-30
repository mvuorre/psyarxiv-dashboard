---
title: Contributor Affiliations
---

# Contributor Affiliations

This page shows the distribution of contributor affiliations based on their institutional employment history.

```js
const affiliations = FileAttachment("data/contributors-by-affiliation.csv").csv({typed: true});
```

```js
const topN = view(Inputs.range([10, 200], {value: 20, step: 10, label: "Show top N institutions"}));
```

## Top Institutions

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
      x: "count",
      y: "institution",
      fill: "count",
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
  columns: ["institution", "count"],
  header: {
    institution: "Institution",
    count: "Contributors"
  },
  width: {
    institution: 600,
    count: 150
  },
  select: false
})
```

Total unique institutions: **${affiliations.length.toLocaleString()}**. Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com). Affiliations are extracted **as-is** from OSF users' metadata and thus may contain errors, variations in affiliation names, etc. If you use the OSF / PsyArXiv, please consider ensuring that your user metadata is correct.
