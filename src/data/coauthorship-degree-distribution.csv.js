import {csvFormat} from "d3-dsv";
import {degreeDistributionUrl} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const response = await json(degreeDistributionUrl);

const data = response.rows.map((row) => ({
  degree: row[0],
  author_count: row[1]
}));

process.stdout.write(csvFormat(data));
