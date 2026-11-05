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

export interface Backend {
  experiments: {
    /** Loads an experiment from its full folder path (any location). */
    load(path: string): Promise<ExperimentInfo>;
  };
  workspace: {
    /** Lets the user choose a folder; resolves to null when cancelled. */
    pickFolder(): Promise<string | null>;
    validate(path: string): Promise<boolean>;
    /** Names of the experiment folders inside `<path>/results`. */
    listExperiments(path: string): Promise<string[]>;
  };
}
