import { useEffect } from "react";
import { useUIStore, type ActiveModule } from "@/stores/uiStore";

const SHORTCUTS: Record<string, ActiveModule> = {
  g: "overview",
  m: "map",
  a: "alerts",
  r: "reports",
  f: "fuel",
  d: "drivers",
  e: "evidence",
  c: "compliance",
};

export const useKeyboardNav = () => {
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const module = SHORTCUTS[e.key.toLowerCase()];
      if (module) {
        e.preventDefault();
        setActiveModule(module);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setActiveModule]);
};
