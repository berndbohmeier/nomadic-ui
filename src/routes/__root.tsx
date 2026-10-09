import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
  ActionIcon,
  AppShell,
  Group,
  NavLink,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { useLocalStorage } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import {
  IconFlask,
  IconHome2,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSettings,
} from "@tabler/icons-react";

import { WorkspaceFooter } from "../features/workspace/WorkspaceFooter";

const NAV_ITEMS = [
  { to: "/", labelKey: "nav.start", icon: IconHome2 },
  { to: "/experiments", labelKey: "nav.experiments", icon: IconFlask },
  { to: "/settings", labelKey: "nav.settings", icon: IconSettings },
] as const;

const EXPANDED_WIDTH = 220;
const COLLAPSED_WIDTH = 64;

function RootLayout() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useLocalStorage({
    key: "nomadic-sidebar-collapsed",
    defaultValue: false,
  });

  return (
    <AppShell
      layout="alt"
      navbar={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        breakpoint: 0,
      }}
      footer={{ height: 32 }}
    >
      <AppShell.Footer
        withBorder={false}
        bg="var(--mantine-color-default-hover)"
      >
        <WorkspaceFooter />
      </AppShell.Footer>
      <AppShell.Navbar
        p="xs"
        withBorder={false}
        bg="var(--mantine-color-default-hover)"
      >
        <Stack justify="space-between" h="100%">
          <Stack gap={4}>
            <Group
              h={40}
              px="xs"
              wrap="nowrap"
              justify={collapsed ? "center" : "flex-start"}
            >
              <Text fw={700} size="lg" truncate>
                {collapsed ? "N" : "Nomadic"}
              </Text>
            </Group>
            {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => {
              const label = t(labelKey);
              return (
                <Tooltip
                  key={to}
                  label={label}
                  position="right"
                  disabled={!collapsed}
                >
                  <NavLink
                    component={Link}
                    to={to}
                    activeOptions={{ exact: to === "/" }}
                    label={collapsed ? undefined : label}
                    aria-label={label}
                    leftSection={<Icon size={22} stroke={1.5} />}
                    styles={{
                      root: {
                        borderRadius: "var(--mantine-radius-sm)",
                        justifyContent: collapsed ? "center" : undefined,
                      },
                      section: collapsed ? { marginInlineEnd: 0 } : undefined,
                    }}
                  />
                </Tooltip>
              );
            })}
          </Stack>
          <Group justify={collapsed ? "center" : "flex-end"}>
            <Tooltip
              label={
                collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")
              }
              position="right"
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={t("nav.toggleSidebar")}
                onClick={() => setCollapsed((c) => !c)}
              >
                {collapsed ? (
                  <IconLayoutSidebarLeftExpand size={20} />
                ) : (
                  <IconLayoutSidebarLeftCollapse size={20} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Stack>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: () => (
      <>
        <RootLayout />
        <TanStackRouterDevtools position="top-right" />
        <ReactQueryDevtools buttonPosition="bottom-right" />
      </>
    ),
  },
);
