import type { Backend } from "../contract";

export const MOCK_WORKSPACE_PATH = "/mock/workspaces/run-001";

export function createMockBackend(): Backend {
  const validPaths = new Set([MOCK_WORKSPACE_PATH]);
  return {
    workspace: {
      pickFolder: () => Promise.resolve(MOCK_WORKSPACE_PATH),
      validate: (path) => Promise.resolve(validPaths.has(path)),
    },
  };
}
