---
title: Open Science Practices
---

# Open Science Practices

```js
const openScienceData = FileAttachment("data/open-science-by-year.csv").csv({typed: true});
```

```js
import * as Plot from "npm:@observablehq/plot";
```

```js
// Separate data by practice
const dataLinksData = openScienceData.filter(d => d.practice === "Data Links");
const preregLinksData = openScienceData.filter(d => d.practice === "Preregistration");

// Calculate overall statistics
const totalPreprints = d3.sum(dataLinksData, d => d.total);
const totalWithData = d3.sum(dataLinksData, d => d.available);
const totalWithPrereg = d3.sum(preregLinksData, d => d.available);

const overallPctData = (totalWithData / totalPreprints) * 100;
const overallPctPrereg = (totalWithPrereg / totalPreprints) * 100;
```

<div class="grid grid-cols-2">
  <div class="card">
    <h2>Data Links Available</h2>
    <span class="big">${overallPctData.toFixed(1)}%</span>
    <span class="muted">${totalWithData.toLocaleString()} / ${totalPreprints.toLocaleString()}</span>
  </div>
  <div class="card">
    <h2>Preregistration Available</h2>
    <span class="big">${overallPctPrereg.toFixed(1)}%</span>
    <span class="muted">${totalWithPrereg.toLocaleString()} / ${totalPreprints.toLocaleString()}</span>
  </div>
</div>

## Data Links Over Time

```js
import * as d3 from "npm:d3";
```

```js
// Reshape data for stacked area chart - use raw counts
const dataLinksStacked = dataLinksData.flatMap(d => [
  {year: +d.year, category: "Available", count: +d.available},
  {year: +d.year, category: "No", count: +d.no},
  {year: +d.year, category: "Not Applicable", count: +d.not_applicable},
  {year: +d.year, category: "Missing", count: +d.missing}
]);
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Data Links Response Distribution</h2>
    ${resize((width) => Plot.plot({
      width,
      height: 400,
      marginLeft: 50,
      y: {label: "Percentage (%)", grid: true, percent: true},
      x: {
        label: "Year",
        ticks: [...new Set(dataLinksData.map(d => +d.year))].sort((a, b) => a - b),
        tickFormat: d3.format("d")
      },
      color: {
        legend: true,
        domain: ["Available", "No", "Not Applicable", "Missing"],
        range: ["#51cf66", "#ff6b6b", "#fcc419", "#adb5bd"]
      },
      marks: [
        Plot.areaY(dataLinksStacked, {
          x: "year",
          y: "count",
          fill: "category",
          offset: "expand",
          tip: true
        }),
        Plot.ruleY([0])
      ]
    }))}
  </div>
</div>

## Preregistration Over Time

```js
// Reshape data for stacked area chart - use raw counts
const preregLinksStacked = preregLinksData.flatMap(d => [
  {year: +d.year, category: "Available", count: +d.available},
  {year: +d.year, category: "No", count: +d.no},
  {year: +d.year, category: "Not Applicable", count: +d.not_applicable},
  {year: +d.year, category: "Missing", count: +d.missing}
]);
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Preregistration Response Distribution</h2>
    ${resize((width) => Plot.plot({
      width,
      height: 400,
      marginLeft: 50,
      y: {label: "Percentage (%)", grid: true, percent: true},
      x: {
        label: "Year",
        ticks: [...new Set(preregLinksData.map(d => +d.year))].sort((a, b) => a - b),
        tickFormat: d3.format("d")
      },
      color: {
        legend: true,
        domain: ["Available", "No", "Not Applicable", "Missing"],
        range: ["#51cf66", "#ff6b6b", "#fcc419", "#adb5bd"]
      },
      marks: [
        Plot.areaY(preregLinksStacked, {
          x: "year",
          y: "count",
          fill: "category",
          offset: "expand",
          tip: true
        }),
        Plot.ruleY([0])
      ]
    }))}
  </div>
</div>

## Yearly Breakdown

```js
const search = view(Inputs.search(openScienceData, {placeholder: "Search by year or practice..."}));
```

<div style="max-width: 1200px;">

```js
Inputs.table(search, {
  columns: ["year", "practice", "total", "available", "pct_available", "no", "pct_no", "not_applicable", "pct_not_applicable", "missing", "pct_missing"],
  header: {
    year: "Year",
    practice: "Practice",
    total: "Total",
    available: "Available",
    pct_available: "% Avail",
    no: "No",
    pct_no: "% No",
    not_applicable: "N/A",
    pct_not_applicable: "% N/A",
    missing: "Missing",
    pct_missing: "% Missing"
  },
  format: {
    year: d => d,
    pct_available: d => d.toFixed(1) + "%",
    pct_no: d => d.toFixed(1) + "%",
    pct_not_applicable: d => d.toFixed(1) + "%",
    pct_missing: d => d.toFixed(1) + "%"
  },
  sort: "year",
  reverse: true,
  select: false
})
```

</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

Only latest versions of preprints are counted. Response categories:

- Available: Authors indicated data links or preregistration are available
- No: Authors explicitly indicated they are not available
- Not Applicable: Authors indicated data/prereg is not applicable to this work
- Missing: No response provided

These are self-reported by authors at the time of submission.
