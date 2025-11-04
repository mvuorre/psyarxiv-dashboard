import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const sql = `
  SELECT
    full_name as contributor_name,
    n_preprints as preprint_count
  FROM contributors
  WHERE full_name IS NOT NULL
    AND n_preprints > 0
  ORDER BY n_preprints DESC
`;

const url = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(sql)}`;
const response = await json(url);

const data = response.rows.map(row => ({
  contributor_name: row[0],
  preprint_count: row[1]
}));

process.stdout.write(csvFormat(data));
