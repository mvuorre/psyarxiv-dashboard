import {csvFormat} from "d3-dsv";
import {topContributorsUrl} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) {
    let body = "";
    try {
      body = await response.text();
    } catch {
      body = "";
    }
    throw new Error(`fetch failed: ${response.status}${body ? `\n${body}` : ""}`);
  }
  return response.json();
}

const response = await json(topContributorsUrl);

const data = response.rows.map(row => ({
  contributor_name: row[0],
  preprint_count: row[1]
}));

process.stdout.write(csvFormat(data));
