import { score } from '../src/score';
import type { Edge, Rank } from '../src';

const ranks: Rank[] = [
  ['1.1', '1.2', '1.3'],
  ['2.1', '2.2', '2.3'],
];

test('Score - no suitable edges', () => {
  expect(score(ranks, [])).toBe(0);
});

test('Score - edges within a rank are ignored', () => {
  const edges: Edge[] = [
    { source: '1.1', target: '1.3' },
    { source: '2.3', target: '2.1' },
  ];
  expect(score(ranks, edges)).toBe(0);
});

test('Score - edges to unknown nodes are ignored', () => {
  const edges: Edge[] = [
    { source: '1.1', target: 'x' },
    { source: '1.2', target: '2.1' },
  ];
  expect(score(ranks, edges)).toBe(0);
});

test('Score - crossing edge r1 -> r2', () => {
  const edges: Edge[] = [
    { source: '1.1', target: '2.3' },
    { source: '1.2', target: '2.2' },
  ];
  expect(score(ranks, edges)).toBe(1);
});

test('Score - crossing edge r2 -> r1', () => {
  const edges: Edge[] = [
    { source: '2.1', target: '1.3' },
    { source: '2.2', target: '1.2' },
  ];
  expect(score(ranks, edges)).toBe(1);
});

test('Score - crossing edge r1 -> r2 & r2 -> r1', () => {
  const edges: Edge[] = [
    { source: '1.1', target: '2.1' },
    { source: '2.2', target: '1.2' },
    { source: '1.1', target: '2.3' },
    { source: '2.3', target: '1.3' },
  ];
  expect(score(ranks, edges)).toBe(1);
});

test('Score - edges sharing a node do not cross', () => {
  const edges: Edge[] = [
    { source: '1.1', target: '2.1' },
    { source: '1.1', target: '2.3' },
  ];
  expect(score(ranks, edges)).toBe(0);
});

test('Score - crossing edges skipping a rank', () => {
  const edges: Edge[] = [
    { source: 'a', target: 'z' },
    { source: 'b', target: 'y' },
  ];
  expect(score([['a', 'b'], ['m'], ['y', 'z']], edges)).toBe(1);
});

// v2 sorted positions as strings, so 10 sorted before 9
test('Score - ranks with more than 10 nodes', () => {
  const wide: Rank[] = [
    Array.from({ length: 10 }, (_, i) => `a${i}`),
    ['b0', 'b1', 'b2'],
  ];
  const parallel: Edge[] = [
    { source: 'a1', target: 'b1' },
    { source: 'a2', target: 'b2' },
  ];
  const crossing: Edge[] = [
    { source: 'a1', target: 'b2' },
    { source: 'a2', target: 'b1' },
  ];
  expect(score(wide, parallel)).toBe(0);
  expect(score(wide, crossing)).toBe(1);
});
