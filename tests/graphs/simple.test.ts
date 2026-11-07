import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digl, type Edge } from '../../src/index.ts';
import { score } from '../../src/score.ts';

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

test('Simple graph - empty edges', () => {
  const result = digl([]);
  assert.deepEqual(result, []);
});

test('Simple graph', () => {
  const result = digl(edges)[0];
  assert.deepEqual(result, [
    ['1'],
    ['2'],
    ['3'],
    ['4', '7'],
    ['8', '9'],
    ['5', '10'],
    ['6'],
  ]);

  assert.equal(score(result, edges), 0);
});

test('Simple graph - solitary nodes', () => {
  const result = digl(edges, { solitary: ['8'] })[0];

  assert.deepEqual(result, [
    ['1'],
    ['2'],
    ['3'],
    ['4', '7'],
    ['8'],
    ['9'],
    ['5', '10'],
    ['6'],
  ]);

  assert.equal(score(result, edges), 0);
});

test('Simple graph - solitary node alone in its rank', () => {
  const result = digl([{ source: '1', target: '2' }], { solitary: ['1'] });
  assert.deepEqual(result, [[['1'], ['2']]]);
});

test('Simple graph - solitary nodes in the same rank', () => {
  const result = digl(
    [
      { source: 'r', target: 'a' },
      { source: 'r', target: 'b' },
      { source: 'r', target: 'c' },
    ],
    { solitary: ['a', 'b'] },
  );
  assert.deepEqual(result, [[['r'], ['a'], ['b'], ['c']]]);
});

test('Simple graph - readonly input and empty config', () => {
  const input = [{ source: '1', target: '2' }] as const;
  assert.deepEqual(digl(input, {}), [[['1'], ['2']]]);
});
