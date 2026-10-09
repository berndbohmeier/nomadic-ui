import { createFileRoute } from "@tanstack/react-router";
import {
  Container,
  Select,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core";
import type { MantineColorScheme } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { LANGUAGES, SYSTEM_LANGUAGE } from "../i18n";
import type { LanguagePreference } from "../i18n";
import { useLanguagePreference } from "../i18n/useLanguagePreference";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { t } = useTranslation();
  const [languageValue, setLanguageValue] = useLanguagePreference();

  return (
    <Container p="md" fluid>
      <Stack gap="lg">
        <div>
          <Title order={2}>{t("settings.title")}</Title>
          <Text c="dimmed">{t("settings.subtitle")}</Text>
        </div>
        <Select<MantineColorScheme>
          label={t("settings.colorScheme.label")}
          description={t("settings.colorScheme.description")}
          data={[
            { value: "light", label: t("settings.colorScheme.light") },
            { value: "dark", label: t("settings.colorScheme.dark") },
            { value: "auto", label: t("settings.colorScheme.auto") },
          ]}
          value={colorScheme}
          onChange={(value) => {
            if (value) setColorScheme(value);
          }}
          allowDeselect={false}
          w={280}
        />
        <Select<LanguagePreference>
          label={t("settings.language.label")}
          description={t("settings.language.description")}
          data={[
            { value: SYSTEM_LANGUAGE, label: t("settings.language.system") },
            ...LANGUAGES,
          ]}
          value={languageValue}
          onChange={(value) => {
            if (value) setLanguageValue(value);
          }}
          allowDeselect={false}
          w={280}
        />
      </Stack>
    </Container>
  );
}
