import { ActionIcon, Text } from "@mantine/core";
import { IconFolderOpen } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBackend } from "../../app/context";

interface OpenExperimentFolderButtonProps {
  path: string;
}

export function OpenExperimentFolderButton({
  path,
}: OpenExperimentFolderButtonProps) {
  const { t } = useTranslation();
  const backend = useBackend();
  const [hasError, setHasError] = useState(false);

  const openFolder = () => {
    setHasError(false);
    void backend.experiments.openFolder(path).catch(() => {
      setHasError(true);
    });
  };

  return (
    <>
      <ActionIcon
        size="sm"
        variant="subtle"
        color="gray"
        aria-label={t("experiments.view.openFolder")}
        title={t("experiments.view.openFolder")}
        onClick={openFolder}
      >
        <IconFolderOpen size={16} />
      </ActionIcon>
      {hasError && (
        <Text c="red" size="sm" role="alert">
          {t("experiments.view.openFolderError")}
        </Text>
      )}
    </>
  );
}
