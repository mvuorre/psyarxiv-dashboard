#!/usr/bin/env node

import {performance} from "node:perf_hooks";

const DEFAULT_LOCAL_DATASETTE_URL = "http://127.0.0.1:8001";
const DEFAULT_HTTP_TIMEOUT_MS = 15000;

process.env.DATASETTE_BASE_URL ||= DEFAULT_LOCAL_DATASETTE_URL;

const queryTimeoutMs = Number.parseInt(
  process.env.QUERY_PROBE_TIMEOUT_MS ?? `${DEFAULT_HTTP_TIMEOUT_MS}`,
  10
);

if (!Number.isFinite(queryTimeoutMs) || queryTimeoutMs <= 0) {
  throw new Error("QUERY_PROBE_TIMEOUT_MS must be a positive integer");
}

const queries = await import("../src/data/queries.js");
const networkQueries = await import("../src/data/network-queries.js");

const staticQueries = [
  {query: "preprints-by-date", sql: queries.preprintsByDateSql, warnMs: 250},
  {query: "licenses", sql: queries.licensesSql, warnMs: 250},
  {query: "open-science-data-links", sql: queries.openScienceDataLinksByYearSql, warnMs: 250},
  {query: "open-science-prereg-links", sql: queries.openSciencePreregLinksByYearSql, warnMs: 250},
  {query: "subjects", sql: queries.subjectsSql, warnMs: 500},
  {query: "top-tags", sql: queries.topTagsSql, warnMs: 250},
  {query: "contributors-first-appearance", sql: queries.contributorsFirstAppearanceByDateSql, warnMs: 750},
  {query: "contributors-on-preprints", sql: queries.contributorsOnPreprintsByDateSql, warnMs: 500},
  {query: "top-contributors", sql: queries.topContributorsSql, warnMs: 500},
  {query: "coauthorship-overview", sql: queries.coauthorshipOverviewSql, warnMs: 500, expectedMinRows: 1},
  {query: "top-collaborators", sql: queries.topCollaboratorsSql, warnMs: 750, expectedMinRows: 1},
  {query: "degree-distribution", sql: queries.degreeDistributionSql, warnMs: 500, expectedMinRows: 1},
  {query: "contributors-by-affiliation-contributor", sql: queries.contributorsByAffiliationContributorSql, warnMs: 500},
  {query: "contributors-by-affiliation-preprint", sql: queries.contributorsByAffiliationPreprintSql, warnMs: 500},
  {query: "affiliations-first-appearance", sql: queries.affiliationsFirstAppearanceByDateSql, warnMs: 750},
  {query: "affiliations-on-preprints", sql: queries.affiliationsOnPreprintsByDateSql, warnMs: 500}
];

const dynamicFixtures = {
  coauthorship: [
    {label: networkQueries.defaultCoauthorshipUserId, userId: networkQueries.defaultCoauthorshipUserId},
    {label: "rtg46", userId: "rtg46"}
  ],
  tags: [
    {
      label: `${networkQueries.defaultTagName} (n=${networkQueries.defaultTagNetworkSize})`,
      tagName: networkQueries.defaultTagName,
      networkSize: networkQueries.defaultTagNetworkSize
    },
    {
      label: `covid-19 (n=${networkQueries.maxTagNetworkSize})`,
      tagName: "covid-19",
      networkSize: networkQueries.maxTagNetworkSize
    }
  ]
};

const results = [];

const pushResult = ({
  query,
  fixture = "-",
  status,
  http = "-",
  elapsedMs = 0,
  warnMs = "-",
  note = ""
}) => {
  results.push({
    query,
    fixture,
    target: queries.datasetteBaseUrl,
    http: String(http),
    ms: elapsedMs.toFixed(1),
    warn_ms: String(warnMs),
    status,
    note
  });
};

const previewText = (value, maxLength = 140) => {
  const flattened = value.replace(/\s+/g, " ").trim();
  if (flattened.length <= maxLength) {
    return flattened;
  }
  return `${flattened.slice(0, maxLength - 1)}…`;
};

const fetchSql = async (sql) => {
  const url = queries.datasetteQueryUrl(sql);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      headers: {accept: "application/json"},
      signal: AbortSignal.timeout(queryTimeoutMs)
    });
    const elapsedMs = performance.now() - start;

    if (!response.ok) {
      const body = await response.text();
      return {
        ok: false,
        url,
        http: response.status,
        elapsedMs,
        message: previewText(body || response.statusText || "request failed")
      };
    }

    let data;
    try {
      data = await response.json();
    } catch (error) {
      return {
        ok: false,
        url,
        http: response.status,
        elapsedMs,
        message: `invalid JSON response: ${error.message}`
      };
    }

    if (!Array.isArray(data.rows)) {
      return {
        ok: false,
        url,
        http: response.status,
        elapsedMs,
        message: "response JSON is missing rows[]"
      };
    }

    return {
      ok: true,
      url,
      http: response.status,
      elapsedMs,
      rows: data.rows
    };
  } catch (error) {
    const elapsedMs = performance.now() - start;
    const message =
      error.name === "TimeoutError"
        ? `request timed out after ${queryTimeoutMs} ms`
        : error.message;

    return {
      ok: false,
      url,
      http: "-",
      elapsedMs,
      message
    };
  }
};

const runSqlProbe = async ({
  query,
  fixture = "-",
  sql,
  warnMs,
  expectedMinRows = 0
}) => {
  const response = await fetchSql(sql);

  if (!response.ok) {
    pushResult({
      query,
      fixture,
      status: "fail",
      http: response.http,
      elapsedMs: response.elapsedMs,
      warnMs,
      note: response.message
    });
    return null;
  }

  if (response.rows.length < expectedMinRows) {
    pushResult({
      query,
      fixture,
      status: "fail",
      http: response.http,
      elapsedMs: response.elapsedMs,
      warnMs,
      note: `expected at least ${expectedMinRows} row(s), got ${response.rows.length}`
    });
    return null;
  }

  const status = response.elapsedMs > warnMs ? "warn" : "ok";
  const note =
    response.elapsedMs > warnMs
      ? `exceeds local warning budget (${warnMs} ms)`
      : "";

  pushResult({
    query,
    fixture,
    status,
    http: response.http,
    elapsedMs: response.elapsedMs,
    warnMs,
    note
  });

  return response.rows;
};

const runCoauthorshipFixture = async ({label, userId}) => {
  const directRows = await runSqlProbe({
    query: "coauthorship-direct",
    fixture: label,
    sql: networkQueries.buildDirectCoauthorsSql(userId),
    warnMs: 750,
    expectedMinRows: 1
  });

  await runSqlProbe({
    query: "coauthorship-name-lookup",
    fixture: label,
    sql: networkQueries.buildContributorNameLookupSql(userId),
    warnMs: 250,
    expectedMinRows: 1
  });

  if (!directRows) {
    pushResult({
      query: "coauthorship-connections",
      fixture: label,
      status: "fail",
      warnMs: 750,
      note: "skipped because direct coauthor query failed"
    });
    return;
  }

  if (directRows.length < 2) {
    pushResult({
      query: "coauthorship-connections",
      fixture: label,
      status: "fail",
      warnMs: 750,
      note: `need at least 2 coauthors for the second-stage query, got ${directRows.length}`
    });
    return;
  }

  const coauthorIds = directRows.map((row) => row[0]);

  await runSqlProbe({
    query: "coauthorship-connections",
    fixture: label,
    sql: networkQueries.buildCoauthorConnectionsSql(coauthorIds),
    warnMs: 750
  });
};

const runTagFixture = async ({label, tagName, networkSize}) => {
  const tagIdRows = await runSqlProbe({
    query: "tag-id-lookup",
    fixture: label,
    sql: networkQueries.buildTagIdLookupSql(tagName),
    warnMs: 250,
    expectedMinRows: 1
  });

  if (!tagIdRows) {
    pushResult({
      query: "tag-cooccurrence",
      fixture: label,
      status: "fail",
      warnMs: 750,
      note: "skipped because tag id lookup failed"
    });
    pushResult({
      query: "co-tag-connections",
      fixture: label,
      status: "fail",
      warnMs: 750,
      note: "skipped because tag id lookup failed"
    });
    return;
  }

  const tagId = tagIdRows[0][0];
  const cooccurrenceRows = await runSqlProbe({
    query: "tag-cooccurrence",
    fixture: label,
    sql: networkQueries.buildTagCooccurrenceSql(tagId, networkSize),
    warnMs: 750,
    expectedMinRows: 1
  });

  if (!cooccurrenceRows) {
    pushResult({
      query: "co-tag-connections",
      fixture: label,
      status: "fail",
      warnMs: 750,
      note: "skipped because tag co-occurrence query failed"
    });
    return;
  }

  if (cooccurrenceRows.length < 2) {
    pushResult({
      query: "co-tag-connections",
      fixture: label,
      status: "fail",
      warnMs: 750,
      note: `need at least 2 co-occurring tags for the second-stage query, got ${cooccurrenceRows.length}`
    });
    return;
  }

  const coTagIds = cooccurrenceRows.map((row) => row[0]);

  await runSqlProbe({
    query: "co-tag-connections",
    fixture: label,
    sql: networkQueries.buildCoTagConnectionsSql(coTagIds),
    warnMs: 750
  });
};

const printTable = (rows) => {
  const headers = ["status", "query", "fixture", "http", "ms", "warn_ms", "target", "note"];
  const widths = Object.fromEntries(
    headers.map((header) => [
      header,
      Math.max(header.length, ...rows.map((row) => row[header].length))
    ])
  );

  const formatRow = (row) =>
    headers
      .map((header) => row[header].padEnd(widths[header]))
      .join("  ");

  console.log(formatRow(Object.fromEntries(headers.map((header) => [header, header]))));
  console.log(
    headers.map((header) => "-".repeat(widths[header])).join("  ")
  );

  rows.forEach((row) => {
    console.log(formatRow(row));
  });
};

for (const staticQuery of staticQueries) {
  await runSqlProbe(staticQuery);
}

for (const fixture of dynamicFixtures.coauthorship) {
  await runCoauthorshipFixture(fixture);
}

for (const fixture of dynamicFixtures.tags) {
  await runTagFixture(fixture);
}

printTable(results);

const summary = results.reduce(
  (counts, result) => {
    counts[result.status] += 1;
    return counts;
  },
  {ok: 0, warn: 0, fail: 0}
);

console.log("");
console.log(`Target: ${queries.datasetteBaseUrl}`);
console.log(`Timeout: ${queryTimeoutMs} ms`);
console.log(
  `Summary: ${summary.ok} ok, ${summary.warn} warn, ${summary.fail} fail`
);

if (summary.fail > 0) {
  process.exitCode = 1;
}
