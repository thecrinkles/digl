import { test } from 'node:test';
import assert from 'node:assert/strict';
import { digl, type Edge } from '../../src/index.ts';
import { score } from '../../src/score.ts';

const edges: Edge[] = [
  { source: '1', target: '2' },
  { source: '2', target: '3' },
  { source: '2', target: '4' },
  { source: '1', target: '4' },
  { source: '4', target: '1' },
];

test('Cyclic graph', () => {
  const result = digl(edges)[0];
  assert.deepEqual(result, [['1'], ['2', null, null], ['3', '4']]);
  assert.equal(score(result, edges), 0);
});
