---
title: PsyArXiv Subjects
---

# PsyArXiv Subjects

```js
import {datasetteSqlPageUrl, subjectsSql, subjectsUrl} from "./data/queries.js";
```

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
const subjectSearch = view(Inputs.search(subjects, {placeholder: "Search subjects..."}));
```

```js
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

const enrichedSubjects = subjectSearch.map(d => ({
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

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

```js
html`<div>
  <p>Data source queries:</p>
  <ul>
    <li>
      Subject hierarchy and preprint counts:
      <a href="${subjectsUrl}">JSON</a>
      |
      <a href="${datasetteSqlPageUrl(subjectsSql)}">SQL page</a>
    </li>
  </ul>
</div>`
```

- Subjects form a 3-level hierarchy:
  - Level 1: Top-level disciplines (e.g., Social and Behavioral Sciences, Neuroscience)
  - Level 2: Sub-disciplines (e.g., Clinical Psychology, Cognitive Neuroscience)
  - Level 3: Specific topics (e.g., Diagnosis, Feeding and Eating Disorders)

Each preprint can have multiple subjects assigned. Counts represent unique preprints (latest versions only) tagged with each subject.
