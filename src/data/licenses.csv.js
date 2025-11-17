import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const sql = `
  SELECT
    license,
    COUNT(*) as count
  FROM preprints
  WHERE is_latest_version = 1
  GROUP BY license
  ORDER BY count DESC
`;

const url = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(sql)}`;
const response = await json(url);

const data = response.rows.map(row => ({
  license: row[0] || 'Not specified',
  count: row[1]
}));

process.stdout.write(csvFormat(data));
