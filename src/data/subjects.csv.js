import {csvFormat} from "d3-dsv";
import {subjectsUrl} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const response = await json(subjectsUrl);

const data = response.rows.map(row => ({
  id: row[0] || "",
  text: row[1] || "Unknown",
  parent_id: row[2] || "",
  level: row[3] || 1,
  count: row[4] || 0
}));

process.stdout.write(csvFormat(data));
