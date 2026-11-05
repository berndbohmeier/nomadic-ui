import { useState } from "react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BackendContext, StorageContext } from "../src/app/context";
import {
  createMockBackend,
  type MockBackendOverrides,
} from "../src/backend/mock";
import { createMemoryStorage } from "../src/storage/memory";

export interface TestProviderParameters {
  backend?: MockBackendOverrides;
  storage?: Record<string, string> | null;
}

interface TestProvidersProps {
  parameters?: TestProviderParameters;
  children: ReactNode;
}

export function TestProviders({ parameters, children }: TestProvidersProps) {
  const [backend] = useState(() => createMockBackend(parameters?.backend));
  const [storage] = useState(() =>
    createMemoryStorage(parameters?.storage ?? undefined),
  );
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
  );

  return (
    <BackendContext.Provider value={backend}>
      <StorageContext.Provider value={storage}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </StorageContext.Provider>
    </BackendContext.Provider>
  );
}
