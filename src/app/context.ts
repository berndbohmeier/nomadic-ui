import { createContext, useContext } from "react";
import type { Backend } from "../backend/contract";

export const BackendContext = createContext<Backend | null>(null);

export function useBackend(): Backend {
  const backend = useContext(BackendContext);
  if (!backend) throw new Error("BackendContext is missing");
  return backend;
}
