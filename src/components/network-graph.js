import * as d3 from "npm:d3";

function placeholderGraph(message, {width, height}) {
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height]);

  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "currentColor")
    .text(message);

  return svg.node();
}

function drag(simulation, {width, height, padding}) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = Math.max(padding, Math.min(width - padding, event.x));
    event.subject.fy = Math.max(padding, Math.min(height - padding, event.y));
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3
    .drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

export function networkGraph(
  data,
  {
    width,
    height = 700,
    nodeRadius = 5,
    padding = 20,
    linkStrength = 0.08,
    linkDistance = 80,
    chargeStrength = -250,
    linkStroke = "var(--theme-foreground-muted)",
    linkOpacity = 0.4,
    waitingMessage = 'Click "Show Network" to load data',
    emptyMessage = "No network data available"
  } = {}
) {
  if (data === null) {
    return placeholderGraph(waitingMessage, {width, height});
  }

  if (data?.error) {
    return placeholderGraph(data.error, {width, height});
  }

  if (!data?.nodes?.length) {
    return placeholderGraph(emptyMessage, {width, height});
  }

  const links = data.links.map((link) => ({...link}));
  const nodes = data.nodes.map((node) => ({...node}));

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((node) => node.id)
        .distance(linkDistance)
        .strength(linkStrength)
    )
    .force("charge", d3.forceManyBody().strength(chargeStrength))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05))
    .force("collide", d3.forceCollide(nodeRadius * 2));

  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  const container = svg.append("g");

  svg.call(
    d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => {
      container.attr("transform", event.transform);
    })
  );

  const link = container
    .append("g")
    .attr("stroke", linkStroke)
    .attr("stroke-opacity", linkOpacity)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", (edge) => Math.sqrt(edge.value));

  const node = container
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", (point) => (point.isCenter ? nodeRadius * 2 : nodeRadius))
    .attr("fill", (point) =>
      point.isCenter ? "var(--theme-foreground-focus)" : "var(--theme-foreground-muted)"
    )
    .call(drag(simulation, {width, height, padding}));

  const label = container
    .append("g")
    .selectAll("text")
    .data(nodes)
    .join("text")
    .text((point) => point.name)
    .attr("font-size", (point) => (point.isCenter ? 12 : 10))
    .attr("font-weight", (point) => (point.isCenter ? "bold" : "normal"))
    .attr("fill", "currentColor")
    .attr("dx", 8)
    .attr("dy", 4);

  node.append("title").text((point) => point.name);

  simulation.on("tick", () => {
    link
      .attr("x1", (edge) => edge.source.x)
      .attr("y1", (edge) => edge.source.y)
      .attr("x2", (edge) => edge.target.x)
      .attr("y2", (edge) => edge.target.y);

    node.attr("cx", (point) => point.x).attr("cy", (point) => point.y);
    label.attr("x", (point) => point.x).attr("y", (point) => point.y);
  });

  return svg.node();
}
