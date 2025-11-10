import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

// SQL query to get daily counts of new affiliation starts
const sql = `
  SELECT
    DATE(ca.start_date) as date,
    COUNT(*) as count
  FROM contributor_affiliations ca
  WHERE ca.start_date IS NOT NULL
  GROUP BY DATE(ca.start_date)
  ORDER BY date
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
