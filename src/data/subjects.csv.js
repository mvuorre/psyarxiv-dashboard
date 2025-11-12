import {csvFormat} from "d3-dsv";

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch failed: ${response.status}`);
  return response.json();
}

// Recursive CTE to calculate hierarchy levels
const sql = `
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

const url = `https://psyarxivdb.vuorre.com/preprints.json?sql=${encodeURIComponent(sql)}`;
const response = await json(url);

const data = response.rows.map(row => ({
  id: row[0] || "",
  text: row[1] || "Unknown",
  parent_id: row[2] || "",
  level: row[3] || 1,
  count: row[4] || 0
}));

process.stdout.write(csvFormat(data));
