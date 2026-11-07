export type Edge = { source: string; target: string };

/**
 * One row of a layout, in display order. `null` is a placeholder for an edge
 * that passes through this rank.
 */
export type Rank = (string | null)[];

/** One connected graph, as ranks from its start nodes downwards. */
export type Layout = Rank[];
