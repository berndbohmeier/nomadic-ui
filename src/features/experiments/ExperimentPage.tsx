import { Loader, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useBackend } from "../../app/context";
import { ExperimentView } from "./ExperimentView";

interface ExperimentPageProps {
  /** Full path to the experiment folder. */
  path: string;
  /** Rendered at the top of the pinned header. */
  headerTop?: ReactNode;
}

export function ExperimentPage({ path, headerTop }: ExperimentPageProps) {
  const { t } = useTranslation();
  const backend = useBackend();
  const { data, isPending, isError } = useQuery({
    queryKey: ["experiment", path],
    queryFn: () => backend.experiments.load(path),
  });

  if (isPending)
    return (
      <>
        {headerTop}
        <Loader size="sm" />
      </>
    );
  if (isError)
    return (
      <>
        {headerTop}
        <Text c="red">{t("experiments.view.error")}</Text>
      </>
    );
  return <ExperimentView experiment={data} headerTop={headerTop} />;
}
