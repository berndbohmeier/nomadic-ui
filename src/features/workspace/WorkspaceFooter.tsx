import { useState } from "react";
import type { MouseEvent } from "react";
import { ActionIcon, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { IconFolder, IconFolderPlus, IconX } from "@tabler/icons-react";
import { useWorkspace } from "./useWorkspace";
import classes from "./WorkspaceFooter.module.css";

export function WorkspaceFooter() {
  const { t } = useTranslation();
  const { activeWorkspace, history, selectWorkspace, removeFromHistory } =
    useWorkspace();
  const [error, setError] = useState<string | null>(null);

  const trySelect = async (path: string) => {
    const ok = await selectWorkspace(path);
    setError(ok ? null : t("workspace.invalid", { path }));
  };

  const pickFolder = async () => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected === "string") await trySelect(selected);
  };

  return (
    <Group h="100%" px="xs" gap="xs" wrap="nowrap">
      <Menu position="top-start" withinPortal>
        <Menu.Target>
          <UnstyledButton
            h="100%"
            px="xs"
            miw={0}
            aria-label={t("workspace.change")}
            title={t("workspace.change")}
            style={{ borderRadius: "var(--mantine-radius-sm)" }}
            className={classes.trigger}
          >
            <Group gap="xs" wrap="nowrap" h="100%">
              <IconFolder size={16} />
              <Text size="xs" truncate>
                {activeWorkspace ?? t("workspace.none")}
              </Text>
            </Group>
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {history.length > 0 && (
            <Menu.Label>{t("workspace.recent")}</Menu.Label>
          )}
          {history.map((path) => (
            <Menu.Item
              key={path}
              onClick={() => void trySelect(path)}
              bg={
                path === activeWorkspace
                  ? "var(--mantine-primary-color-light)"
                  : undefined
              }
              rightSection={
                <ActionIcon
                  component="span"
                  size="xs"
                  variant="subtle"
                  color="gray"
                  aria-label={t("workspace.remove")}
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    removeFromHistory(path);
                  }}
                >
                  <IconX size={12} />
                </ActionIcon>
              }
            >
              <Text size="xs" maw={360} truncate>
                {path}
              </Text>
            </Menu.Item>
          ))}
          {history.length > 0 && <Menu.Divider />}
          <Menu.Item
            leftSection={<IconFolderPlus size={14} />}
            onClick={() => void pickFolder()}
          >
            {t("workspace.choose")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
      {error && (
        <Text size="xs" c="red" truncate>
          {error}
        </Text>
      )}
    </Group>
  );
}
