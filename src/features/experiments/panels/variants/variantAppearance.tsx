import type { AaCallStatus } from "../../../../backend/contract";

export type DisplayStatus = AaCallStatus | "noCall";
const mutationColor = "#cf729a";
export const appearance: Record<
  DisplayStatus,
  { color: string; symbol: string }
> = {
  mutant: { color: mutationColor, symbol: "●" },
  mixed: { color: mutationColor, symbol: "◐" },
  absent: { color: "#ffffff", symbol: "−" },
  wt: { color: "blue.4", symbol: "○" },
  unphased: { color: "gray.2", symbol: "~" },
  failed: { color: "gray.2", symbol: "×" },
  noCall: { color: "gray.2", symbol: "?" },
};

export const cellColor = (color: string) =>
  color.startsWith("#")
    ? color
    : `var(--mantine-color-${color.replace(".", "-")})`;

export const symbolColor = "var(--mantine-color-gray-9)";

export function CallSymbol({ status }: { status: DisplayStatus }) {
  if (status === "wt" || status === "mixed" || status === "mutant") {
    return (
      <g data-symbol={status} pointerEvents="none">
        <circle r={6} fill={status === "mutant" ? "black" : "white"} />
        {status === "mixed" && (
          <path d="M 0 -6 A 6 6 0 0 1 0 6 Z" fill="black" />
        )}
      </g>
    );
  }
  return (
    <text
      y={1}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={16}
      fill={symbolColor}
      pointerEvents="none"
    >
      {appearance[status].symbol}
    </text>
  );
}
