const escapeSqlText = (value) => String(value).replace(/'/g, "''");

const quoteSqlText = (value) => `'${escapeSqlText(value)}'`;

const toInteger = (value, name) => {
  const integer = Number(value);

  if (!Number.isInteger(integer)) {
    throw new TypeError(`${name} must be an integer`);
  }

  return integer;
};

const toIntegerList = (values, name) => {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError(`${name} must be a non-empty array`);
  }

  return values.map((value) => toInteger(value, name)).join(",");
};

const toQuotedTextList = (values, name) => {
  if (!Array.isArray(values) || values.length === 0) {
    throw new TypeError(`${name} must be a non-empty array`);
  }

  return values.map((value) => quoteSqlText(value)).join(",");
};

export const defaultCoauthorshipUserId = "tdyix";
export const defaultTagName = "social cognition";
export const defaultTagNetworkSize = 30;
export const maxTagNetworkSize = 100;
export const minVisibleTagUseCount = 10;
export const minCoTagConnectionCount = 3;

export const buildTagIdLookupSql = (tagText) => `
  SELECT id
  FROM tags
  WHERE tag_text = ${quoteSqlText(tagText)}
`;

export const buildTagCooccurrenceSql = (
  tagId,
  limit = defaultTagNetworkSize
) => `
  SELECT
    t.id,
    t.tag_text,
    COUNT(DISTINCT pt1.preprint_id) as cooccurrence_count
  FROM preprint_tags pt1
  JOIN preprint_tags pt2 ON pt1.preprint_id = pt2.preprint_id AND pt1.tag_id != pt2.tag_id
  JOIN tags t ON pt2.tag_id = t.id
  WHERE pt1.tag_id = ${toInteger(tagId, "tagId")}
    AND pt1.is_latest_version = 1
    AND pt2.is_latest_version = 1
    AND t.use_count >= ${minVisibleTagUseCount}
  GROUP BY t.id, t.tag_text
  ORDER BY cooccurrence_count DESC
  LIMIT ${toInteger(limit, "limit")}
`;

export const buildCoTagConnectionsSql = (tagIds) => {
  const idList = toIntegerList(tagIds, "tagIds");

  return `
    SELECT
      pt1.tag_id,
      t1.tag_text,
      pt2.tag_id,
      t2.tag_text,
      COUNT(DISTINCT pt1.preprint_id) as cooccurrence_count
    FROM preprint_tags pt1
    JOIN preprint_tags pt2 ON pt1.preprint_id = pt2.preprint_id AND pt1.tag_id < pt2.tag_id
    JOIN tags t1 ON pt1.tag_id = t1.id
    JOIN tags t2 ON pt2.tag_id = t2.id
    WHERE pt1.tag_id IN (${idList})
      AND pt2.tag_id IN (${idList})
      AND pt1.is_latest_version = 1
      AND pt2.is_latest_version = 1
    GROUP BY pt1.tag_id, t1.tag_text, pt2.tag_id, t2.tag_text
    HAVING cooccurrence_count >= ${minCoTagConnectionCount}
  `;
};

export const buildContributorNameLookupSql = (osfUserId) => `
  SELECT full_name
  FROM contributors
  WHERE osf_user_id = ${quoteSqlText(osfUserId)}
`;

export const buildDirectCoauthorsSql = (osfUserId) => `
  SELECT
    c.osf_user_id,
    c.full_name,
    COUNT(DISTINCT pc1.preprint_id) as count
  FROM preprint_contributors pc1
  JOIN preprint_contributors pc2 ON pc1.preprint_id = pc2.preprint_id AND pc1.osf_user_id != pc2.osf_user_id
  JOIN contributors c ON pc2.osf_user_id = c.osf_user_id
  WHERE pc1.osf_user_id = ${quoteSqlText(osfUserId)}
    AND pc1.bibliographic = 1
    AND pc2.bibliographic = 1
    AND pc1.is_latest_version = 1
    AND pc2.is_latest_version = 1
    AND c.full_name IS NOT NULL
  GROUP BY c.osf_user_id, c.full_name
`;

export const buildCoauthorConnectionsSql = (osfUserIds) => {
  const idList = toQuotedTextList(osfUserIds, "osfUserIds");

  return `
    SELECT
      c1.osf_user_id,
      c1.full_name,
      c2.osf_user_id,
      c2.full_name,
      COUNT(DISTINCT pc1.preprint_id) as count
    FROM preprint_contributors pc1
    JOIN preprint_contributors pc2 ON pc1.preprint_id = pc2.preprint_id AND pc1.osf_user_id < pc2.osf_user_id
    JOIN contributors c1 ON pc1.osf_user_id = c1.osf_user_id
    JOIN contributors c2 ON pc2.osf_user_id = c2.osf_user_id
    WHERE pc1.osf_user_id IN (${idList})
      AND pc2.osf_user_id IN (${idList})
      AND pc1.bibliographic = 1
      AND pc2.bibliographic = 1
      AND pc1.is_latest_version = 1
      AND pc2.is_latest_version = 1
      AND c1.full_name IS NOT NULL
      AND c2.full_name IS NOT NULL
    GROUP BY c1.osf_user_id, c1.full_name, c2.osf_user_id, c2.full_name
  `;
};
