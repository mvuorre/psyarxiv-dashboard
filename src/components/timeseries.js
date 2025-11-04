import * as d3 from "npm:d3";

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

// Convert to cumulative counts
function toCumulative(data) {
  let sum = 0;
  return data.map(d => ({
    date: d.date,
    count: (sum += d.count)
  }));
}

// Helper to get ISO week number
function getWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

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

// Time series chart function
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
    .attr("fill", "currentColor")
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

  g.append("g")
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

  // Track current x scale (updated by zoom)
  let currentX = x;

  overlay.on("mousemove", function(event) {
    const [mx] = d3.pointer(event);
    const date = currentX.invert(mx);
    const bisect = d3.bisector(d => d.date).left;
    const index = bisect(data, date, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    const d = date - d0?.date > d1?.date - date ? d1 : d0;

    if (d) {
      tooltip.style("display", null)
        .attr("transform", `translate(${currentX(d.date)},${y(d.count)})`);
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
    currentX = event.transform.rescaleX(x);
    xAxis.call(d3.axisBottom(currentX));
    path.attr("d", line.x(d => currentX(d.date)));
  }

  return svg.node();
}

export {aggregateData, toCumulative, timeSeriesChart};
