// Plotly's Spectral_r colorscale, ordered from 0 to 1.
export const spectralReversed = [
  "#5e4fa2",
  "#3288bd",
  "#66c2a5",
  "#abdda4",
  "#e6f598",
  "#ffffbf",
  "#fee08b",
  "#fdae61",
  "#f46d43",
  "#d53e4f",
  "#9e0142",
] as const;

export const wsafMissingColor = "var(--mantine-color-gray-2)";

export const wsafGradient = `linear-gradient(to right, ${spectralReversed.join(", ")})`;

export function wsafColor(value: number | null): string {
  if (value === null) return wsafMissingColor;

  const position = value * (spectralReversed.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.min(lowerIndex + 1, spectralReversed.length - 1);
  const fraction = position - lowerIndex;
  const lower = spectralReversed[lowerIndex];
  const upper = spectralReversed[upperIndex];
  const channels = [1, 3, 5].map((offset) => {
    const start = parseInt(lower.slice(offset, offset + 2), 16);
    const end = parseInt(upper.slice(offset, offset + 2), 16);
    return Math.round(start + (end - start) * fraction)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}
