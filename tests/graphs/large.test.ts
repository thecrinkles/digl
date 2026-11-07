import { digl, type Edge } from '../../src';
import { score } from '../../src/score';

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
  expect(layout).toHaveLength(61);
  expect(score(layout, edges)).toBe(0);
});

test.each([1, 2, 3, 4, 5])('Random graph %i - valid layout', (seed) => {
  const edges = random(seed, 40, 60);
  const layouts = digl(edges);

  // every node exactly once
  const placed = layouts.flat(2).sort();
  const nodes = [...new Set(edges.flatMap((e) => [e.source, e.target]))];
  expect(placed).toEqual(nodes.sort());

  // no empty ranks, and no edge between two nodes of the same rank
  for (const layout of layouts) {
    for (const rank of layout) {
      expect(rank.length).toBeGreaterThan(0);
      const inRank = edges.filter(
        (e) =>
          e.source !== e.target &&
          rank.includes(e.source) &&
          rank.includes(e.target),
      );
      expect(inRank).toEqual([]);
    }
  }
});
