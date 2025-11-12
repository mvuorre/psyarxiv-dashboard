import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

// Get counts by year for all response categories
const dataLinksSql = `
  SELECT
    strftime('%Y', date_published) as year,
    COUNT(*) as total,
    SUM(CASE WHEN has_data_links = 'available' THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN has_data_links = 'no' THEN 1 ELSE 0 END) as no,
    SUM(CASE WHEN has_data_links = 'not_applicable' THEN 1 ELSE 0 END) as not_applicable,
    SUM(CASE WHEN has_data_links IS NULL THEN 1 ELSE 0 END) as missing
  FROM preprints
  WHERE is_latest_version = 1
    AND date_published IS NOT NULL
    AND year IS NOT NULL
  GROUP BY year
  ORDER BY year
`;

const preregLinksSql = `
  SELECT
    strftime('%Y', date_published) as year,
    COUNT(*) as total,
    SUM(CASE WHEN has_prereg_links = 'available' THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN has_prereg_links = 'no' THEN 1 ELSE 0 END) as no,
    SUM(CASE WHEN has_prereg_links = 'not_applicable' THEN 1 ELSE 0 END) as not_applicable,
    SUM(CASE WHEN has_prereg_links IS NULL THEN 1 ELSE 0 END) as missing
  FROM preprints
  WHERE is_latest_version = 1
    AND date_published IS NOT NULL
    AND year IS NOT NULL
  GROUP BY year
  ORDER BY year
`;

const dataLinksUrl = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(dataLinksSql)}`;
const preregLinksUrl = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(preregLinksSql)}`;

const [dataLinksResponse, preregLinksResponse] = await Promise.all([
  json(dataLinksUrl),
  json(preregLinksUrl)
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
