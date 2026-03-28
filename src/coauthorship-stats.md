---
title: Coauthorship
---

# PsyArXiv Coauthorship

```js
import * as Plot from "npm:@observablehq/plot";
```

```js
import {
  coauthorshipOverviewSql,
  coauthorshipOverviewUrl,
  datasetteSqlPageUrl,
  degreeDistributionSql,
  degreeDistributionUrl,
  topCollaboratorsSql,
  topCollaboratorsUrl
} from "./data/queries.js";
```

```js
const coauthorshipOverviewRows = FileAttachment("data/coauthorship-overview.csv").csv({typed: true});
```

```js
const topCollaborators = FileAttachment("data/coauthorship-top-collaborators.csv").csv({typed: true});
```

```js
const degreeDistribution = FileAttachment("data/coauthorship-degree-distribution.csv").csv({typed: true});
```

```js
const overview = coauthorshipOverviewRows[0];
```

```js
const maxDegree = Math.max(...degreeDistribution.map((d) => d.degree));
```

<div class="grid grid-cols-2">
  <div class="card">
    <h2>Connected Authors</h2>
    <span class="big">${overview.connected_authors.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Coauthor Edges</h2>
    <span class="big">${overview.edge_count.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Average Degree</h2>
    <span class="big">${overview.avg_degree.toFixed(2)}</span>
  </div>
  <div class="card">
    <h2>Max Degree</h2>
    <span class="big">${overview.max_degree.toLocaleString("en-US")}</span>
  </div>
</div>

```js
const topCollaboratorsN = view(Inputs.range([10, 100], {
  value: 20,
  step: 10,
  label: "Show top N collaborators"
}));
```

## Top Collaborators

```js
const topCollaboratorsChartData = topCollaborators.slice(0, topCollaboratorsN);
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Authors With Most Distinct Coauthors</h2>
    ${resize((width) => Plot.plot({
      width,
      marginLeft: 220,
      height: Math.max(400, topCollaboratorsN * 20),
      x: {label: "Distinct coauthors", grid: true},
      y: {label: null},
      marks: [
        Plot.barX(topCollaboratorsChartData, {
          x: "collaborator_count",
          y: "full_name",
          fill: "var(--theme-foreground-focus)",
          sort: {y: "-x"},
          tip: true
        })
      ]
    }))}
  </div>
</div>

```js
const collaboratorSearch = view(Inputs.search(topCollaborators, {placeholder: "Search collaborators..."}));
```

<div style="max-width: 1000px;">

```js
Inputs.table(collaboratorSearch, {
  columns: ["full_name", "collaborator_count", "preprint_count"],
  header: {
    full_name: "Contributor",
    collaborator_count: "Distinct coauthors",
    preprint_count: "Preprints"
  },
  sort: "collaborator_count",
  reverse: true,
  select: false
})
```

</div>

## How Many Coauthors Authors Have

```js
const degreeExactMax = view(Inputs.range([5, maxDegree], {
  value: Math.min(15, maxDegree),
  step: 1,
  label: "Show exact degrees up to"
}));
```

```js
const degreeYScale = view(Inputs.radio(["linear", "log"], {
  value: "linear",
  label: "Y-axis scale"
}));
```

```js
const hiddenDegreeAuthors = degreeDistribution
  .filter((d) => d.degree > degreeExactMax)
  .reduce((sum, d) => sum + d.author_count, 0);
const groupedDegreeDistribution = [
  ...degreeDistribution
    .filter((d) => d.degree <= degreeExactMax)
    .map((d) => ({...d, degree_label: `${d.degree}`})),
  ...(hiddenDegreeAuthors > 0
    ? [{
        degree: degreeExactMax + 1,
        degree_label: `${degreeExactMax + 1}+`,
        author_count: hiddenDegreeAuthors
      }]
    : [])
];
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>How Many Coauthors Authors Have</h2>
    <p>Exact bars through ${degreeExactMax}; the rest are grouped into ${degreeExactMax + 1}+.</p>
    ${resize((width) => Plot.plot({
      width,
      height: 400,
      x: {
        label: "Coauthors",
        grid: true,
        domain: groupedDegreeDistribution.map((d) => d.degree_label)
      },
      y: {
        label: "Authors",
        grid: true,
        type: degreeYScale
      },
      marks: [
        Plot.barY(groupedDegreeDistribution, {
          x: "degree_label",
          y: "author_count",
          fill: "var(--theme-foreground-focus)",
          inset: 0.5,
          tip: true
        }),
        Plot.ruleY([degreeYScale === "log" ? 1 : 0])
      ]
    }))}
  </div>
</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

```js
html`<div>
  <p>Data source queries:</p>
  <ul>
    <li>
      Coauthorship network overview:
      <a href="${coauthorshipOverviewUrl}">JSON</a>
      |
      <a href="${datasetteSqlPageUrl(coauthorshipOverviewSql)}">SQL page</a>
    </li>
    <li>
      Top collaborators:
      <a href="${topCollaboratorsUrl}">JSON</a>
      |
      <a href="${datasetteSqlPageUrl(topCollaboratorsSql)}">SQL page</a>
    </li>
    <li>
      Degree distribution:
      <a href="${degreeDistributionUrl}">JSON</a>
      |
      <a href="${datasetteSqlPageUrl(degreeDistributionSql)}">SQL page</a>
    </li>
  </ul>
</div>`
```

Only bibliographic authors on the latest version of each preprint are included.

Interpretation notes:
- `Connected Authors` counts only authors with at least one coauthor edge.
- `Distinct coauthors` is graph degree: the number of unique people an author has collaborated with.
- Rankings on this page are descriptive summaries of collaboration structure, not quality metrics.
