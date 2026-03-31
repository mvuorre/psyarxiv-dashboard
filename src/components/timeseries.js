import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

const intervalByGranularity = {
  daily: d3.utcDay,
  weekly: d3.utcWeek,
  monthly: d3.utcMonth,
  yearly: d3.utcYear
};

const formatByGranularity = {
  daily: d3.utcFormat("%Y-%m-%d"),
  weekly: d3.utcFormat("%G-W%V"),
  monthly: d3.utcFormat("%Y-%m"),
  yearly: d3.utcFormat("%Y")
};

const sortByDate = (left, right) => d3.ascending(left.date, right.date);

function formatDate(date, granularity) {
  return (formatByGranularity[granularity] ?? formatByGranularity.daily)(date);
}

function availableYears(...datasets) {
  const years = new Set();

  for (const dataset of datasets) {
    for (const entry of dataset) {
      years.add(String(entry.date.getUTCFullYear()));
    }
  }

  return Array.from(years).sort((left, right) => Number(right) - Number(left));
}

function filterByYear(data, year) {
  if (year === "All") {
    return data;
  }

  return data.filter((entry) => String(entry.date.getUTCFullYear()) === year);
}

function aggregateData(data, granularity) {
  const sorted = [...data].sort(sortByDate);

  if (granularity === "daily") {
    return sorted;
  }

  const interval = intervalByGranularity[granularity];
  const grouped = d3.rollup(
    sorted,
    (values) => d3.sum(values, (value) => value.count),
    (value) => +interval.floor(value.date)
  );

  return Array.from(grouped, ([time, count]) => ({
    date: new Date(time),
    count
  })).sort(sortByDate);
}

function toCumulative(data) {
  let total = 0;

  return data.map(({date, count}) => ({
    date,
    count: (total += count)
  }));
}

function timeSeriesChart(data, {width, granularity}) {
  if (data.length === 0) {
    return Plot.plot({
      width,
      height: 400,
      inset: 0,
      marks: [Plot.text(["No data"], {frameAnchor: "middle"})]
    });
  }

  const yMax = d3.max(data, (value) => value.count) ?? 0;
  const yTicks = Math.min(Math.max(yMax, 1), 6);

  return Plot.plot({
    width,
    height: 400,
    marginTop: 10,
    marginRight: 20,
    marginBottom: 40,
    marginLeft: 60,
    x: {
      type: "utc",
      label: null,
      tickFormat: (value) => formatDate(value, granularity)
    },
    y: {
      label: null,
      grid: true,
      domain: [0, Math.max(yMax, 1)],
      ticks: yTicks,
      tickFormat: d3.format(",d")
    },
    marks: [
      Plot.ruleY([0]),
      Plot.lineY(data, {
        x: "date",
        y: "count",
        stroke: "var(--theme-foreground-focus)",
        strokeWidth: 1.5,
        tip: "x",
        title: (value) => `${formatDate(value.date, granularity)}: ${value.count.toLocaleString()}`
      })
    ]
  });
}

export {aggregateData, availableYears, filterByYear, toCumulative, timeSeriesChart};
