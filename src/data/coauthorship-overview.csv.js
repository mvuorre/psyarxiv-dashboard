import {csvFormat} from "d3-dsv";
import {coauthorshipOverviewUrl} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const response = await json(coauthorshipOverviewUrl);

const data = response.rows.map((row) => ({
  connected_authors: row[0],
  edge_count: row[1],
  avg_degree: row[2],
  max_degree: row[3]
}));

process.stdout.write(csvFormat(data));
