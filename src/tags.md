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

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

Only tags with 10 or more uses are shown (3,425 tags, filtering out 94% of one-off tags).

Limitations: Tags are user-generated and self-reported by preprint authors. This means:
- Tag naming is inconsistent (e.g., "decision making" vs "decision-making", "well-being" vs "wellbeing")
- Some tags may be duplicates with slight variations
- Tag quality and specificity varies widely
- Emerging topics may have low counts despite being legitimate research areas
