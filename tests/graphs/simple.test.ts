import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digl, type Edge } from '../../src/index.ts';

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
    [null, '3'],
    ['4', null, '7'],
    ['8', null, null, '9', null],
    ['5', null, '10', null],
    ['6'],
  ]);
});

// https://github.com/thecrinkles/digl/issues/15
test('Simple graph - placeholder for an edge skipping a rank', () => {
  const result = digl([
    { source: '1', target: '2' },
    { source: '1', target: '3' },
    { source: '2', target: '3' },
  ]);
  assert.deepEqual(result, [[['1'], ['2', null], ['3']]]);
});

test('Simple graph - readonly input', () => {
  const input = [{ source: '1', target: '2' }] as const;
  assert.deepEqual(digl(input), [[['1'], ['2']]]);
});
