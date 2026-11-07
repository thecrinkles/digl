import { optimize } from './optimize.ts';
import type { Config, Edge, Layout, Rank } from './types.js';

export type { Config, Edge, Layout, Rank } from './types.js';

// Lays out each connected graph in `edges` as ranks:
// 1. Depth-first search from nodes without incoming edges (then from any node
//    not reached yet), ignoring edges that close a cycle.
// 2. Rank every node by its longest path from a start node.
// 3. Give solitary nodes a rank of their own.
// 4. Reorder nodes within ranks to reduce crossing edges.
export function digl(
  edges: readonly Edge[],
  { solitary = [] }: Config = {},
): Layout[] {
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
  // ponytail: recursion depth = longest path; use an explicit stack if graphs
  // ever reach ~10k nodes deep.
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

  const layouts = new Map<string, Layout>();
  const targets = new Set(edges.map((e) => e.target));
  const sources = nodes.filter((n) => !targets.has(n));
  for (const n of [...sources, ...nodes]) {
    if (state.has(n)) continue;
    if (!layouts.has(find(n))) layouts.set(find(n), []);
    visit(n);
  }

  // Longest path, processing nodes in topological order
  const rank = new Map<string, number>(nodes.map((n) => [n, 0]));
  for (const n of finished.reverse()) {
    const r = (rank.get(n) ?? 0) + 1;
    for (const m of kept.get(n) ?? [])
      rank.set(m, Math.max(rank.get(m) ?? 0, r));
  }

  for (const n of nodes) {
    const layout = layouts.get(find(n)) ?? [];
    (layout[rank.get(n) ?? 0] ??= []).push(n);
  }

  return [...layouts.values()].map((layout) =>
    optimize(splitSolitary(layout, solitary), edges),
  );
}

// Every solitary node gets its own rank, placed before the rest of its rank.
function splitSolitary(ranks: Rank[], solitary: readonly string[]): Rank[] {
  return ranks.flatMap((rank) => {
    const alone = rank.filter((n) => solitary.includes(n)).map((n) => [n]);
    const rest = rank.filter((n) => !solitary.includes(n));
    return rest.length ? [...alone, rest] : alone;
  });
}
