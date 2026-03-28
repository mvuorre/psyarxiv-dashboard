import {csvFormat} from "d3-dsv";
import {topCollaboratorsUrl} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

const response = await json(topCollaboratorsUrl);

const data = response.rows.map((row) => ({
  osf_user_id: row[0],
  full_name: row[1],
  collaborator_count: row[2],
  preprint_count: row[3]
}));

process.stdout.write(csvFormat(data));
