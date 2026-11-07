export type Edge = { source: string; target: string };

/** Node ids on one row of a layout, in display order. */
export type Rank = string[];

/** One connected graph, as ranks from its start nodes downwards. */
export type Layout = Rank[];

export type Config = {
  /** Node ids that each get a rank of their own. */
  solitary?: readonly string[];
};
