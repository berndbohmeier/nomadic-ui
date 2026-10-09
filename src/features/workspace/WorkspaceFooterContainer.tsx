import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBackend } from "../../app/context";
import { useWorkspace } from "./useWorkspace";
import { WorkspaceFooter } from "./WorkspaceFooter";

export function WorkspaceFooterContainer() {
  const { t } = useTranslation();
  const backend = useBackend();
  const { activeWorkspace, history, selectWorkspace, removeFromHistory } =
    useWorkspace();
  const [error, setError] = useState<string | null>(null);

  const trySelect = async (path: string) => {
    const ok = await selectWorkspace(path);
    setError(ok ? null : t("workspace.invalid", { path }));
  };

  const pickFolder = async () => {
    const selected = await backend.workspace.pickFolder();
    if (selected) await trySelect(selected);
  };

  return (
    <WorkspaceFooter
      activeWorkspace={activeWorkspace}
      history={history}
      error={error}
      onSelect={(path) => void trySelect(path)}
      onRemove={removeFromHistory}
      onChoose={() => void pickFolder()}
    />
  );
}
