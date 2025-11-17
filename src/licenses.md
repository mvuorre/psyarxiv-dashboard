---
title: PsyArXiv Licenses
---

# PsyArXiv Licenses

```js
const licenses = FileAttachment("data/licenses.csv").csv({typed: true});
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Total Preprints</h2>
    <span class="big">${d3.sum(licenses, d => d.count).toLocaleString()}</span>
  </div>
</div>

```js
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
```

## License Distribution

```js
Plot.plot({
  marginLeft: 250,
  marginRight: 50,
  height: Math.max(300, licenses.length * 60),
  x: {label: "Number of preprints", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(licenses, {
      x: "count",
      y: "license",
      fill: "var(--theme-foreground-focus)",
      sort: {y: "-x"},
      tip: true
    }),
    Plot.text(licenses, {
      x: "count",
      y: "license",
      text: d => ((d.count / d3.sum(licenses, d => d.count)) * 100).toFixed(1) + "%",
      dx: 5,
      textAnchor: "start",
      fill: "var(--theme-foreground)"
    })
  ]
})
```

## License Details

```js
const enrichedLicenses = licenses.map(d => ({
  ...d,
  percentage: ((d.count / d3.sum(licenses, d => d.count)) * 100).toFixed(2)
}));
```

<div style="max-width: 800px;">

```js
Inputs.table(enrichedLicenses, {
  columns: ["license", "count", "percentage"],
  header: {
    license: "License",
    count: "Preprints",
    percentage: "Percentage"
  },
  format: {
    count: d => d.toLocaleString(),
    percentage: d => d + "%"
  },
  sort: "count",
  reverse: true,
  select: false
})
```

</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

- License information is recorded for the latest version of each preprint
- "Not specified" indicates preprints without license information in the database
