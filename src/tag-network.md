---
title: Tag Co-occurrence Network
---

# PsyArXiv Tag Co-occurrence Network

```js
import {
  networkGraph
} from "./components/network-graph.js";
import {loadTagNetwork} from "./data/network-data.js";
import {
  defaultTagName,
  defaultTagNetworkSize,
  maxTagNetworkSize
} from "./data/network-queries.js";
```

```js
const tags = FileAttachment("data/top-tags.csv").csv({typed: true});
```

```js
const tagsSorted = [...tags].sort((a, b) => a.tag_text.localeCompare(b.tag_text));
```

```js
const tagInput = view(Inputs.select(tagsSorted.map(d => d.tag_text), {
  label: "Select tag (type to search)",
  value: defaultTagName,
  width: 300
}));
```

```js
const selectedTag = tagInput || defaultTagName;
```

```js
const networkSize = view(Inputs.range([10, maxTagNetworkSize], {
  value: defaultTagNetworkSize,
  step: 10,
  label: "Number of co-occurring tags to show"
}));
```

```js
const networkButtonClicks = view(Inputs.button("Show Network", {reduce: (i) => i + 1}));
```

```js
const tagCooccurrenceData = await (async () => {
  if (networkButtonClicks === 0) return null;

  try {
    return await loadTagNetwork(selectedTag, networkSize);
  } catch (error) {
    return {error: error.message, nodes: [], links: []};
  }
})();
```

```js
const graphContainer = resize((width) => {
  const nodeCount = tagCooccurrenceData?.nodes?.length ?? 0;
  return networkGraph(tagCooccurrenceData, {
    width,
    height: Math.max(600, nodeCount > 50 ? 800 : 600),
    emptyMessage: "No co-occurrence data available",
    linkDistance: 120,
    linkStrength: 0.08,
    chargeStrength: -400
  });
});
```

```js
const summaryText =
  tagCooccurrenceData?.nodes?.length > 0
    ? `${tagCooccurrenceData.nodes.length - 1} co-occurring tags and ${tagCooccurrenceData.links.length.toLocaleString()} links`
    : null;
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Tag Co-occurrence Network</h2>
    ${summaryText ? html`<p>${summaryText}</p>` : null}
    ${graphContainer}
  </div>
</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

Only tags with 10 or more uses are available in the selector (${tags.length.toLocaleString()} tags).

Tag Co-occurrence Network:
- Shows the selected tag (center, red) and up to N most frequently co-occurring tags
- Link thickness represents the number of preprints where tags appear together
- Only considers latest versions of preprints
- Connections among co-occurring tags are shown if they co-occur on 3 or more preprints
- Graph is interactive: zoom with scroll, drag nodes to rearrange

Limitations: Tags are user-generated and self-reported by preprint authors. This means:
- Tag naming is inconsistent (e.g., "decision making" vs "decision-making", "well-being" vs "wellbeing")
- Some tags may be duplicates with slight variations
- Tag quality and specificity varies widely
- Emerging topics may have low counts despite being legitimate research areas
