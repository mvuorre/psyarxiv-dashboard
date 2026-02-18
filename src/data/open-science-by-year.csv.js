import {csvFormat} from "d3-dsv";
import {
  openScienceDataLinksByYearUrl,
  openSciencePreregLinksByYearUrl
} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const [dataLinksResponse, preregLinksResponse] = await Promise.all([
  json(openScienceDataLinksByYearUrl),
  json(openSciencePreregLinksByYearUrl)
]);

// Process both datasets
const dataLinksData = dataLinksResponse.rows.map(row => ({
  year: row[0],
  practice: 'Data Links',
  total: row[1],
  available: row[2],
  no: row[3],
  not_applicable: row[4],
  missing: row[5],
  pct_available: row[1] > 0 ? (row[2] / row[1]) * 100 : 0,
  pct_no: row[1] > 0 ? (row[3] / row[1]) * 100 : 0,
  pct_not_applicable: row[1] > 0 ? (row[4] / row[1]) * 100 : 0,
  pct_missing: row[1] > 0 ? (row[5] / row[1]) * 100 : 0
}));

const preregLinksData = preregLinksResponse.rows.map(row => ({
  year: row[0],
  practice: 'Preregistration',
  total: row[1],
  available: row[2],
  no: row[3],
  not_applicable: row[4],
  missing: row[5],
  pct_available: row[1] > 0 ? (row[2] / row[1]) * 100 : 0,
  pct_no: row[1] > 0 ? (row[3] / row[1]) * 100 : 0,
  pct_not_applicable: row[1] > 0 ? (row[4] / row[1]) * 100 : 0,
  pct_missing: row[1] > 0 ? (row[5] / row[1]) * 100 : 0
}));

const allData = [...dataLinksData, ...preregLinksData];

process.stdout.write(csvFormat(allData));
