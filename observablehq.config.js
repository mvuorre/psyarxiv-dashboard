// See https://observablehq.com/framework/config for documentation.
export default {
  // The app’s title; used in the sidebar and webpage titles.
  title: "PsyArXiv Dashboard",

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="pax-logo-32.png" type="image/png" sizes="32x32">',

  // The path to the source root.
  root: "src",

  // Some additional configuration options and their defaults:
  theme: "dashboard", // try "light", "dark", "slate", etc.
  header: '<nav style="display: flex; gap: 1.5rem; padding: 0.5rem 0; align-items: center;"><img src="pax-dashboard-small.png" style="height: 2rem;"></img><a href="/">Home</a><a href="/preprints">Preprints</a><a href="/contributors">Contributors</a><a href="/affiliations">Affiliations</a><a href="/tags">Tags</a><a href="/subjects">Subjects</a><a href="/licenses">Licenses</a><a href="/coauthorship">Coauthorships</a><a href="/open-science">Open Science</a></nav>',
  sidebar: false,
  footer: `Built by <a href="https://vuorre.com">Matti</a> with <a href="https://observablehq.com/framework/">Observable</a> (<a href="https://github.com/mvuorre/psyarxiv-dashboard">Source</a>). Last updated on ${new Date().toISOString().split('T')[0]}.`, // what to show in the footer (HTML)
  // sidebar: true, // whether to show the sidebar
  toc: false, // whether to show the table of contents
  pager: false, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
};
