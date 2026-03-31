---
title: Coauthorship Network
---

# PsyArXiv Coauthorship Network

```js
import {networkGraph} from "./components/network-graph.js";
import {loadCoauthorshipNetwork} from "./data/network-data.js";
import {defaultCoauthorshipUserId} from "./data/network-queries.js";
```

```js
const userId = view(Inputs.text({
  label: "OSF User ID",
  value: defaultCoauthorshipUserId,
  placeholder: "Enter OSF user ID"
}));
```

```js
const buttonClicks = view(Inputs.button("Show Network", {reduce: (i) => i + 1}));
```

```js
const coauthorData = await (async () => {
  if (buttonClicks === 0) return null;

  try {
    return await loadCoauthorshipNetwork(userId);
  } catch (error) {
    return {error: error.message, nodes: [], links: []};
  }
})();
```

```js
const graphContainer = resize((width) => {
  const nodeCount = coauthorData?.nodes?.length ?? 0;
  return networkGraph(coauthorData, {
    width,
    height: nodeCount > 50 ? 800 : 700,
    emptyMessage: "No coauthorship data available",
    linkDistance: 50,
    linkStrength: 0.1,
    chargeStrength: -200,
    linkStroke: "#999",
    linkOpacity: 0.6
  });
});
```

```js
const summaryText =
  coauthorData?.nodes?.length > 0
    ? `${coauthorData.nodes.length - 1} coauthors and ${coauthorData.links.length.toLocaleString()} links`
    : null;
```

<div class="grid grid-cols-1">
  <div class="card">
    <h2>Coauthorship Network</h2>
    ${summaryText ? html`<p>${summaryText}</p>` : null}
    ${graphContainer}
  </div>
</div>

---

## Methodology and Data Notes

Data: [PsyArXiv](https://osf.io/preprints/psyarxiv) via [psyarxivdb.vuorre.com](https://psyarxivdb.vuorre.com).

Only bibliographic authors on the latest version of each preprint are included. Link thickness represents the number of shared preprints between two authors.
