import { Config, Edge, Rank, Node, Graph, Path } from './types';
import { optimize } from './optimize';

// Depth-First-Search (DFS) for an Directed Graph (cycles in paths are discarded)
function getPathByNode(
  nodeId: string,
  edges: Edge[],
  path: Path = [],
  paths: Path[] = [],
): Path[] {
  const children = edges.filter((e) => e.source === nodeId);

  // first check avoids cyclic paths
  if (path.includes(nodeId)) paths.push(path);
  else if (!children || children.length === 0) paths.push([...path, nodeId]);
  else
    children.map((c) =>
      getPathByNode(c.target, edges, [...path, nodeId], paths),
    );

  return paths.sort();
}

// Funtction to get all nodes based on the edges
function getNodesFromEdges(edges: Edge[]): Node[] {
  const nodes: Node[] = [];
  edges.forEach(({ source, target }) => {
    if (!nodes.find((n) => n.id === source)) nodes.push({ id: source });
    if (!nodes.find((n) => n.id === target)) nodes.push({ id: target });
  });
  return nodes;
}

// Function to get all paths grouped by source node
function getPaths(edges: Edge[], nodes: Node[]): Path[][] {
  const _paths: Path[][] = [];
  const _nodes = nodes.map((n) => n.id);

  function determinePaths(sources: string[]) {
    sources.forEach((node) => _paths.push(getPathByNode(node, edges)));
    const _usedNodes = Array.from(new Set([..._paths.flat().flat()]));
    if (_usedNodes.length < nodes.length)
      determinePaths([diff(_nodes, _usedNodes)[0]]);
  }

  const _sources = _nodes.filter((n) => !edges.find((e) => e.target === n));
  determinePaths(_sources);

  return _paths;
}

// Union of two arrays
function intersect<T>(a: T[], b: T[]): T[] {
  const setA = new Set([...a]);
  const setB = new Set([...b]);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  return Array.from(intersection);
}

// Union of two arrays
function diff<T>(a: T[], b: T[]): T[] {
  const setA = new Set([...a]);
  const setB = new Set([...b]);
  const diff = new Set([...setA].filter((x) => !setB.has(x)));
  return Array.from(diff);
}

// Ranks nodes in a rank, based on the longest path from the source
function getRanking(nodes: Node[], paths: string[][]): Rank[] {
  const ranks: Rank[] = new Array<Rank>(paths[0].length);

  nodes.forEach((n) => {
    const _paths = paths.filter((p) => p.includes(n.id));
    if (!_paths.length) return;

    const index = _paths.reduce((acc, path) => {
      const i = path.findIndex((p) => p === n.id);
      return i > acc ? i : acc;
    }, 0);

    ranks[index] = [...(ranks[index] || []), n.id];
  });
  return ranks;
}

// Aggregated function to determine the starting ranks for each node
function applySolitaryConfig(ranks: Rank[], config: Config) {
  // Find out if there are any nodes marked as "solitary"
  // https://github.com/kevtiq/digl/issues/8
  // These nodes are to be scheduled in a rank of their own
  // if (!config.solitary) return ranks;
  const _ranks: Rank[] = [];
  ranks.forEach((rank) => {
    const solitaries = rank.filter((n) =>
      config.solitary.includes(n as string),
    );
    if (!solitaries.length) _ranks.push(rank);
    else {
      _ranks.push(solitaries);
      _ranks.push(rank.filter((n) => !solitaries.includes(n)));
    }
  });

  return _ranks;
}

// Recursive function to find overlap in graphs and merge ranks whenever
// overlap exists
function merge(paths: Path[][], nodes: Node[]): Path[][] {
  const _paths: Path[][] = [];
  const _merged: number[] = [];

  for (let i = 0; i < paths.length; i++) {
    // If i was already merged in a previous iteration, skip it
    if (_merged.includes(i)) continue;
    const _mergedpaths = [...paths[i]];
    for (let j = i + 1; j < paths.length; j++) {
      // If overlap is found, add it to the graph
      if (intersect<string>(paths[i].flat(), paths[j].flat()).length) {
        _mergedpaths.push(...paths[j]);
        _merged.push(j);
      }
    }

    _paths.push(_mergedpaths);
  }

  if (_paths.length === paths.length) return _paths;
  return merge(_paths, nodes);
}

// The entire heuristic for determining the auto layout of a graph
export function digl(edges: Edge[], config: Config = { solitary: [] }): Graph {
  const _nodes = getNodesFromEdges(edges);
  if (!_nodes.length) return [];

  // Find all source nodes and corresponding paths
  const _paths = getPaths(edges, _nodes);

  // Get the unoptimized ranking per starting node
  const _graph = merge(_paths, _nodes).map((p) => getRanking(_nodes, p));

  // Apply solitary nodes & optimize
  return _graph.map((ranks) => {
    const _ranks = config.solitary ? applySolitaryConfig(ranks, config) : ranks;
    return optimize(_ranks, edges);
  });
}
