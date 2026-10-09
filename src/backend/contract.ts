export interface Backend {
  workspace: {
    /** Lets the user choose a folder; resolves to null when cancelled. */
    pickFolder(): Promise<string | null>;
    validate(path: string): Promise<boolean>;
  };
}
