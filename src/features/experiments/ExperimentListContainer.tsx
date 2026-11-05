import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../../app/context";
import { useWorkspace } from "../workspace/useWorkspace";
import { ExperimentList } from "./ExperimentList";

export function ExperimentListContainer() {
  const backend = useBackend();
  const { activeWorkspace } = useWorkspace();
  const { data, isPending, isError } = useQuery({
    queryKey: ["experiments", activeWorkspace],
    queryFn: () => backend.workspace.listExperiments(activeWorkspace!),
    enabled: activeWorkspace !== null,
  });

  return (
    <ExperimentList
      experiments={data ?? []}
      loading={activeWorkspace !== null && isPending}
      error={isError}
      hasWorkspace={activeWorkspace !== null}
    />
  );
}
