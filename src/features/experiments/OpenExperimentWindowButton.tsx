import { ActionIcon, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useBackend } from "../../app/context";

interface OpenExperimentWindowButtonProps {
  path: string;
  title: string;
}

export function OpenExperimentWindowButton({
  path,
  title,
}: OpenExperimentWindowButtonProps) {
  const { t } = useTranslation();
  const backend = useBackend();
  const [hasError, setHasError] = useState(false);

  const openInNewWindow = () => {
    setHasError(false);
    void backend.experiments.openInNewWindow(path, title).catch(() => {
      setHasError(true);
    });
  };

  return (
    <>
      <ActionIcon
        size="sm"
        variant="subtle"
        color="gray"
        aria-label={t("experiments.view.openInNewWindow")}
        title={t("experiments.view.openInNewWindow")}
        onClick={openInNewWindow}
      >
        <IconExternalLink size={16} />
      </ActionIcon>
      {hasError && (
        <Text c="red" size="sm" role="alert">
          {t("experiments.view.openInNewWindowError")}
        </Text>
      )}
    </>
  );
}
