import { useLocalStorage } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/core";

const MAX_HISTORY = 10;

interface WorkspaceInfo {
  valid: boolean;
  hasMetadata: boolean;
  hasBeds: boolean;
}

export async function validateWorkspace(path: string): Promise<boolean> {
  const info = await invoke<WorkspaceInfo>("validate_workspace", { path });
  return info.valid;
}

export function useWorkspace() {
  const [activeWorkspace, setActiveWorkspace] = useLocalStorage<string | null>({
    key: "nomadic-workspace-active",
    defaultValue: null,
    getInitialValueInEffect: false,
  });
  const [history, setHistory] = useLocalStorage<string[]>({
    key: "nomadic-workspace-history",
    defaultValue: [],
    getInitialValueInEffect: false,
  });

  /** Activates the workspace if valid; returns whether it was valid. */
  const selectWorkspace = async (path: string): Promise<boolean> => {
    if (!(await validateWorkspace(path))) return false;
    setActiveWorkspace(path);
    setHistory((prev) =>
      [path, ...prev.filter((p) => p !== path)].slice(0, MAX_HISTORY),
    );
    return true;
  };

  const removeFromHistory = (path: string) =>
    setHistory((prev) => prev.filter((p) => p !== path));

  return {
    activeWorkspace,
    history,
    selectWorkspace,
    removeFromHistory,
  };
}
