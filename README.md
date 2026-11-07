# DIGL: JavaScript Directed Graph auto-layout algorithm

![](https://github.com/thecrinkles/digl/actions/workflows/test.yml/badge.svg)
[![Node version](https://img.shields.io/npm/v/@crinkles/digl.svg?style=flat)](https://www.npmjs.com/package/@crinkles/digl)
[![NPM Downloads](https://img.shields.io/npm/dm/@crinkles/digl.svg?style=flat)](https://www.npmjs.com/package/@crinkles/digl)
[![Minified size](https://img.shields.io/bundlephobia/min/@crinkles/digl?label=minified)](https://www.npmjs.com/package/@crinkles/digl)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A small JavaScript library that allows you to create visual layout of directed graphs (e.g. state machines), with minimum effort. The algorithm/heuristic is loosely based on the workings of [GraphViz](https://www.graphviz.org/Documentation/TSE93.pdf).

## Getting started

```ts
import { digl, type Edge, type Layout } from '@crinkles/digl';

const edges: Edge[] = [{ source: '1', target: '2' }];
const layouts: Layout[] = digl(edges);
// [[['1'], ['2']]]
```

`digl` returns one `Layout` per connected graph in `edges`. A `Layout` is a list of ranks (rows), and each `Rank` is a list of node IDs in display order. Every node appears exactly once.

## Configuration

- `solitary?: string[]`: node IDs (as used in the edges) that each get a rank of their own.

## How it works

The algorithm is a simplified version of the one used by [GraphViz](https://www.graphviz.org/Documentation/TSE93.pdf):

1. Split the edges into connected graphs. Each becomes its own layout.
2. Break cycles: a depth-first search starts from every node without incoming edges, then from any node not reached yet. Edges that lead back to a node still being visited close a cycle, and are ignored for ranking.
3. Rank every node by its longest path from a start node. Start nodes are in rank 0.
4. Give each solitary node a rank of its own, placed before the rest of its rank.
5. Reduce crossing edges: swap neighbouring nodes within a rank, and keep the swap when the score does not get worse. This repeats until there are no crossings, or until a pass without improvement, followed by one extra pass, changes nothing.

Ranking takes time proportional to the number of nodes plus edges.

### Score

The score of a layout is the number of edge pairs that cross. Two edges between the same two ranks cross when their ends are in opposite order on those ranks: with positions `(x1, y1)` and `(x2, y2)`, they cross when `(x1 - x2) * (y1 - y2) < 0`. Edge direction does not matter.

Edges that skip ranks are compared by their two end ranks only. Unlike GraphViz, digl does not add placeholder nodes for them in the ranks in between, so crossings there are not counted.

## Upgrading from v2

- The package is ESM-only, with an `exports` map and ES2022 output. `require('@crinkles/digl')` still works on Node 20.19+ and 22.12+, which can `require()` ES modules. Older CommonJS setups need `await import('@crinkles/digl')`.
- Types are now exported: `Edge`, `Rank`, `Layout` and `Config`. `Layout` replaces `Graph`, and `digl` returns `Layout[]`.
- `Rank` is `string[]` (was `(string | null)[]`), and `solitary` is optional.
- Ranking no longer lists every path, which made v2 exponentially slow on branching graphs. Layouts of acyclic graphs are unchanged. Nodes in a cycle can now be placed in different ranks, where v2 sometimes put them in the same rank.
- Crossings are counted correctly when two ranks hold more than 10 nodes. v2 compared positions as text, so layouts of wide graphs can change, with fewer crossings.
- Two solitary nodes in the same rank each get their own rank, and splitting a rank never leaves an empty rank.
- Edges within a rank are no longer scored; the ranking never produces them.

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
import type { Layout } from '@crinkles/digl';

type Options = {
  orientation: 'horizontal' | 'vertical';
  width: number;
  height: number;
};

// Centers every rank, leaving one node size of space between nodes
export function positioning(layout: Layout, options: Options) {
  const horizontal = options.orientation === 'horizontal';
  const { width, height } = options;

  return layout.flatMap((rank, i) => {
    const xStart = horizontal ? 2 * width * i : -(rank.length - 1) * width;
    const yStart = horizontal ? -(rank.length - 1) * height : 2 * height * i;

    return rank.map((id, j) => ({
      id,
      x: horizontal ? xStart : xStart + 2 * width * j,
      y: horizontal ? yStart + 2 * height * j : yStart,
    }));
  });
}
```
