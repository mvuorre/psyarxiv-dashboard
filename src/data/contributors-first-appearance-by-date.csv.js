import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

// SQL query to get daily counts of contributors by first appearance on preprints
const sql = `
  SELECT
    first_date as date,
    COUNT(*) as count
  FROM (
    SELECT
      pc.osf_user_id as contributor_id,
      MIN(DATE(p.date_created)) as first_date
    FROM preprints p
    JOIN preprint_contributors pc ON pc.preprint_id = p.id
    WHERE p.is_latest_version = 1
      AND pc.bibliographic = 1
      AND pc.is_latest_version = 1
    GROUP BY pc.osf_user_id
  )
  GROUP BY date
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
