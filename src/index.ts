import { optimize } from './optimize.ts';
import type { Edge, Layout } from './types.js';

export type { Edge, Layout, Rank } from './types.js';

// A node id, or a placeholder for an edge passing through a rank
type Slot = string | symbol;
type Graph = { ranks: Slot[][]; segments: { source: Slot; target: Slot }[] };

// Lays out each connected graph in `edges` as ranks:
// 1. Depth-first search from nodes without incoming edges (then from any node
//    not reached yet), ignoring edges that close a cycle.
// 2. Rank every node by its longest path from a start node.
// 3. Add a placeholder to every rank an edge passes through.
// 4. Reorder each rank to reduce crossing edges.
export function digl(edges: readonly Edge[]): Layout[] {
  const nodes = [...new Set(edges.flatMap((e) => [e.source, e.target]))];
  const next = new Map<string, string[]>(nodes.map((n) => [n, []]));
  for (const e of edges) next.get(e.source)?.push(e.target);

  // Connected graphs, via union-find
  const parent = new Map(nodes.map((n) => [n, n]));
  const find = (n: string): string => {
    const p = parent.get(n) ?? n;
    if (p === n) return n;
    const root = find(p);
    parent.set(n, root);
    return root;
  };
  for (const e of edges) parent.set(find(e.source), find(e.target));

  // Depth-first search; edges back to a node still being visited close a
  // cycle and are left out of the ranking.
  // The recursion is as deep as the longest path, which is fine for graphs of
  // up to ~10k nodes deep; beyond that an explicit stack is needed.
  const state = new Map<string, 'open' | 'done'>();
  const finished: string[] = [];
  const kept = new Map<string, string[]>(nodes.map((n) => [n, []]));
  const visit = (n: string) => {
    state.set(n, 'open');
    for (const m of next.get(n) ?? []) {
      if (state.get(m) === 'open') continue;
      kept.get(n)?.push(m);
      if (!state.has(m)) visit(m);
    }
    state.set(n, 'done');
    finished.push(n);
  };

  const graphs = new Map<string, Graph>();
  const targets = new Set(edges.map((e) => e.target));
  const sources = nodes.filter((n) => !targets.has(n));
  for (const n of [...sources, ...nodes]) {
    if (state.has(n)) continue;
    if (!graphs.has(find(n))) graphs.set(find(n), { ranks: [], segments: [] });
    visit(n);
  }

  // Longest path, processing nodes in topological order
  const rank = new Map<string, number>(nodes.map((n) => [n, 0]));
  for (const n of finished.reverse()) {
    const r = (rank.get(n) ?? 0) + 1;
    for (const m of kept.get(n) ?? [])
      rank.set(m, Math.max(rank.get(m) ?? 0, r));
  }

  // Every node is in a graph: each graph got registered by its first DFS root
  const graphOf = (n: string) => graphs.get(find(n))!;
  for (const n of nodes) (graphOf(n).ranks[rank.get(n) ?? 0] ??= []).push(n);

  // Split each edge into segments between neighbouring ranks, with a
  // placeholder in every rank it passes through.
  for (const { source, target } of edges) {
    const { ranks, segments } = graphOf(source);
    const from = rank.get(source) ?? 0;
    const to = rank.get(target) ?? 0;
    const step = Math.sign(to - from);
    let previous: Slot = source;
    for (let r = from + step; r !== to; r += step) {
      const placeholder = Symbol();
      ranks[r].push(placeholder);
      segments.push({ source: previous, target: placeholder });
      previous = placeholder;
    }
    segments.push({ source: previous, target });
  }

  return [...graphs.values()].map(({ ranks, segments }) =>
    optimize(ranks, segments).map((rank) =>
      rank.map((slot) => (typeof slot === 'string' ? slot : null)),
    ),
  );
}
