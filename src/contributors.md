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

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).
