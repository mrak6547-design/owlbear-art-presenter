import { useEffect, useState, useRef } from "react";
import OBR from "@owlbear-rodeo/sdk";

const MODAL_ID = "artviewer.image-modal";

export default function ImageModal() {
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [role, setRole] = useState<"GM" | "PLAYER" | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastOffset, setLastOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("imageUrl");
    const cap = params.get("caption");
    if (url) setImageUrl(decodeURIComponent(url));
    if (cap) setCaption(decodeURIComponent(cap));
  }, []);

  useEffect(() => {
    const unsub = OBR.onReady(async () => {
      setIsReady(true);
      try {
        const r = await OBR.player.getRole();
        setRole(r);
      } catch (e) {
        // ignore
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const unsubClose = OBR.broadcast.onMessage("artviewer.close-image", () => {
      OBR.modal.close(MODAL_ID);
    });
    return unsubClose;
  }, [isReady]);

  const handleClose = async () => {
    try {
      await OBR.modal.close(MODAL_ID);
      if (role === "GM") {
        await OBR.broadcast.sendMessage(
          "artviewer.close-image",
          { close: true },
          { destination: "ALL" }
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(5, Math.max(0.2, z + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - lastOffset.x, y: e.clientY - lastOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newOffset = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    };
    setOffset(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastOffset(offset);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - lastOffset.x, y: t.clientY - lastOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0];
      const newOffset = {
        x: t.clientX - dragStart.x,
        y: t.clientY - dragStart.y,
      };
      setOffset(newOffset);
    }
    // Pinch zoom
    if (e.touches.length === 2) {
      // basic pinch – we'll handle via wheel on desktop
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastOffset(offset);
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setLastOffset({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.92)",
        zIndex: 9999,
        fontFamily: "'Georgia', serif",
      }}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Decorative corner ornaments */}
      <div className="absolute top-3 left-3 text-amber-600/40 text-2xl pointer-events-none select-none">✦</div>
      <div className="absolute top-3 right-3 text-amber-600/40 text-2xl pointer-events-none select-none">✦</div>
      <div className="absolute bottom-3 left-3 text-amber-600/40 text-2xl pointer-events-none select-none">✦</div>
      <div className="absolute bottom-3 right-3 text-amber-600/40 text-2xl pointer-events-none select-none">✦</div>

      {/* Main frame container */}
      <div
        className="relative flex flex-col items-center"
        style={{
          maxWidth: "min(95vw, 1200px)",
          maxHeight: "95vh",
          width: "auto",
        }}
      >
        {/* Top frame bar */}
        <div
          className="w-full flex items-center justify-between px-4 py-2 rounded-t-lg"
          style={{
            background: "linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a0f00 100%)",
            border: "2px solid #7c5a1e",
            borderBottom: "none",
          }}
        >
          {/* Decorative title area */}
          <div className="flex items-center gap-2">
            <span className="text-amber-600/60 text-sm">❧</span>
          </div>

          {caption && (
            <div className="flex-1 text-center">
              <span
                className="text-amber-300 font-medium tracking-wider"
                style={{
                  fontSize: "clamp(12px, 2.5vw, 18px)",
                  textShadow: "0 0 12px rgba(255,180,50,0.5)",
                  fontFamily: "'Georgia', serif",
                  letterSpacing: "0.1em",
                }}
              >
                {caption}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {/* Zoom controls */}
            <button
              onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
              className="w-7 h-7 rounded flex items-center justify-center text-amber-400 hover:text-amber-200 hover:bg-amber-900/40 transition-colors text-sm"
              title="Приблизить"
            >
              +
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.25))}
              className="w-7 h-7 rounded flex items-center justify-center text-amber-400 hover:text-amber-200 hover:bg-amber-900/40 transition-colors text-sm"
              title="Отдалить"
            >
              −
            </button>
            <button
              onClick={resetView}
              className="w-7 h-7 rounded flex items-center justify-center text-amber-400 hover:text-amber-200 hover:bg-amber-900/40 transition-colors text-xs"
              title="Сбросить вид"
            >
              ⊙
            </button>

            {/* Separator */}
            <div className="w-px h-5 bg-amber-900/50 mx-1" />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-amber-200 transition-all"
              style={{
                background: "linear-gradient(135deg, #7c1a1a, #b22222)",
                border: "1.5px solid #c0392b",
                boxShadow: "0 0 8px rgba(192,57,43,0.4)",
                fontSize: "14px",
              }}
              title="Закрыть"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image frame */}
        <div
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            border: "3px solid #7c5a1e",
            borderTop: "none",
            background: "#0a0a0a",
            maxHeight: caption ? "calc(95vh - 100px)" : "calc(95vh - 60px)",
            width: "100%",
            cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default",
            userSelect: "none",
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Inner decorative border */}
          <div
            className="absolute inset-2 pointer-events-none"
            style={{
              border: "1px solid rgba(124,90,30,0.3)",
              zIndex: 2,
            }}
          />
          <div
            className="absolute inset-3 pointer-events-none"
            style={{
              border: "1px solid rgba(124,90,30,0.15)",
              zIndex: 2,
            }}
          />

          {/* Loading spinner */}
          {!isLoaded && imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-4 border-amber-800 border-t-amber-400 animate-spin"
                />
                <span className="text-amber-600 text-sm">Загрузка...</span>
              </div>
            </div>
          )}

          {/* The image */}
          {imageUrl && (
            <img
              ref={imgRef}
              src={imageUrl}
              alt={caption || "Artwork"}
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsLoaded(true)}
              style={{
                maxWidth: zoom === 1 ? "100%" : "none",
                maxHeight: zoom === 1 ? "100%" : "none",
                width: zoom === 1 ? "auto" : undefined,
                height: zoom === 1 ? "auto" : undefined,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.15s ease",
                opacity: isLoaded ? 1 : 0,
                display: "block",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                draggable: false,
              } as React.CSSProperties}
              draggable={false}
            />
          )}

          {/* Corner decorations inside frame */}
          <div className="absolute top-2 left-2 pointer-events-none text-amber-900/30 text-xs z-3">◈</div>
          <div className="absolute top-2 right-2 pointer-events-none text-amber-900/30 text-xs z-3">◈</div>
          <div className="absolute bottom-2 left-2 pointer-events-none text-amber-900/30 text-xs z-3">◈</div>
          <div className="absolute bottom-2 right-2 pointer-events-none text-amber-900/30 text-xs z-3">◈</div>
        </div>

        {/* Bottom frame bar */}
        <div
          className="w-full flex items-center justify-between px-4 py-1.5 rounded-b-lg"
          style={{
            background: "linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a0f00 100%)",
            border: "2px solid #7c5a1e",
            borderTop: "none",
          }}
        >
          <span className="text-amber-600/40 text-xs">❦</span>
          <span className="text-amber-800 text-[10px] tracking-widest">
            {zoom !== 1 ? `${Math.round(zoom * 100)}%` : "Прокрутите для зума · Тяните для перемещения"}
          </span>
          <span className="text-amber-600/40 text-xs">❦</span>
        </div>
      </div>
    </div>
  );
}
