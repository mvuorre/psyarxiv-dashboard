---
title: PsyArXiv Subjects
---

# PsyArXiv Subjects

```js
const subjects = FileAttachment("data/subjects.csv").csv({typed: true});
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Total Subjects</h2>
    <span class="big">${subjects.length.toLocaleString()}</span>
  </div>
</div>

```js
const topN = view(Inputs.range([10, 100], {value: 20, step: 10, label: "Show top N subjects"}));
const levelFilter = view(Inputs.radio(["All", "Level 1", "Level 2", "Level 3"], {value: "All", label: "Filter by level"}));
```

```js
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";
```

```js
// Filter subjects by level
const filteredSubjects = levelFilter === "All"
  ? subjects
  : subjects.filter(d => d.level === parseInt(levelFilter.split(" ")[1]));

const topSubjects = filteredSubjects.slice(0, topN);
```

## Top Subjects

```js
Plot.plot({
  marginLeft: 250,
  height: Math.max(400, topN * 20),
  x: {label: "Number of preprints", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(topSubjects, {
      x: "count",
      y: "text",
      fill: "var(--theme-foreground-focus)",
      sort: {y: "-x"},
      tip: true
    })
  ]
})
```

## All Subjects

```js
const search = view(Inputs.search(subjects, {placeholder: "Search subjects..."}));
```

```js
// Build full path for each subject
const subjectMap = new Map(subjects.map(d => [d.id, d]));
function getPath(subject) {
  const path = [];
  let current = subject;
  while (current) {
    path.unshift(current.text);
    current = subjectMap.get(current.parent_id);
  }
  return path.join(" → ");
}

const enrichedSubjects = search.map(d => ({
  ...d,
  path: d.level === 1 ? d.text : getPath(d)
}));
```

<div style="max-width: 1000px;">

```js
Inputs.table(enrichedSubjects, {
  columns: ["text", "path", "level", "count"],
  header: {
    text: "Subject",
    path: "Path",
    level: "Level",
    count: "Preprints"
  },
  width: {
    text: 200,
    path: 550
  },
  sort: "count",
  reverse: true,
  select: false
})
```

</div>

## Treemap

```js
// Build hierarchy from flat data
function buildHierarchy(subjects) {
  const root = {id: "root", text: "All Subjects", children: []};
  const map = new Map([["", root]]);

  // First pass: create all nodes
  subjects.forEach(d => {
    map.set(d.id, {...d, children: []});
  });

  // Second pass: build tree
  subjects.forEach(d => {
    const parent = map.get(d.parent_id || "");
    if (parent) {
      parent.children.push(map.get(d.id));
    }
  });

  return root;
}

const hierarchyData = buildHierarchy(subjects);
const rootHierarchy = d3.hierarchy(hierarchyData)
  .sum(d => d.count || 0)
  .sort((a, b) => b.value - a.value);

const treemapLayout = d3.treemap()
  .size([1000, 600])
  .padding(1)
  .round(true);

treemapLayout(rootHierarchy);
```

```js
(() => {
  const svg = d3.create("svg")
    .attr("width", 1000)
    .attr("height", 600)
    .attr("viewBox", [0, 0, 1000, 600])
    .attr("style", "max-width: 100%; height: auto;");

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const cell = svg.selectAll("g")
    .data(rootHierarchy.descendants().filter(d => d.depth > 0))
    .join("g")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  cell.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.text);
    })
    .attr("fill-opacity", 0.6)
    .attr("stroke", "white");

  cell.append("text")
    .attr("x", 3)
    .attr("y", 13)
    .text(d => {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      if (width < 50 || height < 20) return "";
      return d.data.text;
    })
    .attr("font-size", "10px")
    .attr("fill", "black");

  cell.append("title")
    .text(d => `${d.ancestors().reverse().slice(1).map(d => d.data.text).join(" → ")}\n${d.value.toLocaleString()} preprints`);

  return svg.node();
})()
```

## Hierarchy Tree

```js
// Get level 1 subjects for selector
const level1Subjects = subjects.filter(d => d.level === 1).sort((a, b) => b.count - a.count);
const selectedSubject = view(Inputs.select(level1Subjects.map(d => d.text), {
  label: "Select discipline",
  value: level1Subjects[0].text
}));
```

```js
(() => {
  const width = 1000;
  const marginTop = 10;
  const marginRight = 150;
  const marginBottom = 10;
  const marginLeft = 150;

  // Find the selected subject and build hierarchy from it
  const selectedSubjectData = subjects.find(d => d.text === selectedSubject);
  const subjectSubtree = subjects.filter(d =>
    d.id === selectedSubjectData.id ||
    d.parent_id === selectedSubjectData.id ||
    subjects.find(p => p.id === d.parent_id && p.parent_id === selectedSubjectData.id)
  );

  const subtreeHierarchy = buildHierarchy(subjectSubtree);

  // Calculate tree layout
  const root = d3.hierarchy(subtreeHierarchy.children[0] || subtreeHierarchy);
  const dx = 20;
  const dy = width / (root.height + 1);

  const tree = d3.tree().nodeSize([dx, dy]);
  root.sort((a, b) => (b.data.count || 0) - (a.data.count || 0));
  tree(root);

  // Calculate extents
  let x0 = Infinity;
  let x1 = -x0;
  root.each(d => {
    if (d.x > x1) x1 = d.x;
    if (d.x < x0) x0 = d.x;
  });

  const height = x1 - x0 + marginTop + marginBottom;

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-marginLeft, x0 - marginTop, width, height])
    .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

  const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke", "var(--theme-foreground-muted)")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x));

  const node = svg.append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle")
    .attr("fill", d => d.children ? "var(--theme-foreground-focus)" : "var(--theme-foreground-muted)")
    .attr("r", 2.5);

  node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -6 : 6)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .attr("fill", "var(--theme-foreground)")
    .text(d => d.data.text)
    .clone(true).lower()
    .attr("stroke", "var(--theme-background)");

  node.append("title")
    .text(d => `${d.ancestors().reverse().map(d => d.data.text).join(" → ")}\n${d.data.count || 0} preprints`);

  return svg.node();
})()
```

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

- Subjects form a 3-level hierarchy:
  - Level 1: Top-level disciplines (e.g., Social and Behavioral Sciences, Neuroscience)
  - Level 2: Sub-disciplines (e.g., Clinical Psychology, Cognitive Neuroscience)
  - Level 3: Specific topics (e.g., Diagnosis, Feeding and Eating Disorders)

Each preprint can have multiple subjects assigned. Counts represent unique preprints (latest versions only) tagged with each subject.
