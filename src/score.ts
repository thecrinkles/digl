// Number of edge pairs that cross. Two edges between the same pair of ranks
// cross when their ends are in opposite order on those ranks. Edges within a
// rank, or to nodes outside these ranks, are ignored.
export function score<T>(
  ranks: T[][],
  edges: readonly { source: T; target: T }[],
): number {
  const at = new Map<T, [rank: number, pos: number]>();
  ranks.forEach((rank, r) => rank.forEach((n, i) => at.set(n, [r, i])));

  const lines = new Map<string, [top: number, bottom: number][]>();
  for (const { source, target } of edges) {
    const a = at.get(source);
    const b = at.get(target);
    if (!a || !b || a[0] === b[0]) continue;
    const [top, bottom] = a[0] < b[0] ? [a, b] : [b, a];
    const key = `${top[0]}:${bottom[0]}`;
    lines.set(key, [...(lines.get(key) ?? []), [top[1], bottom[1]]]);
  }

  let crossings = 0;
  for (const l of lines.values())
    for (let i = 0; i < l.length; i++)
      for (let j = i + 1; j < l.length; j++)
        if ((l[i][0] - l[j][0]) * (l[i][1] - l[j][1]) < 0) crossings++;
  return crossings;
}
