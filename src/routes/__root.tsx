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
import {
  IconFlask,
  IconHome2,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSettings,
} from "@tabler/icons-react";

const NAV_ITEMS = [
  { to: "/", label: "Start", icon: IconHome2 },
  { to: "/experiments", label: "Experiments", icon: IconFlask },
  { to: "/settings", label: "Settings", icon: IconSettings },
] as const;

const EXPANDED_WIDTH = 220;
const COLLAPSED_WIDTH = 64;

function RootLayout() {
  const [collapsed, setCollapsed] = useLocalStorage({
    key: "nomadic-sidebar-collapsed",
    defaultValue: false,
  });

  return (
    <AppShell
      navbar={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        breakpoint: 0,
      }}
    >
      <AppShell.Navbar p="xs">
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
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
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
            ))}
          </Stack>
          <Group justify={collapsed ? "center" : "flex-end"}>
            <Tooltip
              label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              position="right"
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Toggle sidebar"
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
