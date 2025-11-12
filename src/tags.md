---
title: PsyArXiv Tags
---

# PsyArXiv Tags

```js
const tags = FileAttachment("data/top-tags.csv").csv({typed: true});
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Tags (≥10 uses)</h2>
    <span class="big">${tags.length.toLocaleString()}</span>
  </div>
</div>

```js
const topN = view(Inputs.range([10, 100], {value: 20, step: 10, label: "Show top N tags"}));
```

## Top Tags

```js
import * as Plot from "npm:@observablehq/plot";
```

```js
const topTags = tags.slice(0, topN);
```

```js
Plot.plot({
  marginLeft: 200,
  height: Math.max(400, topN * 20),
  x: {label: "Number of uses", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(topTags, {
      x: "use_count",
      y: "tag_text",
      fill: "var(--theme-foreground-focus)",
      sort: {y: "-x"},
      tip: true
    })
  ]
})
```

## All Tags

```js
const search = view(Inputs.search(tags, {placeholder: "Search tags..."}));
```

<div style="max-width: 1000px;">

```js
Inputs.table(search, {
  columns: ["tag_text", "use_count"],
  header: {
    tag_text: "Tag",
    use_count: "Uses"
  },
  sort: "use_count",
  reverse: true,
  select: false
})
```

</div>

## Tag Co-occurrence Network

```js
import * as d3 from "npm:d3";
```

```js
const tagsSorted = [...tags].sort((a, b) => a.tag_text.localeCompare(b.tag_text));
```

```js
const tagInput = view(Inputs.select(tagsSorted.map(d => d.tag_text), {
  label: "Select tag (type to search)",
  value: "social cognition",
  width: 300
}));
```

```js
const selectedTag = tagInput || "social cognition";
```

```js
const networkSize = view(Inputs.range([10, 100], {
  value: 30,
  step: 10,
  label: "Number of co-occurring tags to show"
}));
```

```js
const networkButtonClicks = view(Inputs.button("Show Network", {reduce: (i) => i + 1}));
```

```js
// Fetch tag co-occurrence data when button is clicked
const tagCooccurrenceData = await (async () => {
  if (networkButtonClicks === 0) return null;

  const baseUrl = "https://psyarxivdb.vuorre.com/preprints.json?sql=";

  // Get the tag_id for the selected tag
  const tagIdQuery = `SELECT id FROM tags WHERE tag_text = '${selectedTag.replace(/'/g, "''")}'`;
  const tagIdResponse = await fetch(baseUrl + encodeURIComponent(tagIdQuery));
  const tagIdData = await tagIdResponse.json();

  if (!tagIdData.rows || tagIdData.rows.length === 0) {
    return { nodes: [], links: [] };
  }

  const selectedTagId = tagIdData.rows[0][0];

  // Query: Get co-occurring tags (tags that appear on same preprints)
  const query = `
    SELECT
      t.id,
      t.tag_text,
      COUNT(DISTINCT pt1.preprint_id) as cooccurrence_count
    FROM preprint_tags pt1
    JOIN preprint_tags pt2 ON pt1.preprint_id = pt2.preprint_id AND pt1.tag_id != pt2.tag_id
    JOIN tags t ON pt2.tag_id = t.id
    WHERE pt1.tag_id = ${selectedTagId}
      AND pt1.is_latest_version = 1
      AND pt2.is_latest_version = 1
      AND t.use_count >= 10
    GROUP BY t.id, t.tag_text
    ORDER BY cooccurrence_count DESC
    LIMIT ${networkSize}
  `;

  const response = await fetch(baseUrl + encodeURIComponent(query));
  const data = await response.json();

  if (!data.rows || data.rows.length === 0) {
    return { nodes: [], links: [] };
  }

  // Build nodes
  const nodes = [
    { id: selectedTagId, name: selectedTag, isCenter: true }
  ];

  const links = [];
  const cotagIds = [];

  data.rows.forEach(row => {
    const [cotagId, cotagName, count] = row;
    nodes.push({
      id: cotagId,
      name: cotagName,
      isCenter: false
    });
    links.push({
      source: selectedTagId,
      target: cotagId,
      value: count
    });
    cotagIds.push(cotagId);
  });

  // Query 2: Get connections among co-occurring tags
  if (cotagIds.length > 1) {
    const idList = cotagIds.join(',');
    const query2 = `
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
      HAVING cooccurrence_count >= 3
    `;

    const response2 = await fetch(baseUrl + encodeURIComponent(query2));
    const data2 = await response2.json();

    data2.rows.forEach(row => {
      const [id1, name1, id2, name2, count] = row;
      links.push({
        source: id1,
        target: id2,
        value: count
      });
    });
  }

  return { nodes, links };
})();
```

```js
function forceGraph(data, {
  width = 640,
  height = 600,
  nodeRadius = 5,
  linkStrength = 0.08,
  linkDistance = 120,
  chargeStrength = -400
} = {}) {
  if (!data || !data.nodes || data.nodes.length === 0) {
    const svg = d3.create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .text(data === null ? "Click 'Show Network' to load data" : "No co-occurrence data available");

    return svg.node();
  }

  const links = data.links.map(d => ({...d}));
  const nodes = data.nodes.map(d => ({...d}));

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance(linkDistance)
      .strength(linkStrength))
    .force("charge", d3.forceManyBody().strength(chargeStrength))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide(nodeRadius * 2));

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  const g = svg.append("g");

  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  const link = g.append("g")
    .attr("stroke", "var(--theme-foreground-faint)")
    .attr("stroke-opacity", 0.3)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

  const node = g.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", d => d.isCenter ? nodeRadius * 2 : nodeRadius)
    .attr("fill", d => d.isCenter ? "#ff6b6b" : "#4dabf7")
    .call(drag(simulation));

  const label = g.append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text(d => d.name)
    .attr("font-size", d => d.isCenter ? 12 : 10)
    .attr("font-weight", d => d.isCenter ? "bold" : "normal")
    .attr("fill", "currentColor")
    .attr("dx", 8)
    .attr("dy", 4);

  node.append("title")
    .text(d => d.name);

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    label
      .attr("x", d => d.x)
      .attr("y", d => d.y);
  });

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      const padding = 20;
      event.subject.fx = Math.max(padding, Math.min(width - padding, event.x));
      event.subject.fy = Math.max(padding, Math.min(height - padding, event.y));
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return svg.node();
}
```

```js
function downloadSVG(svgElement, filename) {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

```js
const graphContainer = resize((width) => {
  const nodeCount = tagCooccurrenceData?.nodes?.length || 0;
  const height = Math.max(600, nodeCount > 50 ? 800 : 600);
  const svgNode = forceGraph(tagCooccurrenceData, {width, height});

  const container = html`<div>
    ${tagCooccurrenceData && tagCooccurrenceData.nodes.length > 0 ? html`
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1em;">
        <p style="font-size: 0.9em; color: #666; margin: 0;">
          ${tagCooccurrenceData.nodes.length - 1} co-occurring tags, ${tagCooccurrenceData.links.filter(d => d.source === tagCooccurrenceData.nodes[0].id || d.target === tagCooccurrenceData.nodes[0].id).length} connections
        </p>
        <button onclick=${() => downloadSVG(svgNode, `tag-cooccurrence-${selectedTag.replace(/[^a-z0-9]/gi, '-')}.svg`)} style="padding: 0.5em 1em; cursor: pointer;">
          Save as SVG
        </button>
      </div>
    ` : ''}
    ${svgNode}
  </div>`;

  return container;
});
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Tag Co-occurrence Network</h2>
    ${graphContainer}
  </div>
</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

Only tags with 10 or more uses are shown (3,425 tags, filtering out 94% of one-off tags).

Tag Co-occurrence Network:
- Shows the selected tag (center, red) and up to N most frequently co-occurring tags (configurable, 10-100)
- Link thickness represents the number of preprints where tags appear together
- Only considers latest versions of preprints
- Connections among co-occurring tags (non-center nodes) are shown if they co-occur on 3+ preprints
- Graph is interactive: zoom with scroll, drag nodes to rearrange

Limitations: Tags are user-generated and self-reported by preprint authors. This means:
- Tag naming is inconsistent (e.g., "decision making" vs "decision-making", "well-being" vs "wellbeing")
- Some tags may be duplicates with slight variations
- Tag quality and specificity varies widely
- Emerging topics may have low counts despite being legitimate research areas
