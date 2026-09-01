import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { ActionPanel } from "./pages/ActionPanel";
import { ViewerPage } from "./pages/ViewerPage";

/**
 * Одна точка входа, два режима расширения:
 *  — ?mode=action  → панель мастера (popover в Owlbear Rodeo)
 *  — ?mode=viewer  → полноэкранный показ арта (fullScreen-модал)
 */
const mode = new URLSearchParams(window.location.search).get("mode");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {mode === "viewer" ? <ViewerPage /> : <ActionPanel />}
  </React.StrictMode>,
);
