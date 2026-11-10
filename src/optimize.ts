import { score } from './score.ts';

// Reorders the ranks to reduce crossing edges. Swapping neighbours alone gets
// stuck in local minima, so it runs twice: once from the given order, and once
// from the order found by barycenter sweeps. The result with the fewest
// crossings wins, preferring the given order on a tie.
// Only edges between neighbouring ranks are considered; digl splits longer
// edges with placeholders first.
export function optimize<T>(
  ranks: T[][],
  edges: readonly { source: T; target: T }[],
): T[][] {
  const rankOf = new Map<T, number>();
  ranks.forEach((rank, r) => rank.forEach((n) => rankOf.set(n, r)));

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

  // Greedy: swap neighbours within a rank and keep the swap when it does not
  // add crossings. Equal-score swaps can escape a plateau, so one pass without
  // improvement is allowed before stopping.
  const swap = (start: T[][]) => {
    const result = start.map((rank) => [...rank]);
    const pos = new Map<T, number>();
    for (const rank of result) rank.forEach((n, i) => pos.set(n, i));

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

    let crossings = score(result, edges);
    let sidewaysPasses = 1;
    while (crossings > 0) {
      const before = crossings;
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
          crossings += change;
        }
      }
      if (crossings === before && sidewaysPasses-- === 0) break;
    }
    return { ranks: result, crossings };
  };

  // Barycenter sweeps: sort every rank by the average position of its
  // neighbours in the previous rank, alternating downwards and upwards.
  // A slot without neighbours there uses its own position. Returns the order
  // with the fewest crossings seen. 8 sweeps gave nearly all of the gain on
  // random graphs; more barely helped.
  const sweep = (start: T[][]) => {
    const order = start.map((rank) => [...rank]);
    let best = start;
    let fewest = score(order, edges);
    for (let i = 0; i < 8 && fewest > 0; i++) {
      const downwards = i % 2 === 0;
      const side = downwards ? up : down;
      const pos = new Map<T, number>();
      const walk = downwards ? order : [...order].reverse();
      walk.forEach((rank, step) => {
        if (step > 0) {
          const key = new Map<T, number>();
          rank.forEach((n, j) => {
            const ns = side.get(n);
            key.set(
              n,
              ns ? ns.reduce((sum, m) => sum + pos.get(m)!, 0) / ns.length : j,
            );
          });
          rank.sort((a, b) => key.get(a)! - key.get(b)!);
        }
        rank.forEach((n, j) => pos.set(n, j));
      });
      const crossings = score(order, edges);
      if (crossings < fewest) {
        fewest = crossings;
        best = order.map((rank) => [...rank]);
      }
    }
    return best;
  };

  const given = swap(ranks);
  if (given.crossings === 0) return given.ranks;
  const swept = swap(sweep(ranks));
  return swept.crossings < given.crossings ? swept.ranks : given.ranks;
}
