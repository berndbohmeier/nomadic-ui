import type { AaCallStatus, AaChangeRow } from "../contract";
import { metadataData } from "./read-mapping";

const changes = [
  { gene: "dhfr", aa_change: "N51I" },
  { gene: "dhfr", aa_change: "S108N" },
  { gene: "crt", aa_change: "K76T" },
  { gene: "mdr1", aa_change: "N86Y" },
];
const statuses: AaCallStatus[] = [
  "wt",
  "mixed",
  "mutant",
  "failed",
  "unphased",
  "absent",
];

export const aaChangesData: AaChangeRow[] = metadataData.flatMap((sample, i) =>
  changes.map((change, j) => {
    const status = statuses[(i + j) % statuses.length];
    return {
      barcode: sample.barcode,
      ...change,
      aa_call: status,
      aa_depth: status === "failed" ? null : 200 + i * 5 + j,
      aa_wsaf:
        status === "failed" || status === "unphased"
          ? null
          : status === "mutant"
            ? 1
            : status === "mixed"
              ? 0.4
              : 0,
    };
  }),
);
