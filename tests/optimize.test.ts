import { test } from 'node:test';
import assert from 'node:assert/strict';
import { optimize } from '../src/optimize.ts';
import { score } from '../src/score.ts';
import type { Edge, Rank } from '../src/index.ts';

const ranks: Rank[] = [
  ['1.1', '1.2', '1.3'],
  ['2.1', '2.2', '2.3'],
];

test('Optimize - no edges', () => {
  const result = optimize(ranks, []);
  assert.deepEqual(result, [
    ['1.1', '1.2', '1.3'],
    ['2.1', '2.2', '2.3'],
  ]);
  assert.equal(score(result, []), score(ranks, []));
});

test('Optimize - crossing edge r1 -> r2', () => {
  const edges: Edge[] = [
    { source: '1.1', target: '2.3' },
    { source: '1.2', target: '2.2' },
  ];
  const result = optimize(ranks, edges);
  assert.deepEqual(result, [
    ['1.2', '1.3', '1.1'],
    ['2.2', '2.3', '2.1'],
  ]);
  assert.ok(score(result, edges) <= score(ranks, edges));
});

test('Optimize - crossing edge r2 -> r1', () => {
  const edges: Edge[] = [
    { source: '2.1', target: '1.3' },
    { source: '2.2', target: '1.2' },
  ];
  const result = optimize(ranks, edges);
  assert.deepEqual(result, [
    ['1.2', '1.3', '1.1'],
    ['2.2', '2.3', '2.1'],
  ]);
  assert.ok(score(result, edges) <= score(ranks, edges));
});

test('Optimize - crossing edge r1 -> r2 & r2 -> r1', () => {
  const edges: Edge[] = [
    { source: '1.1', target: '2.1' },
    { source: '2.2', target: '1.2' },
    { source: '1.1', target: '2.3' },
    { source: '2.3', target: '1.3' },
  ];
  const result = optimize(ranks, edges);
  assert.deepEqual(result, [
    ['1.2', '1.1', '1.3'],
    ['2.2', '2.1', '2.3'],
  ]);
  assert.ok(score(result, edges) <= score(ranks, edges));
});

test('Optimize - unoptimized same score', () => {
  const edges: Edge[] = [
    { source: '1.1', target: '2.1' },
    { source: '1.1', target: '2.2' },
    { source: '1.2', target: '2.1' },
    { source: '1.2', target: '2.2' },
  ];
  const ranks: Rank[] = [
    ['1.1', '1.2'],
    ['2.1', '2.2'],
  ];
  const result = optimize(ranks, edges);
  assert.deepEqual(result, [
    ['1.1', '1.2'],
    ['2.1', '2.2'],
  ]);

  assert.ok(score(result, edges) <= score(ranks, edges));
});

test('Optimize - multiple iterations', () => {
  const edges: Edge[] = [
    { source: '1.1', target: '2.2' },
    { source: '1.2', target: '2.1' },
    { source: '2.1', target: '3.1' },
    { source: '2.2', target: '3.2' },
    { source: '3.1', target: '4.2' },
    { source: '3.2', target: '4.1' },
  ];
  const ranks: Rank[] = [
    ['1.1', '1.2'],
    ['2.1', '2.2'],
    ['3.1', '3.2'],
    ['4.1', '4.2'],
  ];

  const result = optimize(ranks, edges);
  assert.deepEqual(result, [
    ['1.1', '1.2'],
    ['2.2', '2.1'],
    ['3.2', '3.1'],
    ['4.1', '4.2'],
  ]);

  assert.ok(score(result, edges) <= score(ranks, edges));
});

// v2 miscounted crossings once two ranks held more than 10 nodes
test('Optimize - wide ranks reach zero crossings', () => {
  const n = 20;
  const ranks: Rank[] = [
    Array.from({ length: n }, (_, i) => `m${i}`),
    Array.from({ length: n }, (_, i) => `t${i}`),
  ];
  const edges: Edge[] = ranks[0].map((m, i) => ({
    source: m,
    target: `t${(i * 7) % n}`,
  }));
  assert.ok(score(ranks, edges) > 0);
  assert.equal(score(optimize(ranks, edges), edges), 0);
});

test('Optimize - does not mutate its input', () => {
  const input: Rank[] = [
    ['1.1', '1.2'],
    ['2.1', '2.2'],
  ];
  optimize(input, [
    { source: '1.1', target: '2.2' },
    { source: '1.2', target: '2.1' },
  ]);
  assert.deepEqual(input, [
    ['1.1', '1.2'],
    ['2.1', '2.2'],
  ]);
});
