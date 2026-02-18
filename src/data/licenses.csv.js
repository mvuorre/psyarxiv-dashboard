import {csvFormat} from "d3-dsv";
import {licensesUrl} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const response = await json(licensesUrl);

const data = response.rows.map(row => ({
  license: row[0] || 'Not specified',
  count: row[1]
}));

process.stdout.write(csvFormat(data));
