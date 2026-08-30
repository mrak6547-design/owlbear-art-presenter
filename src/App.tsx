import { useEffect, useState } from "react";
import ActionPanel from "./components/ActionPanel";
import ImageModal from "./components/ImageModal";
import OBR from "@owlbear-rodeo/sdk";
import DemoPage from "./components/DemoPage";

const CHANNEL = "artviewer.show-image";
const CLOSE_CHANNEL = "artviewer.close-image";
const MODAL_ID = "artviewer.image-modal";

type AppMode = "loading" | "action" | "modal" | "background" | "demo";

function App() {
  const [mode, setMode] = useState<AppMode>("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageMode = params.get("mode");

    if (pageMode === "modal") {
      setMode("modal");
      return;
    }
    if (pageMode === "background") {
      setMode("background");
      return;
    }
    if (pageMode === "demo") {
      setMode("demo");
      return;
    }

    // Check if running inside Owlbear
    if (OBR.isAvailable) {
      setMode("action");
    } else {
      // Not inside OBR - show demo/preview page
      setMode("demo");
    }
  }, []);

  if (mode === "loading") {
    return (
      <div className="flex items-center justify-center h-full bg-[#1a1a2e] text-white">
        <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (mode === "modal") {
    return <ImageModal />;
  }

  if (mode === "background") {
    return <BackgroundScript />;
  }

  if (mode === "demo") {
    return <DemoPage />;
  }

  return <ActionPanel />;
}

/**
 * Background script: runs silently for all players.
 * Listens to broadcast and opens the full-screen modal when GM sends an image.
 */
function BackgroundScript() {
  useEffect(() => {
    const unsubReady = OBR.onReady(() => {
      // Listen for "show image" messages from GM
      const unsubShow = OBR.broadcast.onMessage(CHANNEL, async (event) => {
        const data = event.data as { imageUrl: string; caption?: string };
        if (data && data.imageUrl) {
          const encodedUrl = encodeURIComponent(data.imageUrl);
          const encodedCaption = data.caption ? encodeURIComponent(data.caption) : "";
          const base = window.location.href.split("?")[0];
          const modalUrl = `${base}?mode=modal&imageUrl=${encodedUrl}&caption=${encodedCaption}`;

          try {
            await OBR.modal.open({
              id: MODAL_ID,
              url: modalUrl,
              fullScreen: true,
              hideBackdrop: false,
              hidePaper: true,
            });
          } catch (e) {
            console.error("[ArtViewer BG] Failed to open modal:", e);
          }
        }
      });

      // Listen for "close image" messages
      const unsubClose = OBR.broadcast.onMessage(CLOSE_CHANNEL, async () => {
        try {
          await OBR.modal.close(MODAL_ID);
        } catch (e) {
          // Modal might not be open, ignore
        }
      });

      return () => {
        unsubShow();
        unsubClose();
      };
    });

    return unsubReady;
  }, []);

  // Background renders nothing visible
  return null;
}

export default App;
