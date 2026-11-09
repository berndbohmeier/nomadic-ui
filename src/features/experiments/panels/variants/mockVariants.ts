import { aaCallStatuses } from "../../../../backend/contract";
import type { AaCallStatus as VariantStatus } from "../../../../backend/contract";
import type { Variant, VariantCall, VariantSample } from "./variantData";

export const variantStatuses = aaCallStatuses;

// Illustrative calls only: no clinical interpretation or inferred thresholds.
export const mockVariants: Variant[] = [
  { id: "geneA-A123G", gene: "geneA", change: "A123G" },
  { id: "geneA-L210F", gene: "geneA", change: "L210F" },
  { id: "geneA-S315T", gene: "geneA", change: "S315T" },
  { id: "geneB-D94G", gene: "geneB", change: "D94G" },
  { id: "geneB-H445Y", gene: "geneB", change: "H445Y" },
  { id: "geneC-M184V", gene: "geneC", change: "M184V" },
  { id: "geneC-K103N", gene: "geneC", change: "K103N" },
  { id: "geneC-G190A", gene: "geneC", change: "G190A" },
];
const patterns: VariantStatus[][] = [
  ["mutant", "wt", "absent", "mixed", "absent", "absent", "unphased", "failed"],
  ["wt", "mutant", "absent", "absent", "mixed", "absent", "absent", "absent"],
  [
    "mixed",
    "absent",
    "mutant",
    "unphased",
    "absent",
    "mutant",
    "absent",
    "absent",
  ],
  [
    "failed",
    "failed",
    "failed",
    "absent",
    "absent",
    "mixed",
    "absent",
    "absent",
  ],
];
export const mockVariantSamples: VariantSample[] = Array.from(
  { length: 12 },
  (_, i) => ({
    barcode: `barcode${String(i + 1).padStart(2, "0")}`,
    sampleId: `Sample_${String(i + 1).padStart(2, "0")}`,
    sampleType: i === 0 ? "positive" : i === 1 ? "negative" : "sample",
    calls: Object.fromEntries(
      mockVariants.map((v, j) => {
        const status = patterns[i % patterns.length][j];
        const wsaf =
          status === "failed" || status === "unphased"
            ? null
            : status === "mutant"
              ? 0.98
              : status === "mixed"
                ? 0.37
                : 0;
        return [
          v.id,
          {
            status,
            wsaf,
            depth: status === "failed" ? 0 : 320 + i * 83 + j * 27,
          } satisfies VariantCall,
        ];
      }),
    ),
  }),
);
