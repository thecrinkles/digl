import { digl, type Edge } from '../../src';
import { score } from '../../src/score';

test('Multiple graphs - independent', () => {
  const edges: Edge[] = [
    { source: '1', target: '2' },
    { source: '2', target: '3' },
    { source: '2', target: '4' },
    { source: '5', target: '6' },
    { source: '6', target: '7' },
    { source: '6', target: '8' },
  ];
  const result = digl(edges);

  expect(result).toEqual([
    [['1'], ['2'], ['3', '4']],
    [['5'], ['6'], ['7', '8']],
  ]);

  expect(score(result[0], edges)).toBe(0);
  expect(score(result[1], edges)).toBe(0);
});

test('Multiple graphs - simple connected', () => {
  const edges: Edge[] = [
    { source: '1', target: '2' },
    { source: '2', target: '3' },
    { source: '2', target: '4' },
    { source: '5', target: '6' },
    { source: '6', target: '7' },
    { source: '6', target: '4' },
  ];
  const result = digl(edges);

  expect(result).toEqual([
    [
      ['1', '5'],
      ['2', '6'],
      ['3', '4', '7'],
    ],
  ]);

  expect(score(result[0], edges)).toBe(0);
});

test('Multiple graphs - complex connected', () => {
  const edges: Edge[] = [
    { source: '1', target: '2' },
    { source: '2', target: '3' },
    { source: '2', target: '4' },
    { source: '5', target: '6' },
    { source: '6', target: '7' },
    { source: '6', target: '4' },
    { source: '8', target: '9' },
    { source: '9', target: '10' },
    { source: '9', target: '7' },
  ];
  const result = digl(edges);

  expect(result).toEqual([
    [
      ['1', '5', '8'],
      ['2', '6', '9'],
      ['3', '4', '7', '10'],
    ],
  ]);

  expect(score(result[0], edges)).toBe(0);
});

test('Multiple graphs - one cyclic', () => {
  const edges: Edge[] = [
    { source: '•r', target: '0' },
    { source: '•r', target: '1' },
    { source: '1', target: '2' },
    { source: '0', target: '1' },
    { source: '1', target: '0' },
    { source: '2', target: '•r' },
    { source: '3', target: '3' },
    { source: '4', target: '3' },
  ];
  const result = digl(edges);
  expect(result).toEqual([
    [['4'], ['3']],
    [['•r'], ['0'], ['1'], ['2']],
  ]);
  expect(score(result[0], edges)).toBe(0);
  expect(score(result[1], edges)).toBe(0);
});
