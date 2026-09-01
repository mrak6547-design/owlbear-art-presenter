import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { ActionPanel } from "./pages/ActionPanel";
import { ViewerPage } from "./pages/ViewerPage";

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {mode === "viewer" ? (
      <ViewerPage />
    ) : (
      <ActionPanel embedded />
    )}
  </React.StrictMode>,
);
