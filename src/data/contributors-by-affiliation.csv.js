import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

// Query 1: Count unique contributors per institution (all affiliations ever)
const contributorSql = `
  SELECT
    i.name as institution,
    COUNT(DISTINCT ca.contributor_id) as contributor_count
  FROM contributor_affiliations ca
  JOIN institutions i ON ca.institution_id = i.id
  WHERE i.name IS NOT NULL
  GROUP BY i.name
`;

// Query 2: Count preprints per institution (current affiliations only, latest versions only)
const preprintSql = `
  SELECT
    i.name as institution,
    COUNT(DISTINCT pc.preprint_id) as preprint_count
  FROM preprint_contributors pc
  JOIN contributor_affiliations ca ON pc.osf_user_id = ca.contributor_id
  JOIN institutions i ON ca.institution_id = i.id
  WHERE pc.bibliographic = 1
    AND pc.is_latest_version = 1
    AND ca.end_date IS NULL
    AND i.name IS NOT NULL
  GROUP BY i.name
`;

// Fetch both queries sequentially to avoid Datasette timeout issues
const contributorUrl = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(contributorSql)}`;
const preprintUrl = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(preprintSql)}`;

const contributorResponse = await json(contributorUrl);
const preprintResponse = await json(preprintUrl);

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
