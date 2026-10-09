export interface Backend {
  workspace: {
    /** Lets the user choose a folder; resolves to null when cancelled. */
    pickFolder(): Promise<string | null>;
    validate(path: string): Promise<boolean>;
    /** Names of the experiment folders inside `<path>/results`. */
    listExperiments(path: string): Promise<string[]>;
  };
}
