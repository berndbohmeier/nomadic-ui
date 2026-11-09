import type {
  AaCallStatus,
  AaChangeRow,
  BarcodeMetadata,
} from "../../../../backend/contract";

export interface Variant {
  id: string;
  gene: string;
  change: string;
}

export interface VariantCall {
  status: AaCallStatus;
  wsaf: number | null;
  depth: number | null;
}

export interface VariantSample extends BarcodeMetadata {
  calls: Partial<Record<string, VariantCall>>;
}

export function variantMatrix(
  rows: AaChangeRow[],
  metadata: BarcodeMetadata[],
  selected: string[],
): { variants: Variant[]; samples: VariantSample[] } {
  const variants = new Map<string, Variant>();
  const calls = new Map<string, Record<string, VariantCall>>();
  for (const row of rows) {
    if (row.barcode.trim().toLowerCase() === "unclassified") continue;
    const id = JSON.stringify([row.gene, row.aa_change]);
    variants.set(id, { id, gene: row.gene, change: row.aa_change });
    const barcodeCalls = calls.get(row.barcode) ?? {};
    barcodeCalls[id] = {
      status: row.aa_call,
      wsaf: row.aa_wsaf,
      depth: row.aa_depth,
    };
    calls.set(row.barcode, barcodeCalls);
  }
  const samplesByBarcode = new Map(metadata.map((row) => [row.barcode, row]));
  const samples = selected.flatMap((barcode) => {
    if (barcode.trim().toLowerCase() === "unclassified") return [];
    const sample = samplesByBarcode.get(barcode);
    return sample
      ? [
          {
            ...sample,
            sampleId: sample.sampleId || barcode,
            calls: calls.get(barcode) ?? {},
          },
        ]
      : [];
  });
  return { variants: [...variants.values()], samples };
}
