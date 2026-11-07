import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digl, type Edge } from '../../src/index.ts';
import { score } from '../../src/score.ts';

// A chain of k diamonds has 2^k paths; v2 walked every one of them.
function diamonds(k: number): Edge[] {
  return Array.from({ length: k }, (_, i) => [
    { source: `n${i}`, target: `l${i}` },
    { source: `n${i}`, target: `r${i}` },
    { source: `l${i}`, target: `n${i + 1}` },
    { source: `r${i}`, target: `n${i + 1}` },
  ]).flat();
}

// Seeded pseudo-random graph: includes cycles, self-loops and several
// disconnected graphs.
function random(seed: number, nodes: number, edges: number): Edge[] {
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: edges }, () => ({
    source: String(Math.floor(rand() * nodes)),
    target: String(Math.floor(rand() * nodes)),
  }));
}

test('Large graph - chain of 30 diamonds', () => {
  const edges = diamonds(30);
  const [layout] = digl(edges);
  assert.equal(layout.length, 61);
  assert.equal(score(layout, edges), 0);
});

for (const seed of [1, 2, 3, 4, 5]) {
  test(`Random graph ${seed} - valid layout`, () => {
    const edges = random(seed, 40, 60);
    const layouts = digl(edges);

    // every node exactly once
    const slots = layouts.flat(2);
    const placed = slots.filter((slot) => slot !== null).sort();
    const nodes = [...new Set(edges.flatMap((e) => [e.source, e.target]))];
    assert.deepEqual(placed, nodes.sort());

    // one placeholder in every rank an edge passes through
    const rankOf = new Map<string, number>();
    for (const layout of layouts)
      layout.forEach((rank, r) =>
        rank.forEach((n) => n !== null && rankOf.set(n, r)),
      );
    const passing = edges.reduce(
      (sum, e) =>
        sum +
        Math.max(
          0,
          Math.abs(rankOf.get(e.source)! - rankOf.get(e.target)!) - 1,
        ),
      0,
    );
    assert.equal(slots.filter((slot) => slot === null).length, passing);

    // no empty ranks, and no edge between two nodes of the same rank
    for (const layout of layouts) {
      for (const rank of layout) {
        assert.ok(rank.length > 0);
        const inRank = edges.filter(
          (e) =>
            e.source !== e.target &&
            rank.includes(e.source) &&
            rank.includes(e.target),
        );
        assert.deepEqual(inRank, []);
      }
    }
  });
}
