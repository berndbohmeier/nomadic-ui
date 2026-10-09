import { useLocalStorage } from "@mantine/hooks";
import { useBackend } from "../../app/context";

const MAX_HISTORY = 10;

export function useWorkspace() {
  const backend = useBackend();
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
    if (!(await backend.workspace.validate(path))) return false;
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
