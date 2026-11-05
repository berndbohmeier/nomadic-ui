import { Table } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ExperimentSettings } from "../../backend/contract";

interface SettingsPanelProps {
  settings: ExperimentSettings | null;
}

export function SettingsPanel({ settings }: SettingsPanelProps) {
  const { t, i18n } = useTranslation();
  if (!settings) return <p>{t("experiments.settings.missing")}</p>;

  const startDate = settings.startDate ? new Date(settings.startDate) : null;
  const rows: [string, string, string | number | null | undefined][] = [
    [
      "startDate",
      t("experiments.settings.startDate"),
      startDate && !Number.isNaN(startDate.getTime())
        ? startDate.toLocaleString(i18n.language)
        : settings.startDate,
    ],
    ["caller", t("experiments.settings.caller"), settings.caller],
    [
      "referenceName",
      t("experiments.settings.referenceName"),
      settings.referenceName,
    ],
    ["nBarcodes", t("experiments.settings.nBarcodes"), settings.nBarcodes],
    ["nRegions", t("experiments.settings.nRegions"), settings.nRegions],
    ["fastqDir", t("experiments.settings.fastqDir"), settings.fastqDir],
    [
      "metadataCsv",
      t("experiments.settings.metadataCsv"),
      settings.metadataCsv,
    ],
    ["regionBed", t("experiments.settings.regionBed"), settings.regionBed],
    ["minknowDir", t("experiments.settings.minknowDir"), settings.minknowDir],
  ];

  return (
    <Table withRowBorders>
      <Table.Tbody>
        {rows.map(([key, label, value]) => (
          <Table.Tr key={key}>
            <Table.Th w={200}>{label}</Table.Th>
            <Table.Td style={{ wordBreak: "break-all" }}>
              {value ?? "–"}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
