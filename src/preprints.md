---
title: Preprints
---

# PsyArXiv Preprints

```js
import {aggregateData, toCumulative, timeSeriesChart} from "./components/timeseries.js";
```

```js
const preprints = FileAttachment("data/preprints-by-date.csv").csv({typed: true});
```

```js
// Parse dates and calculate totals
const data = preprints.map(d => ({...d, date: new Date(d.date)}));
const total = d3.sum(data, d => d.count);
```

<!-- Card with total -->

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Total Preprints</h2>
    <span class="big">${total.toLocaleString("en-US")}</span>
  </div>
</div>

```js
const preprintsGranularity = view(Inputs.radio(
  ["daily", "weekly", "monthly", "yearly"],
  {label: "Preprints granularity", value: "weekly"}
));
```

```js
const preprintsCumulative = view(Inputs.radio(
  ["regular", "cumulative"],
  {label: "Count type", value: "regular"}
));
```

```js
const aggregatedPreprints = aggregateData(data, preprintsGranularity);
const displayPreprints = preprintsCumulative === "cumulative" ? toCumulative(aggregatedPreprints) : aggregatedPreprints;
```

<!-- Time series -->

<div class="grid grid-cols-1">
  <div class="card">
    <h2>${preprintsCumulative === "cumulative" ? "Cumulative" : "New"} ${preprintsGranularity} preprints</h2>
    ${resize((width) => timeSeriesChart(displayPreprints, {width, granularity: preprintsGranularity}))}
  </div>
</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com). Only latest version of preprints included.
