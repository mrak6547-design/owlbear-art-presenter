import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import OBR from "@owlbear-rodeo/sdk";
import {
  Flame,
  Gem,
  ImageOff,
  Map as MapIcon,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  User,
  X,
} from "lucide-react";
import { KIND_LABEL } from "../lib/artworks";
import { MODAL_ID, readShowState } from "../lib/obr";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

interface ViewerRequest {
  src: string;
  title: string;
  kind: string;
  by?: string;
}

interface View {
  x: number;
  y: number;
  s: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

/** Показ на телефоне? Подбираем подсказку под устройство. */
const COARSE_POINTER =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

function parseRequest(): ViewerRequest | null {
  const params = new URLSearchParams(window.location.search);
  const src = params.get("src");
  if (!src) return null;

  return {
    src,
    title: params.get("title")?.trim() || "Без названия",
    kind: params.get("kind")?.trim() || "scene",
    by: params.get("by")?.trim() || undefined,
  };
}

/** Золотой уголок рамы. */
function GoldCorner({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      style={style}
      aria-hidden
    >
      <path
        d="M3 61V19C3 10 10 3 19 3h42"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M3 61V27C3 14 14 3 27 3h34"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.55"
      />
      <circle cx="16" cy="16" r="3.1" fill="currentColor" />
      <circle cx="8.5" cy="35" r="2" fill="currentColor" opacity="0.8" />
      <circle cx="35" cy="8.5" r="2" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

const KIND_ICON: Record<string, typeof User> = {
  npc: User,
  location: MapPin,
  artifact: Gem,
  encounter: Flame,
  map: MapIcon,
};

export function ViewerPage() {
  const [req, setReq] = useState<ViewerRequest | null>(() => parseRequest());
  const [aspect, setAspect] = useState(1.5);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [closing, setClosing] = useState(false);
  const [hint, setHint] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<View>({ x: 0, y: 0, s: 1 });
  const [, setPing] = useState(0);
  const pinchRef = useRef<{
    dist: number;
    scale: number;
    cx: number;
    cy: number;
  } | null>(null);
  const pointersRef = useRef(
    new Map<number, { x: number; y: number; sx: number; sy: number; moved: boolean }>(),
  );
  const lastTapRef = useRef({ t: 0, x: 0, y: 0 });
  const closingRef = useRef(false);

  const setView = useCallback((next: View) => {
    viewRef.current = next;
    setPing((v) => v + 1);
  }, []);

  const clampPan = useCallback((v: View): View => {
    const stage = stageRef.current;
    if (!stage || v.s <= 1) return { x: 0, y: 0, s: Math.max(MIN_ZOOM, v.s) };

    const rect = stage.getBoundingClientRect();
    const maxX = (rect.width * (v.s - 1)) / 2;
    const maxY = (rect.height * (v.s - 1)) / 2;

    return {
      x: clamp(v.x, -maxX, maxX),
      y: clamp(v.y, -maxY, maxY),
      s: v.s,
    };
  }, []);

  const zoomAt = useCallback(
    (factor: number, cx?: number, cy?: number) => {
      const stage = stageRef.current;
      if (!stage) return;

      const rect = stage.getBoundingClientRect();
      const px = (cx ?? rect.left + rect.width / 2) - rect.left - rect.width / 2;
      const py = (cy ?? rect.top + rect.height / 2) - rect.top - rect.height / 2;

      const cur = viewRef.current;
      const nextScale = clamp(cur.s * factor, MIN_ZOOM, MAX_ZOOM);
      const k = nextScale / cur.s;

      setView(
        clampPan({
          x: (cur.x - px) * k + px,
          y: (cur.y - py) * k + py,
          s: nextScale,
        }),
      );
    },
    [setView, clampPan],
  );

  const reset = useCallback(() => {
    setView({ x: 0, y: 0, s: 1 });
  }, [setView]);

  const close = useCallback(async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);

    // Даём анимации закрытия доиграть.
    await new Promise((r) => setTimeout(r, 180));

    try {
      await OBR.modal.close(MODAL_ID);
    } catch {
      /* вне Owlbear */
    }
    try {
      window.close();
    } catch {
      /* игнорируем */
    }
  }, []);

  /* Escape закрывает показ */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  /* Если картинка не пришла через URL — берём текущий показ из metadata. */
  useEffect(() => {
    if (req?.src) return;

    let cancelled = false;
    (async () => {
      try {
        const mod = await import("@owlbear-rodeo/sdk");
        const state = await readShowState(mod.default);
        if (!cancelled && state) {
          setReq({
            src: state.src,
            title: state.title,
            kind: state.kind,
            by: state.by,
          });
        }
      } catch {
        /* остаёмся в состоянии ошибки */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [req?.src]);

  /* Сброс при смене арта */
  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    reset();
  }, [req?.src, reset]);

  /* Колесо мыши — зум к курсору */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, e.clientX, e.clientY);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomAt, req?.src]);

  /* Подсказка после загрузки */
  useEffect(() => {
    if (!loaded) return;
    setHint(true);
    const timer = window.setTimeout(() => setHint(false), 4200);
    return () => window.clearTimeout(timer);
  }, [loaded]);

  const view = viewRef.current;
  const KindIcon = req ? KIND_ICON[req.kind] ?? ImageOff : ImageOff;
  const noData = !req && !loaded && !failed;

  return (
    <div className={`zv-root ${closing ? "closing" : ""}`}>
      {/* занавес */}
      <div className="zv-curtains" aria-hidden>
        <div className="zv-curtain zv-curtain-left" />
        <div className="zv-curtain zv-curtain-right" />
      </div>

      {/* сцена */}
      <div className="zv-stage">
        {req && (
          <div
            className="zv-frame"
            style={{ "--ar": String(aspect) } as CSSProperties}
          >
            <div className="zv-sweep" aria-hidden />
            <GoldCorner className="zv-corner zv-corner-tl" />
            <GoldCorner className="zv-corner zv-corner-tr" />
            <GoldCorner className="zv-corner zv-corner-br" />
            <GoldCorner className="zv-corner zv-corner-bl" />

            <div className="zv-mat">
              <div
                ref={stageRef}
                className={`zv-view ${
                  view.s > 1.01 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
                }`}
                onPointerDown={(e) => {
                  const el = e.currentTarget;
                  el.setPointerCapture(e.pointerId);
                  pointersRef.current.set(e.pointerId, {
                    x: e.clientX,
                    y: e.clientY,
                    sx: e.clientX,
                    sy: e.clientY,
                    moved: false,
                  });

                  if (pointersRef.current.size === 2) {
                    const [a, b] = [...pointersRef.current.values()];
                    pinchRef.current = {
                      dist: Math.hypot(a.x - b.x, a.y - b.y),
                      scale: viewRef.current.s,
                      cx: (a.x + b.x) / 2,
                      cy: (a.y + b.y) / 2,
                    };
                  }
                }}
                onPointerMove={(e) => {
                  const p = pointersRef.current.get(e.pointerId);
                  if (!p) return;

                  const cur = { x: e.clientX, y: e.clientY };
                  if (
                    Math.hypot(cur.x - p.sx, cur.y - p.sy) > 9
                  ) {
                    p.moved = true;
                  }

                  if (pointersRef.current.size === 2 && pinchRef.current) {
                    pointersRef.current.set(e.pointerId, {
                      ...p,
                      ...cur,
                    });
                    const [a, b] = [...pointersRef.current.values()];
                    const dist = Math.hypot(a.x - b.x, a.y - b.y);
                    const target = clamp(
                      (pinchRef.current.scale * dist) /
                        pinchRef.current.dist,
                      MIN_ZOOM,
                      MAX_ZOOM,
                    );
                    zoomAt(
                      target / viewRef.current.s,
                      pinchRef.current.cx,
                      pinchRef.current.cy,
                    );
                    return;
                  }

                  if (pointersRef.current.size === 1 && viewRef.current.s > 1.01) {
                    setView(
                      clampPan({
                        ...viewRef.current,
                        x: viewRef.current.x + (cur.x - p.x),
                        y: viewRef.current.y + (cur.y - p.y),
                      }),
                    );
                  }

                  pointersRef.current.set(e.pointerId, {
                    ...p,
                    ...cur,
                  });
                }}
                onPointerUp={(e) => {
                  const p = pointersRef.current.get(e.pointerId);
                  pointersRef.current.delete(e.pointerId);
                  if (pointersRef.current.size < 2) pinchRef.current = null;

                  if (p && !p.moved && pointersRef.current.size === 0) {
                    const now = Date.now();
                    const last = lastTapRef.current;

                    if (
                      now - last.t < 300 &&
                      Math.hypot(e.clientX - last.x, e.clientY - last.y) < 42
                    ) {
                      if (viewRef.current.s > 1.01) reset();
                      else zoomAt(2.2, e.clientX, e.clientY);
                      lastTapRef.current = { t: 0, x: 0, y: 0 };
                    } else {
                      lastTapRef.current = { t: now, x: e.clientX, y: e.clientY };
                    }
                  }
                }}
                onPointerCancel={(e) => {
                  pointersRef.current.delete(e.pointerId);
                  if (pointersRef.current.size < 2) pinchRef.current = null;
                }}
              >
                {!loaded && !failed && (
                  <div className="zv-status">
                    <span className="spin" />
                    Поднимаем занавес…
                  </div>
                )}

                {failed && (
                  <div className="zv-status zv-error">
                    <ImageOff className="h-8 w-8" />
                    Не удалось загрузить изображение
                  </div>
                )}

                <img
                  src={req.src}
                  alt={req.title}
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const w = img.naturalWidth || 16;
                    const h = img.naturalHeight || 9;
                    if (w > 0 && h > 0) setAspect(w / h);
                    setLoaded(true);
                  }}
                  onError={() => setFailed(true)}
                  className="zv-img"
                  style={{
                    transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
                    opacity: loaded ? 1 : 0,
                    transition: loaded ? "transform 0.06s linear, opacity 0.35s ease" : "none",
                  }}
                />
              </div>

              {/* чип типа */}
              {req && KIND_LABEL[req.kind] && (
                <div className="zv-kind">
                  <KindIcon className="h-3 w-3" />
                  {KIND_LABEL[req.kind]}
                </div>
              )}

              {/* подпись */}
              <div className="zv-caption">
                <p className="zv-title">{req?.title}</p>
                {req?.by && (
                  <div className="zv-meta">Представляет · {req.by}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {noData && (
          <div className="zv-status zv-error" style={{ position: "absolute", inset: 0 }}>
            <ImageOff className="h-10 w-10" />
            Показ не найден
          </div>
        )}
      </div>

      {/* крестик */}
      <button
        type="button"
        onClick={() => void close()}
        className="zv-close"
        aria-label="Закрыть картинку"
        title="Закрыть (Esc)"
      >
        <X className="h-6 w-6" strokeWidth={2.4} />
      </button>

      {/* зум */}
      <div className="zv-zoom" aria-hidden={false}>
        <button
          type="button"
          className="zv-tool"
          onClick={() => zoomAt(1 / 1.35)}
          aria-label="Уменьшить"
          disabled={view.s <= MIN_ZOOM}
          style={{ opacity: view.s <= MIN_ZOOM ? 0.35 : 1 }}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="zv-zoom-label">{Math.round(view.s * 100)}%</span>
        <button
          type="button"
          className="zv-tool"
          onClick={() => zoomAt(1.35)}
          aria-label="Увеличить"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={`zv-tool ${view.s <= 1.01 ? "hidden" : ""}`}
          onClick={reset}
          aria-label="Сбросить масштаб"
          title="Вернуть в рамку"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* подсказка */}
      <div className={`zv-hint ${hint ? "visible" : ""}`}>
        {COARSE_POINTER
          ? "Двойной тап — зум · Щипок — приблизить"
          : "Колесо — зум · Двойной клик — приблизить · Перетаскивание"}
      </div>
    </div>
  );
}
