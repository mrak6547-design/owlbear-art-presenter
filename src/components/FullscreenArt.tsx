import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  VenetianMask,
  MapPin,
  Gem,
  Flame,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { KIND_LABEL, type ShowRequest } from "../lib/artworks";

/* ------------------------------------------------------------------ */
/* Угловой орнамент рамы                                               */
/* ------------------------------------------------------------------ */
export function Corner({
  rotate = 0,
  className = "",
}: {
  rotate?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <defs>
        <linearGradient id="cornerGold" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0" stopColor="#f0e0ad" />
          <stop offset="0.5" stopColor="#c9a227" />
          <stop offset="1" stopColor="#7c6114" />
        </linearGradient>
      </defs>
      <motion.path
        d="M6 60 C6 34 10 22 22 14 C32 7 46 4 60 4"
        stroke="url(#cornerGold)"
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.55, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M15 60 C15 42 21 30 31 22"
        stroke="url(#cornerGold)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.65"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.75, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx="6"
        cy="6"
        r="3.4"
        fill="url(#cornerGold)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.05, type: "spring", stiffness: 400, damping: 12 }}
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Золотая пыльца                                                      */
/* ------------------------------------------------------------------ */
export function Dust({ count = 26 }: { count?: number }) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const rand = (salt: number) => {
          const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
          return x - Math.floor(x);
        };
        return {
          left: 4 + rand(1) * 92,
          top: 10 + rand(2) * 84,
          size: 1.6 + rand(3) * 3.4,
          t: 6 + rand(4) * 9,
          delay: rand(5) * 8,
          dx: -14 + rand(6) * 28,
          dy: -(46 + rand(7) * 90),
          max: 0.3 + rand(8) * 0.5,
        };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {motes.map((m, i) => (
        <span
          key={i}
          className="dust absolute rounded-full bg-gold-300"
          style={
            {
              left: `${m.left}%`,
              top: `${m.top}%`,
              width: m.size,
              height: m.size,
              filter: "blur(0.6px)",
              boxShadow: "0 0 6px 1px rgba(217,181,108,0.55)",
              "--dust-t": `${m.t}s`,
              "--dust-x": `${m.dx}px`,
              "--dust-y": `${m.dy}px`,
              "--dust-max": m.max,
              animationDelay: `${m.delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

const KIND_ICON: Record<string, typeof Gem> = {
  npc: VenetianMask,
  location: MapPin,
  artifact: Gem,
  encounter: Flame,
};

/* ------------------------------------------------------------------ */
/* Главный оверлей показа                                              */
/* ------------------------------------------------------------------ */
export function FullscreenArt({
  show,
  onClose,
}: {
  show: ShowRequest | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {show && <ArtOverlay key={show.src + show.title} {...show} onClose={onClose} />}
    </AnimatePresence>
  );
}

function ArtOverlay({ src, title, kind, by, onClose }: ShowRequest & { onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);

  const canDrag =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const Icon = KIND_ICON[kind] ?? ImageIcon;
  const kindLabel = KIND_LABEL[kind] ?? "Сцена";

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Тёмная зал */}
      <motion.div
        className="grain absolute inset-0 bg-ink-950/95 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        transition={{ duration: 0.5 }}
      />
      <div className="vignette pointer-events-none absolute inset-0" aria-hidden />
      <Dust />

      {/* Сцена с рамой — занавес раздвинется поверх неё */}
      <motion.figure
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-4 sm:gap-6 sm:p-8"
        initial={{ opacity: 0, scale: 0.88, y: 26, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.92, y: 14, filter: "blur(6px)", transition: { duration: 0.35 } }}
        transition={{ delay: 0.45, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        drag={canDrag ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.15, bottom: 0.55 }}
        onDragEnd={(_, info) => {
          if (canDrag && info.offset.y > 120) onClose();
        }}
      >
        {/* Световой всплеск за рамой */}
        <motion.div
          className="absolute h-[70vmin] w-[70vmin] rounded-full bg-gold-500/25 blur-[120px]"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ delay: 0.35, duration: 1.4, ease: "easeOut" }}
          aria-hidden
        />

        {/* Рама */}
        <div className="relative m-auto w-fit max-w-full">
          {/* Металлическая кромка */}
          <div
            className="relative rounded-[3px] p-[9px] sm:p-[13px]"
            style={{
              background:
                "linear-gradient(160deg,#6b5320 0%,#e9cf8e 14%,#7a5e26 34%,#f3e2ac 52%,#5e4718 74%,#caa64f 100%)",
              boxShadow:
                "0 50px 140px -24px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,0,0,0.85), inset 0 0 12px rgba(0,0,0,0.55)",
            }}
          >
            {/* Углы */}
            <Corner className="pointer-events-none absolute -top-1.5 -left-1.5 h-10 w-10 sm:-top-2.5 sm:-left-2.5 sm:h-16 sm:w-16" />
            <Corner rotate={90} className="pointer-events-none absolute -top-1.5 -right-1.5 h-10 w-10 sm:-top-2.5 sm:-right-2.5 sm:h-16 sm:w-16" />
            <Corner rotate={180} className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-10 w-10 sm:-bottom-2.5 sm:-right-2.5 sm:h-16 sm:w-16" />
            <Corner rotate={270} className="pointer-events-none absolute -bottom-1.5 -left-1.5 h-10 w-10 sm:-bottom-2.5 sm:-left-2.5 sm:h-16 sm:w-16" />

            <div
              className="relative overflow-hidden bg-ink-900 ring-1 ring-gold-500/40"
              style={{ boxShadow: "inset 0 0 40px rgba(0,0,0,0.9)" }}
            >
              {/* Погрузчик */}
              <AnimatePresence>
                {!loaded && (
                  <motion.div
                    className="absolute inset-0 z-10 flex min-h-[38vmin] min-w-[52vmin] flex-col items-center justify-center gap-4 bg-ink-900"
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                  >
                    <motion.div
                      className="h-9 w-9 rotate-45 border border-gold-400/80"
                      animate={{ rotate: [45, 135, 45], scale: [1, 0.72, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <p className="font-serif text-sm tracking-[0.24em] text-gold-300/70 uppercase">
                      Мастер поднимает занавес…
                    </p>
                    <div className="relative h-px w-40 overflow-hidden bg-gold-700/30">
                      <div className="animate-shimmer absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-gold-200/90 to-transparent" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.img
                src={src}
                alt={title}
                draggable={false}
                onLoad={() => setLoaded(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: loaded ? 1 : 0 }}
                transition={{ duration: 0.6 }}
                className="block h-auto w-auto max-w-[86vw] min-w-min max-h-[56dvh] object-contain select-none sm:max-w-[76vw] sm:max-h-[64dvh]"
              />

              {/* Внутренняя тень и пробежка света */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: "inset 0 0 60px 18px rgba(0,0,0,0.55)" }}
                aria-hidden
              />
              {loaded && (
                <motion.div
                  className="pointer-events-none absolute top-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-140%", skewX: -14 }}
                  animate={{ x: "420%" }}
                  transition={{ delay: 0.35, duration: 1.3, ease: [0.3, 0, 0.2, 1] }}
                  aria-hidden
                />
              )}
            </div>
          </div>
        </div>

        {/* Табличка */}
        <div className="relative z-10 flex w-full max-w-[92vw] flex-col items-center gap-2 text-center sm:max-w-2xl">
          <motion.div
            className="flex w-full items-center gap-4 text-gold-300/90"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <span className="hairline flex-1" />
            <span className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.42em] uppercase sm:text-xs">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {kindLabel}
              <span className="inline-block h-1 w-1 rotate-45 bg-gold-400" />
            </span>
            <span className="hairline flex-1" />
          </motion.div>
          <motion.figcaption
            className="text-gold-grad engraved font-display text-[clamp(1.6rem,4.6vw,2.9rem)] leading-[1.05] font-semibold tracking-wide text-balance"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.02, duration: 0.65 }}
          >
            {title}
          </motion.figcaption>
          {by ? (
            <motion.p
              className="font-serif text-base italic text-fog sm:text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.18, duration: 0.6 }}
            >
              {by}
            </motion.p>
          ) : null}
        </div>
      </motion.figure>

      {/* Занавес */}
      {(["left", "right"] as const).map((side) => (
        <motion.div
          key={side}
          className="velvet absolute top-0 z-20 h-full w-1/2"
          style={side === "left" ? { left: 0 } : { right: 0 }}
          initial={{ x: "0%" }}
          animate={{ x: side === "left" ? "-102%" : "102%" }}
          exit={{ x: "0%", transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] } }}
          transition={{ delay: 0.22, duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden
        />
      ))}
      <motion.span
        className="absolute inset-x-0 top-0 z-30 h-[3px] bg-gradient-to-r from-gold-700 via-gold-200 to-gold-700"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ delay: 0.22, duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
        aria-hidden
      />

      {/* Крестик */}
      <motion.button
        type="button"
        onClick={onClose}
        aria-label="Закрыть показ"
        className="group absolute top-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/80 text-gold-200 ring-1 ring-gold-500/60 backdrop-blur-md transition-colors hover:bg-gold-500 hover:text-ink-950 sm:top-6 sm:right-6"
        style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.7), 0 0 24px rgba(201,162,39,0.25)" }}
        initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.5, rotate: 90, transition: { duration: 0.25 } }}
        transition={{ delay: 1.1, type: "spring", stiffness: 300, damping: 18 }}
        whileHover={{ scale: 1.08, rotate: 90 }}
        whileTap={{ scale: 0.92 }}
      >
        <X className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.8} />
      </motion.button>

      {/* Подсказка */}
      <motion.p
        className="absolute inset-x-0 bottom-4 z-40 flex items-center justify-center gap-2 px-6 text-center text-[11px] tracking-[0.22em] text-fog/90 uppercase sm:bottom-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ delay: 1.3, duration: 6, times: [0, 0.12, 0.8, 1] }}
        aria-hidden
      >
        <Sparkles className="h-3.5 w-3.5 text-gold-400" />
        Esc, крестик{canDrag ? " или свайп вниз" : ""} — закрыть
      </motion.p>
    </motion.div>
  );
}
