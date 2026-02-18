import {csvFormat} from "d3-dsv";
import {
  contributorsByAffiliationContributorUrl,
  contributorsByAffiliationPreprintUrl
} from "./queries.js";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

// Fetch both queries sequentially to avoid Datasette timeout issues
const contributorResponse = await json(contributorsByAffiliationContributorUrl);
const preprintResponse = await json(contributorsByAffiliationPreprintUrl);

// Create maps for easy lookup
const contributorMap = new Map(
  contributorResponse.rows.map(row => [row[0], row[1]])
);
const preprintMap = new Map(
  preprintResponse.rows.map(row => [row[0], row[1]])
);

// Merge results - use all institutions from either query
const allInstitutions = new Set([
  ...contributorMap.keys(),
  ...preprintMap.keys()
]);

const data = Array.from(allInstitutions).map(institution => ({
  institution,
  contributor_count: contributorMap.get(institution) || 0,
  preprint_count: preprintMap.get(institution) || 0
}));

// Sort by preprint count descending
data.sort((a, b) => b.preprint_count - a.preprint_count);

process.stdout.write(csvFormat(data));
