import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../../../app/context";
import type { BarcodeMetadata } from "../../../backend/contract";

interface BarcodeSelection {
  metadata: BarcodeMetadata[] | undefined;
  isPending: boolean;
  error: unknown;
  refetch: () => void;
  /** Ordered barcodes shown in the views; all metadata barcodes until changed. */
  selected: string[];
  setSelected: (barcodes: string[]) => void;
}

const BarcodeSelectionContext = createContext<BarcodeSelection | null>(null);

interface ProviderProps {
  experimentPath: string;
  children: ReactNode;
}

/** Selection lives in component state; remount (key by path) per experiment. */
export function BarcodeSelectionProvider({
  experimentPath,
  children,
}: ProviderProps) {
  const backend = useBackend();
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ["experiment", experimentPath, "metadata"],
    queryFn: () => backend.experiments.loadMetadata(experimentPath),
  });
  const [custom, setSelected] = useState<string[] | null>(null);

  const value = useMemo<BarcodeSelection>(() => {
    const known = new Set(data?.map((row) => row.barcode));
    return {
      metadata: data,
      isPending,
      error,
      refetch: () => void refetch(),
      selected:
        custom?.filter((barcode) => known.has(barcode)) ??
        data?.map((row) => row.barcode) ??
        [],
      setSelected,
    };
  }, [data, error, isPending, refetch, custom]);

  return (
    <BarcodeSelectionContext.Provider value={value}>
      {children}
    </BarcodeSelectionContext.Provider>
  );
}

export function useBarcodeSelection(): BarcodeSelection {
  const value = useContext(BarcodeSelectionContext);
  if (value === null) {
    throw new Error("useBarcodeSelection needs a BarcodeSelectionProvider");
  }
  return value;
}
