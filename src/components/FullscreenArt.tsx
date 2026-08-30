import { useEffect, useRef, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { X, RotateCcw } from "lucide-react";

type ArtData = {
  src: string;
  title?: string;
  kind?: string;
  by?: string;
};

interface FullscreenArtProps {
  open: boolean;
  image: ArtData;
  onClose?: () => void;
}

const MIN = 1;
const MAX = 6;

export function FullscreenArt({
  open,
  image,
  onClose,
}: FullscreenArtProps) {
  const stageRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{
    dist: number;
    scale: number;
    cx: number;
    cy: number;
  } | null>(null);

  const lastTap = useRef(0);

  useEffect(() => {
    setScale(1);
    setX(0);
    setY(0);
    setLoaded(false);
  }, [image.src]);

  const reset = () => {
    setScale(1);
    setX(0);
    setY(0);
  };

  const close = async () => {
    try {
      await OBR.modal.close("zanaves/viewer");
    } catch {}

    onClose?.();
  };

  const zoomAt = (factor: number, cx: number, cy: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    const rect = stage.getBoundingClientRect();

    const px = cx - rect.left - rect.width / 2;
    const py = cy - rect.top - rect.height / 2;

    const next = Math.max(MIN, Math.min(MAX, scale * factor));
    const k = next / scale;

    setX((prev) => (prev - px) * k + px);
    setY((prev) => (prev - py) * k + py);
    setScale(next);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-black/90">
      {/* затемнение */}
      <div
        className="absolute inset-0 backdrop-blur-[3px]"
        onClick={close}
      />

      {/* шторы */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div className="curtain-left" />
        <div className="curtain-right" />
      </div>

      {/* окно */}
      <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-6">
        <div className="relative flex h-full w-full max-w-[1700px] flex-col overflow-hidden rounded-2xl border border-amber-500/35 bg-[#11131b] shadow-[0_0_70px_rgba(0,0,0,.75)]">
          {/* кнопки */}
          <div className="absolute left-4 top-4 z-40 flex gap-2">
            <button
              onClick={reset}
              className="rounded-full border border-amber-400/30 bg-black/55 p-3 text-amber-200 backdrop-blur hover:bg-black/75"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={close}
            className="absolute right-4 top-4 z-40 rounded-full border border-amber-400/30 bg-black/55 p-3 text-amber-200 backdrop-blur hover:bg-red-700/80 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>

          {/* сцена */}
          <div
            ref={stageRef}
            className={`relative flex-1 overflow-hidden touch-none ${
              scale > 1.01 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
            }`}
            onWheel={(e) => {
              e.preventDefault();
              zoomAt(
                e.deltaY < 0 ? 1.15 : 1 / 1.15,
                e.clientX,
                e.clientY,
              );
            }}
            onPointerDown={(e) => {
              const stage = stageRef.current;
              if (!stage) return;

              stage.setPointerCapture(e.pointerId);

              pointers.current.set(e.pointerId, {
                x: e.clientX,
                y: e.clientY,
              });

              if (pointers.current.size === 2) {
                const [a, b] = [...pointers.current.values()];
                pinch.current = {
                  dist: Math.hypot(a.x - b.x, a.y - b.y),
                  scale,
                  cx: (a.x + b.x) / 2,
                  cy: (a.y + b.y) / 2,
                };
              }
            }}
            onPointerMove={(e) => {
              const prev = pointers.current.get(e.pointerId);
              if (!prev) return;

              const cur = { x: e.clientX, y: e.clientY };

              if (pointers.current.size === 2 && pinch.current) {
                pointers.current.set(e.pointerId, cur);

                const [a, b] = [...pointers.current.values()];
                const dist = Math.hypot(a.x - b.x, a.y - b.y);

                const target = Math.max(
                  MIN,
                  Math.min(
                    MAX,
                    (pinch.current.scale * dist) / pinch.current.dist,
                  ),
                );

                zoomAt(
                  target / scale,
                  pinch.current.cx,
                  pinch.current.cy,
                );
                return;
              }

              if (pointers.current.size === 1 && scale > 1.01) {
                setX((v) => v + cur.x - prev.x);
                setY((v) => v + cur.y - prev.y);
              }

              pointers.current.set(e.pointerId, cur);
            }}
            onPointerUp={(e) => {
              pointers.current.delete(e.pointerId);

              if (pointers.current.size < 2) pinch.current = null;

              const now = Date.now();

              if (now - lastTap.current < 300) {
                if (scale > 1.01) reset();
                else zoomAt(2.5 / scale, e.clientX, e.clientY);

                lastTap.current = 0;
              } else {
                lastTap.current = now;
              }
            }}
            onPointerCancel={(e) => {
              pointers.current.delete(e.pointerId);
              if (pointers.current.size < 2) pinch.current = null;
            }}
          >
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                Поднимаем занавес…
              </div>
            )}

            <img
              src={image.src}
              alt={image.title ?? ""}
              draggable={false}
              onLoad={() => setLoaded(true)}
              className="h-full w-full object-contain select-none"
              style={{
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: loaded ? "transform .08s linear" : "none",
              }}
            />
          </div>

          {/* подпись */}
          {(image.title || image.by) && (
            <div className="border-t border-amber-500/20 bg-black/45 px-5 py-3 backdrop-blur">
              {image.title && (
                <div className="font-display text-lg tracking-wide text-amber-100">
                  {image.title}
                </div>
              )}

              {image.by && (
                <div className="mt-1 text-xs tracking-[0.18em] text-amber-300/70 uppercase">
                  Представляет {image.by}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .curtain-left,
        .curtain-right{
          position:absolute;
          top:0;
          width:50%;
          height:100%;
          background:
            linear-gradient(90deg,#5d0f12,#7c1418 45%,#551014);
          box-shadow: inset 0 0 80px rgba(0,0,0,.55);
        }

        .curtain-left{
          left:0;
          transform-origin:left center;
          animation: curtainLeft .55s ease-out forwards;
        }

        .curtain-right{
          right:0;
          transform-origin:right center;
          animation: curtainRight .55s ease-out forwards;
        }

        @keyframes curtainLeft{
          from{transform:translateX(0)}
          to{transform:translateX(-100%)}
        }

        @keyframes curtainRight{
          from{transform:translateX(0)}
          to{transform:translateX(100%)}
        }
      `}</style>
    </div>
  );
}
