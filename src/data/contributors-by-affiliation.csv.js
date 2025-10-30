import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const sql = `
  SELECT
    json_extract(value, '$.institution') as institution,
    COUNT(*) as count
  FROM contributors, json_each(contributors.employment)
  WHERE json_extract(value, '$.institution') IS NOT NULL
  GROUP BY institution
  ORDER BY count DESC
`;

const url = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(sql)}`;
const response = await json(url);
const data = response.rows.map(row => ({
  institution: row[0],
  count: row[1]
}));

process.stdout.write(csvFormat(data));
