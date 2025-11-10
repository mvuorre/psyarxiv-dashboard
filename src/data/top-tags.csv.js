import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const sql = `
  SELECT
    tag_text,
    use_count
  FROM tags
  WHERE use_count >= 10
  ORDER BY use_count DESC
`;

const url = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(sql)}`;
const response = await json(url);

const data = response.rows.map(row => ({
  tag_text: row[0],
  use_count: row[1]
}));

process.stdout.write(csvFormat(data));
