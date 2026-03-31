import {datasetteQueryUrl} from "./queries.js";
import {
  buildCoTagConnectionsSql,
  buildCoauthorConnectionsSql,
  buildContributorNameLookupSql,
  buildDirectCoauthorsSql,
  buildTagCooccurrenceSql,
  buildTagIdLookupSql
} from "./network-queries.js";

async function fetchRows(sql) {
  const response = await fetch(datasetteQueryUrl(sql), {
    headers: {accept: "application/json"}
  });

  if (!response.ok) {
    throw new Error(`fetch failed: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.rows)) {
    throw new Error("response JSON is missing rows[]");
  }

  return data.rows;
}

function buildNetworkData({centerId, centerName, directRows, connectionRows = []}) {
  const nodes = [
    {id: centerId, name: centerName, isCenter: true},
    ...directRows.map(([id, name]) => ({id, name, isCenter: false}))
  ];

  const links = [
    ...directRows.map(([id, , count]) => ({
      source: centerId,
      target: id,
      value: count
    })),
    ...connectionRows.map(([source, , target, , count]) => ({
      source,
      target,
      value: count
    }))
  ];

  return {nodes, links};
}

export async function loadCoauthorshipNetwork(userId) {
  const directRows = await fetchRows(buildDirectCoauthorsSql(userId));

  if (directRows.length === 0) {
    return {nodes: [], links: []};
  }

  const userNameRows = await fetchRows(buildContributorNameLookupSql(userId));
  const centerName = userNameRows[0]?.[0] ?? userId;
  const coauthorIds = directRows.map(([id]) => id);
  const connectionRows =
    coauthorIds.length > 1
      ? await fetchRows(buildCoauthorConnectionsSql(coauthorIds))
      : [];

  return buildNetworkData({
    centerId: userId,
    centerName,
    directRows,
    connectionRows
  });
}

export async function loadTagNetwork(tagName, networkSize) {
  const tagIdRows = await fetchRows(buildTagIdLookupSql(tagName));
  const tagId = tagIdRows[0]?.[0];

  if (tagId == null) {
    return {nodes: [], links: []};
  }

  const directRows = await fetchRows(buildTagCooccurrenceSql(tagId, networkSize));

  if (directRows.length === 0) {
    return {nodes: [], links: []};
  }

  const coTagIds = directRows.map(([id]) => id);
  const connectionRows =
    coTagIds.length > 1 ? await fetchRows(buildCoTagConnectionsSql(coTagIds)) : [];

  return buildNetworkData({
    centerId: tagId,
    centerName: tagName,
    directRows,
    connectionRows
  });
}
