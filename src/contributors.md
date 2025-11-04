---
theme: dashboard
title: Contributors
toc: false
---

# PsyArXiv Contributors

```js
import {aggregateData, toCumulative, timeSeriesChart} from "./components/timeseries.js";
```

```js
const contributors = FileAttachment("data/contributors-by-date.csv").csv({typed: true});
```

```js
const topContributors = FileAttachment("data/top-contributors.csv").csv({typed: true});
```

```js
// Parse dates and calculate totals
const contributorData = contributors.map(d => ({...d, date: new Date(d.date)}));
const totalContributors = d3.sum(contributorData, d => d.count);
```

<!-- Card with total -->

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Total Contributors</h2>
    <span class="big">${totalContributors.toLocaleString("en-US")}</span>
  </div>
</div>

```js
const contributorsGranularity = view(Inputs.radio(
  ["daily", "weekly", "monthly", "yearly"],
  {label: "Contributors granularity", value: "weekly"}
));
```

```js
const contributorsCumulative = view(Inputs.radio(
  ["regular", "cumulative"],
  {label: "Count type", value: "regular"}
));
```

```js
const aggregatedContributors = aggregateData(contributorData, contributorsGranularity);
const displayContributors = contributorsCumulative === "cumulative" ? toCumulative(aggregatedContributors) : aggregatedContributors;
```

<!-- Time series -->

<div class="grid grid-cols-1">
  <div class="card">
    <h2>${contributorsCumulative === "cumulative" ? "Cumulative" : "New"} ${contributorsGranularity} contributors</h2>
    ${resize((width) => timeSeriesChart(displayContributors, {width, granularity: contributorsGranularity}))}
  </div>
</div>

```js
const topN = view(Inputs.range([10, 200], {value: 20, step: 10, label: "Show top N contributors"}));
```

## Top Contributors by Preprints

```js
import * as Plot from "npm:@observablehq/plot";
```

```js
const topNContributors = topContributors.slice(0, topN);
```

```js
Plot.plot({
  marginLeft: 200,
  height: Math.max(400, topN * 20),
  x: {label: "Number of preprints"},
  y: {label: null},
  marks: [
    Plot.barX(topNContributors, {
      x: "preprint_count",
      y: "contributor_name",
      fill: "preprint_count",
      sort: {y: "-x"},
      tip: true
    })
  ]
})
```

## All Contributors

```js
const search = view(Inputs.search(topContributors, {placeholder: "Search contributors..."}));
```

```js
Inputs.table(search, {
  columns: ["contributor_name", "preprint_count"],
  header: {
    contributor_name: "Contributor",
    preprint_count: "Preprints"
  },
  sort: "preprint_count",
  reverse: true,
  select: false
})
```

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

**Preprint counts**: Only bibliographic authors on the latest version of each preprint are counted.

**Important limitations**: Rankings of individual contributors should be interpreted with caution. Publication counts are influenced by many factors including field norms, career stage, collaboration patterns, and data quality. As with any metric, there is a risk that making these numbers visible could create perverse incentives (Goodhart's law). This data is provided for transparency and aggregate analysis, not for individual comparison or evaluation.
