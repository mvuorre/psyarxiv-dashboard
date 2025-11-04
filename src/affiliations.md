---
title: Contributor Affiliations
---

# PsyArXiv Contributor Affiliations

```js
const affiliations = FileAttachment("data/contributors-by-affiliation.csv").csv({typed: true});
```

```js
const affiliationsByDate = FileAttachment("data/affiliations-by-date.csv").csv({typed: true});
```

```js
// Parse dates and calculate totals
const affiliationsData = affiliationsByDate.map(d => ({...d, date: new Date(d.date)}));
```

```js
// Aggregation function
function aggregateData(data, granularity) {
  if (granularity === "daily") return data;

  let keyFn;
  if (granularity === "weekly") {
    keyFn = d => {
      const date = new Date(d.date);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      return date.getTime();
    };
  } else if (granularity === "monthly") {
    keyFn = d => new Date(d.date.getFullYear(), d.date.getMonth(), 1).getTime();
  } else if (granularity === "yearly") {
    keyFn = d => new Date(d.date.getFullYear(), 0, 1).getTime();
  }

  const grouped = d3.rollup(data, v => d3.sum(v, d => d.count), keyFn);
  return Array.from(grouped, ([time, count]) => ({
    date: new Date(time),
    count
  })).sort((a, b) => a.date - b.date);
}
```

```js
// Date formatting helper
function formatDate(date, granularity) {
  if (granularity === "daily") {
    return date.toISOString().split('T')[0];
  } else if (granularity === "weekly") {
    return getWeek(date);
  } else if (granularity === "monthly") {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  } else if (granularity === "yearly") {
    return String(date.getFullYear());
  }
}
```

```js
// Helper to get ISO week number
function getWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
```

```js
function timeSeriesChart(data, {width, granularity}) {
  const height = 400;
  const margin = {top: 40, right: 20, bottom: 30, left: 60};
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Clip path to prevent overflow
  svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", innerWidth)
    .attr("height", innerHeight);

  // Scales
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .nice()
    .range([innerHeight, 0]);

  // Axes
  const xAxis = g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x));

  const yAxis = g.append("g")
    .call(d3.axisLeft(y).ticks(6));

  // Grid lines
  g.append("g")
    .attr("class", "grid")
    .attr("opacity", 0.1)
    .call(d3.axisLeft(y)
      .tickSize(-innerWidth)
      .tickFormat(""));

  // Line generator
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.count));

  // Line path with clipping
  const path = g.append("path")
    .datum(data)
    .attr("clip-path", "url(#clip)")
    .attr("fill", "none")
    .attr("stroke", "var(--theme-foreground-focus)")
    .attr("stroke-width", 1)
    .attr("d", line);

  // Tooltip
  const tooltip = g.append("g")
    .style("display", "none");

  tooltip.append("circle")
    .attr("r", 4)
    .attr("fill", "var(--theme-foreground-focus)");

  const tooltipText = tooltip.append("text")
    .attr("text-anchor", "middle")
    .attr("y", -15)
    .style("font-size", "12px")
    .style("fill", "var(--theme-foreground)")
    .style("font-weight", "bold");

  // Overlay for mouse events
  const overlay = g.append("rect")
    .attr("width", innerWidth)
    .attr("height", innerHeight)
    .attr("fill", "none")
    .attr("pointer-events", "all");

  overlay.on("mousemove", function(event) {
    const [mx] = d3.pointer(event);
    const date = x.invert(mx);
    const bisect = d3.bisector(d => d.date).left;
    const index = bisect(data, date, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    const d = date - d0?.date > d1?.date - date ? d1 : d0;

    if (d) {
      tooltip.style("display", null)
        .attr("transform", `translate(${x(d.date)},${y(d.count)})`);
      tooltipText.text(`${formatDate(d.date, granularity)}: ${d.count}`);
    }
  });

  overlay.on("mouseout", () => tooltip.style("display", "none"));

  // Zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([1, 50])
    .extent([[0, 0], [innerWidth, innerHeight]])
    .translateExtent([[0, 0], [innerWidth, innerHeight]])
    .on("zoom", zoomed);

  svg.call(zoom);

  function zoomed(event) {
    const newX = event.transform.rescaleX(x);
    xAxis.call(d3.axisBottom(newX));
    path.attr("d", line.x(d => newX(d.date)));
  }

  return svg.node();
}
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
  {label: "Affiliations granularity", value: "weekly"}
));
```

```js
const aggregatedAffiliations = aggregateData(affiliationsData, affiliationsGranularity);
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>New ${affiliationsGranularity} affiliations</h2>
    ${resize((width) => timeSeriesChart(aggregatedAffiliations, {width, granularity: affiliationsGranularity}))}
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
