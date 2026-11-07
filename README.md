# DIGL: JavaScript Directed Graph auto-layout algorithm

![](https://github.com/thecrinkles/digl/actions/workflows/test.yml/badge.svg)
[![Node version](https://img.shields.io/npm/v/@crinkles/digl.svg?style=flat)](https://www.npmjs.com/package/@crinkles/digl)
[![NPM Downloads](https://img.shields.io/npm/dm/@crinkles/digl.svg?style=flat)](https://www.npmjs.com/package/@crinkles/digl)
[![Minified size](https://img.shields.io/bundlephobia/min/@crinkles/digl?label=minified)](https://www.npmjs.com/package/@crinkles/digl)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A small JavaScript library that allows you to create visual layout of directed graphs (e.g. state machines), with minimum effort. The algorithm/heuristic is loosely based on the workings of [GraphViz](https://www.graphviz.org/Documentation/TSE93.pdf).

## Getting started

```js
import { digl } from '@crinkles/digl';

const edges = [{ source: '1', target: '2' }];
const ranks = digl(edges, { solitary: [] });
// [[['1'], ['2']]]
```

## Configuration

- `solitary: string[]`: an array of node IDs (corresponding to the source/target in the edges) that should be solitary within a rank.

## How it works

The algorithm used is based on the [GraphViz](https://www.graphviz.org/Documentation/TSE93.pdf), but a simplified version. It consists of several steps:

1. Determine all the starting nodes (if no starting node can be found as it is part of a loop, the first node in found is used).
2. Each starting node gets its own graph representation, or ranking. This means that for each starting node, determine the _ranking_ of each node accessible from the start node. This is done based on the "longest path from source" algorithm. The start node is placed in _rank 0_. The final output will be an array of "graphs" or ranks.
3. Determine if there is overlap of nodes between the defined graphs. If so, the graphs are merged and a new ranking for all nodes is determined for the new graph. This happens iterative until no overlap is found between graphs anymore.
4. Determine for each graphs the score in crossing edges between ranks and within a rank. If no crossings are found, the graphs are optimal.
5. For each graph, switch nodes within/between ranks, and see if we improve the score of the graph. If the score did not improve, the graph is flagged not improveable (local optimum), and the original ranking is maintained.
6. If we improved the score, repeat step 3 untill 6 with the new defined graph.

### Score the graph based on its ranks

All 'ranks' can be scored with a number. The represents the number of visual crossing edges a graph based on the ranks will have, plus the amount of edges crossing over a node. Therefore, the lower the score, the better. The scores are determined by:

- Counting all edges that have a source and target within a single rank, which are not adjecent to each other in the rank.
- Go through all combinations of ranks, and:
  - Go through all combinations of ranks
  - Discard all edges that have a source and target within the same rank
  - Determine all edges, regardless of the direction, that have a source and target within these ranks
  - For combination of edges, determine if they cross

```js
// Note this is a part of the logic
let _score = 0;
if (e1.x > e2.x && e1.t < e2.t) _score++;
```

## Examples

### Example acyclic graph

```ts
const edges: Edge[] = [
  { source: '1', target: '2' },
  { source: '2', target: '3' },
  { source: '2', target: '4' },
  { source: '3', target: '4' },
  { source: '4', target: '5' },
  { source: '5', target: '6' },
  { source: '4', target: '8' },
  { source: '8', target: '5' },
  { source: '3', target: '5' },
  { source: '3', target: '7' },
  { source: '7', target: '9' },
  { source: '9', target: '6' },
  { source: '7', target: '6' },
  { source: '9', target: '10' },
  { source: '10', target: '6' },
];
const result = digl(edges);
// [
//   [
//     ['1'],
//     ['2'],
//     ['3'],
//     ['4', '7'],
//     ['8', '9'],
//     ['5', '10'],
//     ['6'],
//   ]
// ]

const result = digl(edges, { solitary: ['8'] });
// [
//   [
//     ['1'],
//     ['2'],
//     ['3'],
//     ['4', '7'],
//     ['8'],
//     ['9'],
//     ['5', '10'],
//     ['6'],
//   ]
// ]
```

### Example cyclic graph

```ts
const edges: Edge[] = [
  { source: '1', target: '2' },
  { source: '2', target: '3' },
  { source: '2', target: '4' },
  { source: '1', target: '4' },
  { source: '4', target: '1' },
];

const result = digl(edges);
// [
//   [
//     ['1'],
//     ['2'],
//     ['3', '4']
//   ]
// ]
```

### Example multiple disconnected graphs

```ts
const edges: Edge[] = [
  { source: '1', target: '2' },
  { source: '2', target: '3' },
  { source: '2', target: '4' },
  { source: '5', target: '6' },
  { source: '6', target: '7' },
  { source: '6', target: '8' },
];
const result = digl(edges);
// [
//   [['1'], ['2'], ['3', '4']],
//   [['5'], ['6'], ['7', '8']],
// ]
```

### Example multiple connected graphs

```ts
const edges: Edge[] = [
  { source: '1', target: '2' },
  { source: '2', target: '3' },
  { source: '2', target: '4' },
  { source: '5', target: '6' },
  { source: '6', target: '7' },
  { source: '6', target: '4' },
  { source: '8', target: '9' },
  { source: '9', target: '10' },
  { source: '9', target: '7' },
];
const result = digl(edges);
// [
//   [
//     ['1', '5', '8'],
//     ['2', '6', '9'],
//     ['3', '4', '7', '10'],
//   ],
// ]
```

### Example positioning algorithm

![](./img/positioning.png)

```ts
export default function positioning(
  config: Config,
  nodes: Node[],
  ranks: Rank[],
): Layout {
  const _nodes: PositionedNode[] = [];
  const _h = config.orientation === 'horizontal';

  ranks.forEach((r, i) => {
    const xStart = _h
      ? 2 * config.width * i
      : -0.5 * (r.length - 1) * 2 * config.width;
    const yStart = _h
      ? -0.5 * (r.length - 1) * 2 * config.height
      : 2 * config.height * i;

    r.forEach((nodeId, nIndex) => {
      const _node: Node = nodes.find((n) => n.id == nodeId) as Node;
      if (!_node) return;
      const x = _h ? xStart : xStart + 2 * config.width * nIndex;
      const y = _h ? yStart + 2 * config.height * nIndex : yStart;
      _nodes.push({ ..._node, x, y });
    });
  });

  return _nodes;
}
```
