import { useUIContext } from "@/context/UIContext";

export function useUI() {
  return useUIContext(); // Direct re-export for simplicity in this sprint
}
