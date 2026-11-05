import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "./i18n";
import { routeTree } from "./routeTree.gen";
import { createBackend } from "./backend/create-backend";
import { BackendContext, StorageContext } from "./app/context";
import { createBrowserStorage } from "./storage/browser";

const backend = await createBackend();
const storage = createBrowserStorage();
const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: { queryClient, backend },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BackendContext.Provider value={backend}>
      <StorageContext.Provider value={storage}>
        <QueryClientProvider client={queryClient}>
          <MantineProvider defaultColorScheme="auto">
            <RouterProvider router={router} />
          </MantineProvider>
        </QueryClientProvider>
      </StorageContext.Provider>
    </BackendContext.Provider>
  </React.StrictMode>,
);
