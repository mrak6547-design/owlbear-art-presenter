import { ActionPanel } from "./pages/ActionPanel";
import { ViewerPage } from "./pages/ViewerPage";
import { Home } from "./pages/Home";

/**
 * Одна точка входа, три роли:
 *  — "/"             → лендинг с демо-симулятором
 *  — "/?mode=action" → пульт мастера (popover в Owlbear Rodeo)
 *  — "/?mode=modal"  → полноэкранный показ арта (fullScreen-модал)
 */
export default function App() {
  const mode = new URLSearchParams(window.location.search).get("mode");

  if (mode === "modal") {
    return <ViewerPage />;
  }

  if (mode === "action") {
    return (
      <div className="min-h-dvh bg-ink-950">
        <ActionPanel />
      </div>
    );
  }

  return <Home />;
}
