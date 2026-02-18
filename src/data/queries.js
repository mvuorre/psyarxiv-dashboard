export const datasetteQueryUrl = (sql) =>
  `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(sql)}`;

export const datasetteSqlPageUrl = (sql) =>
  `https://psyarxivdb.vuorre.com/preprints?sql=${encodeURIComponent(sql)}`;

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
  WITH RECURSIVE hierarchy AS (
    -- Base case: root subjects (no parent)
    SELECT
      id,
      text,
      parent_id,
      1 as level
    FROM subjects
    WHERE parent_id IS NULL OR parent_id = ''

    UNION ALL

    -- Recursive case: children
    SELECT
      s.id,
      s.text,
      s.parent_id,
      h.level + 1
    FROM subjects s
    INNER JOIN hierarchy h ON s.parent_id = h.id
  )
  SELECT
    h.id,
    h.text,
    h.parent_id,
    h.level,
    COUNT(DISTINCT ps.preprint_id) as count
  FROM hierarchy h
  LEFT JOIN preprint_subjects ps ON h.id = ps.subject_id AND ps.is_latest_version = 1
  GROUP BY h.id, h.text, h.parent_id, h.level
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
    first_date as date,
    COUNT(*) as count
  FROM (
    SELECT
      pc.osf_user_id as contributor_id,
      MIN(DATE(p.date_created)) as first_date
    FROM preprints p
    JOIN preprint_contributors pc ON pc.preprint_id = p.id
    WHERE p.is_latest_version = 1
      AND pc.bibliographic = 1
      AND pc.is_latest_version = 1
    GROUP BY pc.osf_user_id
  )
  GROUP BY date
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
    DATE(p.date_created) as date,
    COUNT(DISTINCT pc.osf_user_id) as count
  FROM preprints p
  JOIN preprint_contributors pc ON pc.preprint_id = p.id
  WHERE p.is_latest_version = 1
    AND pc.bibliographic = 1
    AND pc.is_latest_version = 1
  GROUP BY date
  ORDER BY date
`;

export const contributorsOnPreprintsByDateUrl = datasetteQueryUrl(contributorsOnPreprintsByDateSql);

export const topContributorsSql = `
  SELECT
    full_name as contributor_name,
    n_preprints as preprint_count
  FROM contributors_with_counts
  WHERE full_name IS NOT NULL
    AND n_preprints > 0
  ORDER BY n_preprints DESC
  LIMIT 5000
`;

export const topContributorsUrl = datasetteQueryUrl(topContributorsSql);

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
    first_date as date,
    COUNT(*) as count
  FROM (
    SELECT
      i.id as institution_id,
      MIN(DATE(p.date_created)) as first_date
    FROM preprints p
    JOIN preprint_contributors pc ON pc.preprint_id = p.id
    JOIN contributor_affiliations ca ON pc.osf_user_id = ca.contributor_id
    JOIN institutions i ON ca.institution_id = i.id
    WHERE p.is_latest_version = 1
      AND pc.bibliographic = 1
      AND pc.is_latest_version = 1
      AND ca.end_date IS NULL
      AND i.name IS NOT NULL
    GROUP BY i.id
  )
  GROUP BY date
  ORDER BY date
`;

export const affiliationsFirstAppearanceByDateUrl = datasetteQueryUrl(affiliationsFirstAppearanceByDateSql);

export const affiliationsOnPreprintsByDateSql = `
  SELECT
    DATE(p.date_created) as date,
    COUNT(DISTINCT i.id) as count
  FROM preprints p
  JOIN preprint_contributors pc ON pc.preprint_id = p.id
  JOIN contributor_affiliations ca ON pc.osf_user_id = ca.contributor_id
  JOIN institutions i ON ca.institution_id = i.id
  WHERE p.is_latest_version = 1
    AND pc.bibliographic = 1
    AND pc.is_latest_version = 1
    AND ca.end_date IS NULL
    AND i.name IS NOT NULL
  GROUP BY date
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
