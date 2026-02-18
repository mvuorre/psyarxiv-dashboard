import {csvFormat} from "d3-dsv";
import {topTagsUrl} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const response = await json(topTagsUrl);

const data = response.rows.map(row => ({
  tag_text: row[0],
  use_count: row[1]
}));

process.stdout.write(csvFormat(data));
