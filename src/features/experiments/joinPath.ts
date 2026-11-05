/** Joins path segments with `/`, collapsing duplicate separators at the seams. */
export function joinPath(base: string, ...segments: string[]): string {
  return segments.reduce(
    (acc, segment) =>
      `${acc.replace(/[\\/]+$/, "")}/${segment.replace(/^[\\/]+/, "")}`,
    base,
  );
}
