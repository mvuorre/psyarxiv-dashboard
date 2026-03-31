const productionDatasetteBaseUrl = "https://psyarxivdb.vuorre.com";

export const datasetteBaseUrl =
  globalThis.process?.env?.DATASETTE_BASE_URL ??
  globalThis.__DATASETTE_BASE_URL__ ??
  productionDatasetteBaseUrl;

const datasetteUrl = (pathname, sql) => {
  const url = new URL(pathname, datasetteBaseUrl);
  url.searchParams.set("sql", sql);
  return url.toString();
};

export const datasetteQueryUrl = (sql) => datasetteUrl("/preprints.json", sql);

export const datasetteSqlPageUrl = (sql) => datasetteUrl("/preprints", sql);

export const datasetteSqlPageFromJsonUrl = (jsonUrl) => {
  const url = new URL(jsonUrl);
  if (url.pathname.endsWith(".json")) {
    url.pathname = url.pathname.slice(0, -5);
  }
  return url.toString();
};

export const preprintsByDateSql = `
  SELECT
    DATE(date_created) as date,
    COUNT(*) as count
  FROM preprints
  WHERE is_latest_version = 1
  GROUP BY date
  ORDER BY date
`;

export const preprintsByDateUrl = datasetteQueryUrl(preprintsByDateSql);

export const licensesSql = `
  SELECT
    license,
    COUNT(*) as count
  FROM preprints
  WHERE is_latest_version = 1
  GROUP BY license
  ORDER BY count DESC
`;

export const licensesUrl = datasetteQueryUrl(licensesSql);

export const openScienceDataLinksByYearSql = `
  SELECT
    strftime('%Y', date_published) as year,
    COUNT(*) as total,
    SUM(CASE WHEN has_data_links = 'available' THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN has_data_links = 'no' THEN 1 ELSE 0 END) as no,
    SUM(CASE WHEN has_data_links = 'not_applicable' THEN 1 ELSE 0 END) as not_applicable,
    SUM(CASE WHEN has_data_links IS NULL THEN 1 ELSE 0 END) as missing
  FROM preprints
  WHERE is_latest_version = 1
    AND date_published IS NOT NULL
    AND year IS NOT NULL
  GROUP BY year
  ORDER BY year
`;

export const openScienceDataLinksByYearUrl = datasetteQueryUrl(openScienceDataLinksByYearSql);

export const openSciencePreregLinksByYearSql = `
  SELECT
    strftime('%Y', date_published) as year,
    COUNT(*) as total,
    SUM(CASE WHEN has_prereg_links = 'available' THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN has_prereg_links = 'no' THEN 1 ELSE 0 END) as no,
    SUM(CASE WHEN has_prereg_links = 'not_applicable' THEN 1 ELSE 0 END) as not_applicable,
    SUM(CASE WHEN has_prereg_links IS NULL THEN 1 ELSE 0 END) as missing
  FROM preprints
  WHERE is_latest_version = 1
    AND date_published IS NOT NULL
    AND year IS NOT NULL
  GROUP BY year
  ORDER BY year
`;

export const openSciencePreregLinksByYearUrl = datasetteQueryUrl(openSciencePreregLinksByYearSql);

export const subjectsSql = `
  SELECT
    id,
    text,
    parent_id,
    level,
    count
  FROM dashboard_subject_counts
  ORDER BY count DESC
`;

export const subjectsUrl = datasetteQueryUrl(subjectsSql);

export const topTagsSql = `
  SELECT
    tag_text,
    use_count
  FROM tags
  WHERE use_count >= 10
  ORDER BY use_count DESC
`;

export const topTagsUrl = datasetteQueryUrl(topTagsSql);

export const contributorsFirstAppearanceByDateSql = `
  SELECT
    date,
    count
  FROM dashboard_contributor_first_appearance_by_date
  ORDER BY date
`;

export const contributorsFirstAppearanceByDateUrl = datasetteQueryUrl(contributorsFirstAppearanceByDateSql);

export const contributorsByDateSql = `
  SELECT
    DATE(date_registered) as date,
    COUNT(*) as count
  FROM contributors
  GROUP BY date
  ORDER BY date
`;

export const contributorsByDateUrl = datasetteQueryUrl(contributorsByDateSql);

export const contributorsOnPreprintsByDateSql = `
  SELECT
    date,
    count
  FROM dashboard_contributors_on_preprints_by_date
  ORDER BY date
`;

export const contributorsOnPreprintsByDateUrl = datasetteQueryUrl(contributorsOnPreprintsByDateSql);

export const topContributorsSql = `
  SELECT
    contributor_name,
    preprint_count
  FROM dashboard_top_contributors
  ORDER BY preprint_count DESC
  LIMIT 5000
`;

export const topContributorsUrl = datasetteQueryUrl(topContributorsSql);

const coauthorDegreeCountsCte = `
  degree_counts AS (
    SELECT
      osf_user_id,
      COUNT(*) AS degree
    FROM (
      SELECT source_osf_user_id AS osf_user_id
      FROM coauthor_edges

      UNION ALL

      SELECT target_osf_user_id AS osf_user_id
      FROM coauthor_edges
    )
    GROUP BY osf_user_id
  )
`;

const coauthorPreprintCountsCte = `
  preprint_counts AS (
    SELECT
      osf_user_id,
      COUNT(DISTINCT preprint_id) AS preprint_count
    FROM preprint_contributors
    WHERE bibliographic = 1
      AND is_latest_version = 1
    GROUP BY osf_user_id
  )
`;

export const coauthorshipOverviewSql = `
  WITH
  ${coauthorDegreeCountsCte}
  SELECT
    COUNT(*) AS connected_authors,
    (SELECT COUNT(*) FROM coauthor_edges) AS edge_count,
    ROUND(AVG(degree), 2) AS avg_degree,
    MAX(degree) AS max_degree
  FROM degree_counts
`;

export const coauthorshipOverviewUrl = datasetteQueryUrl(coauthorshipOverviewSql);

export const topCollaboratorsSql = `
  WITH
  ${coauthorDegreeCountsCte},
  ${coauthorPreprintCountsCte}
  SELECT
    c.osf_user_id,
    c.full_name,
    degree_counts.degree AS collaborator_count,
    COALESCE(preprint_counts.preprint_count, 0) AS preprint_count
  FROM degree_counts
  JOIN contributors AS c ON c.osf_user_id = degree_counts.osf_user_id
  LEFT JOIN preprint_counts ON preprint_counts.osf_user_id = degree_counts.osf_user_id
  WHERE c.full_name IS NOT NULL
  ORDER BY collaborator_count DESC, preprint_count DESC, c.full_name
  LIMIT 5000
`;

export const topCollaboratorsUrl = datasetteQueryUrl(topCollaboratorsSql);

export const degreeDistributionSql = `
  WITH
  ${coauthorDegreeCountsCte}
  SELECT
    degree,
    COUNT(*) AS author_count
  FROM degree_counts
  GROUP BY degree
  ORDER BY degree
`;

export const degreeDistributionUrl = datasetteQueryUrl(degreeDistributionSql);

export const contributorsByAffiliationContributorSql = `
  SELECT
    i.name as institution,
    COUNT(DISTINCT ca.contributor_id) as contributor_count
  FROM contributor_affiliations ca
  JOIN institutions i ON ca.institution_id = i.id
  WHERE i.name IS NOT NULL
  GROUP BY i.name
`;

export const contributorsByAffiliationContributorUrl = datasetteQueryUrl(contributorsByAffiliationContributorSql);

export const contributorsByAffiliationPreprintSql = `
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

export const contributorsByAffiliationPreprintUrl = datasetteQueryUrl(contributorsByAffiliationPreprintSql);

export const affiliationsFirstAppearanceByDateSql = `
  SELECT
    date,
    count
  FROM dashboard_affiliation_first_appearance_by_date
  ORDER BY date
`;

export const affiliationsFirstAppearanceByDateUrl = datasetteQueryUrl(affiliationsFirstAppearanceByDateSql);

export const affiliationsOnPreprintsByDateSql = `
  SELECT
    date,
    count
  FROM dashboard_affiliations_on_preprints_by_date
  ORDER BY date
`;

export const affiliationsOnPreprintsByDateUrl = datasetteQueryUrl(affiliationsOnPreprintsByDateSql);

export const affiliationsByDateSql = `
  SELECT
    DATE(ca.start_date) as date,
    COUNT(*) as count
  FROM contributor_affiliations ca
  WHERE ca.start_date IS NOT NULL
  GROUP BY DATE(ca.start_date)
  ORDER BY date
`;

export const affiliationsByDateUrl = datasetteQueryUrl(affiliationsByDateSql);
