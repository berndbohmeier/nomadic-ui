import type { MouseEvent } from "react";
import { ActionIcon, Group, Menu, Text, UnstyledButton } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconFolder, IconFolderPlus, IconX } from "@tabler/icons-react";
import classes from "./WorkspaceFooter.module.css";

export interface WorkspaceFooterProps {
  activeWorkspace: string | null;
  history: string[];
  error: string | null;
  onSelect: (path: string) => void;
  onRemove: (path: string) => void;
  onChoose: () => void;
}

export function WorkspaceFooter({
  activeWorkspace,
  history,
  error,
  onSelect,
  onRemove,
  onChoose,
}: WorkspaceFooterProps) {
  const { t } = useTranslation();

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
              onClick={() => onSelect(path)}
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
                    onRemove(path);
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
            onClick={onChoose}
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
