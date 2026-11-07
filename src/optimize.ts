import { score } from './score';
import type { Edge, Rank } from './types';

// Greedy crossing reduction: swap neighbours within a rank and keep the swap
// when the score does not get worse. Equal-score swaps can escape a plateau,
// so one pass without improvement is allowed before stopping.
// ponytail: full rescore per swap; score incrementally if large graphs matter.
export function optimize(ranks: Rank[], edges: readonly Edge[]): Rank[] {
  const result = ranks.map((rank) => [...rank]);
  let current = score(result, edges);
  let sidewaysPasses = 1;

  while (current > 0) {
    const before = current;
    for (const rank of result) {
      for (let i = 0; i < rank.length - 1; i++) {
        [rank[i], rank[i + 1]] = [rank[i + 1], rank[i]];
        const next = score(result, edges);
        if (next <= current) current = next;
        else [rank[i], rank[i + 1]] = [rank[i + 1], rank[i]];
      }
    }
    if (current === before && sidewaysPasses-- === 0) break;
  }

  return result;
}
