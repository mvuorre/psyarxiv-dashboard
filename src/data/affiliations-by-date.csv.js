import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

// SQL query to get daily counts of new unique institutions
// This counts institutions by the date of their first contributor's registration
const sql = `
  WITH institution_first_dates AS (
    SELECT
      json_extract(value, '$.institution') as institution,
      MIN(DATE(c.date_registered)) as first_date
    FROM contributors c, json_each(c.employment)
    WHERE json_extract(value, '$.institution') IS NOT NULL
      AND json_extract(value, '$.institution') != ''
    GROUP BY json_extract(value, '$.institution')
  )
  SELECT
    first_date as date,
    COUNT(*) as count
  FROM institution_first_dates
  GROUP BY first_date
  ORDER BY first_date
`;

// Fetch data from Datasette
const url = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(sql)}`;
const response = await json(url);

// Transform the data
const data = response.rows.map(row => ({
  date: row[0],
  count: row[1]
}));

// Output as CSV
process.stdout.write(csvFormat(data));
