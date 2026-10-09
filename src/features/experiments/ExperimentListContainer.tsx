import { useEffect, useState } from "react";
import { useBackend } from "../../app/context";
import { useWorkspace } from "../workspace/useWorkspace";
import { ExperimentList } from "./ExperimentList";

interface Result {
  workspace: string;
  experiments: string[] | null;
}

export function ExperimentListContainer() {
  const backend = useBackend();
  const { activeWorkspace } = useWorkspace();
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!activeWorkspace) return;
    let cancelled = false;
    backend.workspace
      .listExperiments(activeWorkspace)
      .then((experiments) => ({ workspace: activeWorkspace, experiments }))
      .catch(() => ({ workspace: activeWorkspace, experiments: null }))
      .then((r) => !cancelled && setResult(r));
    return () => {
      cancelled = true;
    };
  }, [backend, activeWorkspace]);

  const current = result?.workspace === activeWorkspace ? result : null;

  return (
    <ExperimentList
      experiments={current?.experiments ?? []}
      loading={activeWorkspace !== null && current === null}
      error={current !== null && current.experiments === null}
      hasWorkspace={activeWorkspace !== null}
    />
  );
}
