---
theme: dashboard
title: Preprints
toc: false
---

# PsyArXiv Preprints

```js
const preprints = FileAttachment("data/preprints-by-date.csv").csv({typed: true});
const contributors = FileAttachment("data/contributors-by-date.csv").csv({typed: true});
```

```js
// Parse dates and calculate totals
const data = preprints.map(d => ({...d, date: new Date(d.date)}));
const total = d3.sum(data, d => d.count);

const contributorData = contributors.map(d => ({...d, date: new Date(d.date)}));
const totalContributors = d3.sum(contributorData, d => d.count);
```

<!-- Cards with totals -->

<div class="grid grid-cols-2">
  <div class="card">
    <h2>Total Preprints</h2>
    <span class="big">${total.toLocaleString("en-US")}</span>
  </div>
  <div class="card">
    <h2>Total Contributors</h2>
    <span class="big">${totalContributors.toLocaleString("en-US")}</span>
  </div>
</div>

<!-- Time series -->

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
function timeSeriesChart(data, {width}) {
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
      tooltipText.text(`${getWeek(d.date)}: ${d.count}`);
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
  <h2>New preprints per week</h2>
    ${resize((width) => timeSeriesChart(data, {width}))}
  </div>
</div>

<!-- Yearly totals -->

```js
function yearlyChart(data, {width}) {
  const yearlyData = Array.from(
    d3.rollup(data, v => d3.sum(v, d => d.count), d => d.date.getFullYear()),
    ([year, count]) => ({year, count})
  ).sort((a, b) => a.year - b.year);

  return Plot.plot({
    title: "Preprints by year",
    width,
    height: 400,
    x: {label: "Year"},
    y: {grid: true, label: "Total preprints"},
    marks: [
      Plot.barY(yearlyData, {x: "year", y: "count", fill: "var(--theme-foreground-focus)", tip: true}),
      Plot.ruleY([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => yearlyChart(data, {width}))}
  </div>
</div>

<!-- Contributors time series -->

<div class="grid grid-cols-1">
  <div class="card">
  <h2>New contributors per week</h2>
    ${resize((width) => timeSeriesChart(contributorData, {width}))}
  </div>
</div>

<!-- Contributors yearly totals -->

```js
function contributorYearlyChart(data, {width}) {
  const yearlyData = Array.from(
    d3.rollup(data, v => d3.sum(v, d => d.count), d => d.date.getFullYear()),
    ([year, count]) => ({year, count})
  ).sort((a, b) => a.year - b.year);

  return Plot.plot({
    title: "Contributors by year",
    width,
    height: 400,
    x: {label: "Year"},
    y: {grid: true, label: "Total contributors"},
    marks: [
      Plot.barY(yearlyData, {x: "year", y: "count", fill: "var(--theme-foreground-focus)", tip: true}),
      Plot.ruleY([0])
    ]
  });
}
```

<div class="grid grid-cols-1">
  <div class="card">
    ${resize((width) => contributorYearlyChart(contributorData, {width}))}
  </div>
</div>

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com). Only latest version of preprints included.
