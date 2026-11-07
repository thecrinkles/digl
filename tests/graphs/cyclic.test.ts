import { digl, type Edge } from '../../src';
import { score } from '../../src/score';

const edges: Edge[] = [
  { source: '1', target: '2' },
  { source: '2', target: '3' },
  { source: '2', target: '4' },
  { source: '1', target: '4' },
  { source: '4', target: '1' },
];

test('Cyclic graph', () => {
  const result = digl(edges)[0];
  expect(result).toEqual([['1'], ['2'], ['3', '4']]);
  expect(score(result, edges)).toBe(0);
});
