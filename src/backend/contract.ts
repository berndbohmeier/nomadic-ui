/** Contents of `metadata/settings.json`; every field may be missing. */
export interface ExperimentSettings {
  startDate?: string | null;
  caller?: string | null;
  fastqDir?: string | null;
  metadataCsv?: string | null;
  regionBed?: string | null;
  referenceName?: string | null;
  nBarcodes?: number | null;
  nRegions?: number | null;
  minknowDir?: string | null;
}

export interface ExperimentInfo {
  /** Full path to the experiment folder. */
  path: string;
  /** Folder name. */
  name: string;
  settings: ExperimentSettings | null;
  /** Names of the files directly inside the experiment folder. */
  files: string[];
}

export interface BarcodeMetadata {
  barcode: string;
  /** Empty when the metadata has no sample id for the barcode. */
  sampleId: string;
  sampleType: "sample" | "positive" | "negative";
}

/** One row of `summary.read_mapping.csv`. */
export interface ReadMappingCounts {
  barcode: string;
  n_total: number;
  n_mapped: number;
  n_primary: number;
  n_secondary: number;
  n_supplementary: number;
  n_unmapped: number;
}

/** Read counts combined with sample metadata (done in the UI). */
export type ReadMappingDatum = ReadMappingCounts & BarcodeMetadata;

/** One row of `summary.region_coverage.csv`. */
export interface RegionCoverageRow {
  barcode: string;
  chrom: string;
  start: number;
  length: number;
  end: number;
  mean_cov: number;
  name: string;
  cov_gr100_per: number;
  total_cov: number;
  cov_gr100: number;
  n_reads: number;
}

export const aaCallStatuses = [
  "failed",
  "unphased",
  "absent",
  "wt",
  "mixed",
  "mutant",
] as const;
export type AaCallStatus = (typeof aaCallStatuses)[number];

export interface AaChangeRow {
  barcode: string;
  gene: string;
  aa_change: string;
  aa_call: AaCallStatus;
  aa_depth: number | null;
  aa_wsaf: number | null;
}

export interface Backend {
  experiments: {
    /** Loads an experiment from its full folder path (any location). */
    load(path: string): Promise<ExperimentInfo>;
    /** Opens the experiment in a new application window. */
    openInNewWindow(path: string, title: string): Promise<void>;
    /** Rows of the read mapping file only; no sample metadata. */
    loadReadMapping(path: string): Promise<ReadMappingCounts[]>;
    /** Amplicon coverage rows; unclassified rows are excluded. */
    loadRegionCoverage(path: string): Promise<RegionCoverageRow[]>;
    /** Normalized calls from the selected current or legacy amino-acid file. */
    loadAaChanges(path: string, file: string): Promise<AaChangeRow[]>;
    /** Samples of the experiment's metadata CSV, in file order. */
    loadMetadata(path: string): Promise<BarcodeMetadata[]>;
  };
  workspace: {
    /** Lets the user choose a folder; resolves to null when cancelled. */
    pickFolder(): Promise<string | null>;
    validate(path: string): Promise<boolean>;
    /** Names of the experiment folders inside `<path>/results`. */
    listExperiments(path: string): Promise<string[]>;
  };
}
