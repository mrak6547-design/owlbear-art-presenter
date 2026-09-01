import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

export type ThemeMode = "DARK" | "LIGHT";

/**
 * Тема Owlbear Rodeo. Панель мастера адаптируется под тёмную/светлую тему,
 * чтобы выглядеть нативно в любой комнате.
 */
export function useObrTheme(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>("DARK");

  useEffect(() => {
    let off: (() => void) | undefined;
    let cancelled = false;

    const timeout = window.setTimeout(() => {
      if (!cancelled) setMode("DARK");
    }, 2500);

    try {
      OBR.theme
        .getTheme()
        .then((theme) => {
          if (!cancelled) setMode(theme.mode);
        })
        .catch(() => {
          if (!cancelled) setMode("DARK");
        })
        .finally(() => window.clearTimeout(timeout));

      off = OBR.theme.onChange((theme) => {
        if (!cancelled) setMode(theme.mode);
      });
    } catch {
      /* вне Owlbear */
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      off?.();
    };
  }, []);

  return mode;
}
