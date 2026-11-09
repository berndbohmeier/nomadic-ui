import { Anchor, Text } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BarcodesModal } from "./BarcodesModal";
import { useBarcodeSelection } from "./BarcodeSelection";

export function BarcodesLink() {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const { metadata, error, selected, setSelected } = useBarcodeSelection();

  if (error != null) {
    return (
      <Text size="sm" c="red">
        {t("experiments.barcodes.error")}
      </Text>
    );
  }
  if (metadata === undefined) return null;

  return (
    <>
      <Anchor
        component="button"
        type="button"
        size="sm"
        style={{ flexShrink: 0 }}
        onClick={() => setOpened(true)}
      >
        {t("experiments.barcodes.link", {
          selected: selected.length,
          total: metadata.length,
        })}
      </Anchor>
      <BarcodesModal
        opened={opened}
        onClose={() => setOpened(false)}
        metadata={metadata}
        selected={selected}
        onApply={setSelected}
      />
    </>
  );
}
