// See https://observablehq.com/framework/config for documentation.
const productionDatasetteBaseUrl = "https://psyarxivdb.vuorre.com";
const localDatasetteBaseUrl = "http://127.0.0.1:8001";

const isPreviewCommand = process.argv.some((arg) => arg === "preview");
const datasetteBaseUrl =
  process.env.DATASETTE_BASE_URL ??
  (isPreviewCommand ? localDatasetteBaseUrl : productionDatasetteBaseUrl);

process.env.DATASETTE_BASE_URL ??= datasetteBaseUrl;
const datasetteHeadScript = `<script>globalThis.__DATASETTE_BASE_URL__ = ${JSON.stringify(datasetteBaseUrl)};</script>`;

export default {
  title: "PsyArXiv Dashboard",
  head: `${datasetteHeadScript}<link rel="icon" href="pax-logo-32.png" type="image/png" sizes="32x32">`,
  root: "src",
  theme: "dashboard",
  header: '<nav style="display: flex; gap: 1.5rem; padding: 0.5rem 0; align-items: center;"><a href="/"><img src="pax-dashboard-small.png" style="height: 2rem;"></img></a></nav>',
  sidebar: true,
  footer: `Built by <a href="https://vuorre.com">Matti</a> with <a href="https://observablehq.com/framework/">Observable</a> (<a href="https://github.com/mvuorre/psyarxiv-dashboard">Source</a>). Last updated on ${new Date().toISOString().split('T')[0]}.`,
  toc: false,
  pager: false,
  pages: [
    {
      name: "Stats",
      open: true,
      pages: [
        { name: "Preprints", path: "preprints" },
        { name: "Affiliations", path: "affiliations" },
        { name: "Contributors", path: "contributors" },
        { name: "Coauthorship", path: "coauthorship-stats" },
        { name: "Subjects", path: "subjects" },
        { name: "Tags", path: "tags" },
        { name: "Licenses", path: "licenses" },
        { name: "Open science", path: "open-science" }
      ]
    },
    {
      name: "Tools",
      open: true,
      pages: [
        { name: "Coauthorship network", path: "coauthorship" },
        { name: "Tag network", path: "tag-network" }
      ]
    }
  ]
};
