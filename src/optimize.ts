import { score } from './score.ts';

// Greedy crossing reduction: swap neighbours within a rank and keep the swap
// when it does not add crossings. Equal-score swaps can escape a plateau, so
// one pass without improvement is allowed before stopping.
// Only edges between neighbouring ranks are considered; digl splits longer
// edges with placeholders first.
export function optimize<T>(
  ranks: T[][],
  edges: readonly { source: T; target: T }[],
): T[][] {
  const result = ranks.map((rank) => [...rank]);
  const rankOf = new Map<T, number>();
  const pos = new Map<T, number>();
  result.forEach((rank, r) =>
    rank.forEach((n, i) => {
      rankOf.set(n, r);
      pos.set(n, i);
    }),
  );

  // Neighbours of every slot in the rank above and the rank below
  const up = new Map<T, T[]>();
  const down = new Map<T, T[]>();
  const link = (side: Map<T, T[]>, from: T, to: T) => {
    const list = side.get(from);
    if (list) list.push(to);
    else side.set(from, [to]);
  };
  for (const { source, target } of edges) {
    const rs = rankOf.get(source);
    const rt = rankOf.get(target);
    if (rs === undefined || rt === undefined || Math.abs(rs - rt) !== 1)
      continue;
    const [top, bottom] = rs < rt ? [source, target] : [target, source];
    link(down, top, bottom);
    link(up, bottom, top);
  }

  // Change in crossings when `a` swaps with its right-hand neighbour `b`.
  // Only pairs of an edge of `a` and an edge of `b` to the same rank change.
  const delta = (a: T, b: T) => {
    let change = 0;
    for (const side of [up, down])
      for (const x of side.get(a) ?? [])
        for (const y of side.get(b) ?? [])
          change += Math.sign(pos.get(y)! - pos.get(x)!);
    return change;
  };

  let current = score(result, edges);
  let sidewaysPasses = 1;
  while (current > 0) {
    const before = current;
    for (const rank of result) {
      for (let i = 0; i < rank.length - 1; i++) {
        const a = rank[i];
        const b = rank[i + 1];
        const change = delta(a, b);
        if (change > 0) continue;
        rank[i] = b;
        rank[i + 1] = a;
        pos.set(b, i);
        pos.set(a, i + 1);
        current += change;
      }
    }
    if (current === before && sidewaysPasses-- === 0) break;
  }

  return result;
}
