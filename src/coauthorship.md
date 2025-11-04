---
title: Coauthorship Network
---

# PsyArXiv Coauthorship Network

```js
import * as d3 from "npm:d3";
```

```js
const userId = view(Inputs.text({
  label: "OSF User ID",
  value: "tdyix",
  placeholder: "Enter OSF user ID"
}));
```

```js
const buttonClicks = view(Inputs.button("Show Network", {reduce: (i) => i + 1}));
```

```js
// Fetch coauthorship data when button is clicked
const coauthorData = await (async () => {
  if (buttonClicks === 0) return null;

  const baseUrl = "https://psyarxivdb.vuorre.com/preprints.json?sql=";

  // Query 1: Direct coauthors with names
  const query1 = `
    SELECT c.osf_user_id, c.full_name, COUNT(DISTINCT pc1.preprint_id) as count
    FROM preprint_contributors pc1
    JOIN preprint_contributors pc2 ON pc1.preprint_id = pc2.preprint_id AND pc1.osf_user_id != pc2.osf_user_id
    JOIN contributors c ON pc2.osf_user_id = c.osf_user_id
    WHERE pc1.osf_user_id = '${userId}'
      AND pc1.bibliographic = 1 AND pc2.bibliographic = 1
      AND pc1.is_latest_version = 1 AND pc2.is_latest_version = 1
      AND c.full_name IS NOT NULL
    GROUP BY c.osf_user_id, c.full_name
  `;

  const response1 = await fetch(baseUrl + encodeURIComponent(query1));
  const data1 = await response1.json();

  if (!data1.rows || data1.rows.length === 0) {
    return { nodes: [], links: [] };
  }

  // Get user's own name
  const userQuery = `SELECT full_name FROM contributors_with_counts WHERE osf_user_id = '${userId}'`;
  const userResponse = await fetch(baseUrl + encodeURIComponent(userQuery));
  const userData = await userResponse.json();
  const userName = userData.rows[0]?.[0] || userId;

  // Build nodes from direct coauthors
  const nodes = [
    { id: userId, name: userName, isCenter: true }
  ];

  const links = [];
  const coauthorIds = [];

  data1.rows.forEach(row => {
    const [coauthorId, coauthorName, count] = row;
    nodes.push({
      id: coauthorId,
      name: coauthorName,
      isCenter: false
    });
    links.push({
      source: userId,
      target: coauthorId,
      value: count
    });
    coauthorIds.push(coauthorId);
  });

  // Query 2: Connections among coauthors
  if (coauthorIds.length > 1) {
    const idList = coauthorIds.map(id => `'${id}'`).join(',');
    const query2 = `
      SELECT c1.osf_user_id, c1.full_name, c2.osf_user_id, c2.full_name, COUNT(DISTINCT pc1.preprint_id) as count
      FROM preprint_contributors pc1
      JOIN preprint_contributors pc2 ON pc1.preprint_id = pc2.preprint_id AND pc1.osf_user_id < pc2.osf_user_id
      JOIN contributors c1 ON pc1.osf_user_id = c1.osf_user_id
      JOIN contributors c2 ON pc2.osf_user_id = c2.osf_user_id
      WHERE pc1.osf_user_id IN (${idList}) AND pc2.osf_user_id IN (${idList})
        AND pc1.bibliographic = 1 AND pc2.bibliographic = 1
        AND pc1.is_latest_version = 1 AND pc2.is_latest_version = 1
        AND c1.full_name IS NOT NULL AND c2.full_name IS NOT NULL
      GROUP BY c1.osf_user_id, c1.full_name, c2.osf_user_id, c2.full_name
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
  linkStrength = 0.1,
  linkDistance = 50,
  chargeStrength = -200
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
      .text(data === null ? "Click 'Show Network' to load data" : "No coauthorship data available");

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
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(nodeRadius * 2));

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  const link = svg.append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

  const node = svg.append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", d => d.isCenter ? nodeRadius * 2 : nodeRadius)
    .attr("fill", d => d.isCenter ? "#ff6b6b" : "#4dabf7")
    .call(drag(simulation));

  const label = svg.append("g")
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
      event.subject.fx = event.x;
      event.subject.fy = event.y;
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

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Coauthorship Network</h2>
    ${coauthorData && coauthorData.nodes.length > 0 ? html`<p style="font-size: 0.9em; color: #666;">
      ${coauthorData.nodes.length - 1} coauthors, ${coauthorData.links.filter(d => d.source === userId || d.target === userId).length} direct collaborations
    </p>` : ''}
    ${resize((width) => forceGraph(coauthorData, {width, height: 600}))}
  </div>
</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

Only bibliographic authors on the latest version of each preprint are included. Link thickness represents the number of shared preprints between two authors.
