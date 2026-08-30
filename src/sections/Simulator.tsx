import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MonitorUp, Radio, X, Pointer } from "lucide-react";
import { ActionPanel } from "../pages/ActionPanel";
import { Corner, FullscreenArt } from "../components/FullscreenArt";
import { DEMO_ARTWORKS, KIND_LABEL, type ShowRequest } from "../lib/artworks";

/** Миниатюрная рама в окне предпросмотра «экрана игроков» */
function MiniReveal({ live, onClose }: { live: ShowRequest; onClose: () => void }) {
  return (
    <motion.div
      key={live.src}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-ink-950/80 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative w-fit max-w-[86%]"
        initial={{ scale: 0.86, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="relative rounded-[3px] p-[5px]"
          style={{
            background:
              "linear-gradient(160deg,#6b5320,#e9cf8e 20%,#7a5e26 55%,#caa64f 90%)",
            boxShadow: "0 24px 60px -12px rgba(0,0,0,0.9)",
          }}
        >
          <Corner className="pointer-events-none absolute -top-1 -left-1 h-6 w-6" />
          <Corner rotate={90} className="pointer-events-none absolute -top-1 -right-1 h-6 w-6" />
          <Corner rotate={180} className="pointer-events-none absolute -right-1 -bottom-1 h-6 w-6" />
          <Corner rotate={270} className="pointer-events-none absolute -bottom-1 -left-1 h-6 w-6" />
          <img
            src={live.src}
            alt={live.title}
            className="block h-auto w-auto max-h-[54cqh] max-w-full object-contain"
          />
        </div>
        <p className="engraved font-display text-gold-grad mt-3 text-center text-lg leading-tight font-semibold tracking-wide">
          {live.title}
        </p>
        <p className="mt-0.5 text-center text-[10px] font-bold tracking-[0.3em] text-gold-300/80 uppercase">
          {KIND_LABEL[live.kind] ?? "Сцена"}
        </p>
      </motion.div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть в предпросмотре"
        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/90 text-gold-200 ring-1 ring-gold-500/60 transition hover:bg-gold-500 hover:text-ink-950"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function Simulator({ onTakeover }: { onTakeover?: (req: ShowRequest) => void }) {
  const [live, setLive] = useState<ShowRequest | null>(null);
  const [takeover, setTakeover] = useState<ShowRequest | null>(null);
  const [auto, setAuto] = useState(true);

  const demoArts = DEMO_ARTWORKS.map((a) => ({
    id: a.id,
    name: a.title,
    url: a.src,
    kind: a.kind,
  }));

  const handleShow = (req: ShowRequest) => {
    setLive(req);
    if (auto) {
      setTakeover(req);
      onTakeover?.(req);
    }
  };

  return (
    <section id="demo" className="relative mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mb-10 text-center sm:mb-14">
        <p className="text-[11px] font-bold tracking-[0.38em] text-gold-400 uppercase">
          Живая репетиция
        </p>
        <h2 className="text-gold-grad engraved mx-auto mt-4 font-display text-[clamp(2rem,6vw,3.6rem)] leading-tight font-semibold">
          Сцена в вашем браузере
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-fog sm:text-base">
          Слева — пульт мастера, ровно тот же, что появится в Owlbear Rodeo. Справа —
          экран игрока. Нажмите на арт — и занавес поднимется. А ещё он откроется
          поверх этого сайта, как у игроков на столе.
        </p>
        <label className="mt-6 inline-flex cursor-pointer items-center gap-3 rounded-full border border-gold-500/30 bg-ink-900/70 px-4 py-2 text-[12px] font-semibold text-gold-200 select-none">
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) => setAuto(e.target.checked)}
            className="h-4 w-4 accent-[#c9a227]"
          />
          Открывать на моём экране — как у игроков
        </label>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[400px_1fr]">
        {/* Пульт мастера */}
        <div className="overflow-hidden rounded-2xl ring-1 ring-gold-500/25 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
          <ActionPanel
            demo
            embedded
            demoArts={demoArts}
            onDemoShow={handleShow}
            onDemoHide={() => {
              setLive(null);
              setTakeover(null);
            }}
          />
        </div>

        {/* Экран игрока */}
        <div>
          <div
            className="relative aspect-[16/10] overflow-hidden rounded-2xl ring-1 ring-gold-500/25 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]"
            style={{ containerType: "size" }}
          >
            <img
              src="/images/hero-bg.jpg"
              alt=""
              className="absolute inset-0 h-full w-full scale-105 object-cover opacity-35 blur-[3px]"
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 to-transparent" />
            <AnimatePresence>
              {live ? (
                <MiniReveal live={live} onClose={() => setLive(null)} />
              ) : (
                <motion.div
                  key="empty"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Pointer className="h-6 w-6 text-gold-400/70" />
                  <p className="max-w-[240px] font-serif text-sm text-parchment/60 italic">
                    Игрок пока видит сцену и ждёт — выберите арт в пульте мастера
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-fog uppercase">
              <Radio
                className={`h-3.5 w-3.5 ${live ? "animate-soft-pulse text-gold-400" : "text-fog/50"}`}
              />
              Экран игроков{live ? " — в эфире" : " — ожидание"}
            </p>
            <button
              type="button"
              disabled={!live}
              onClick={() => live && setTakeover(live)}
              className="inline-flex items-center gap-2 rounded-lg border border-gold-500/40 px-3.5 py-2 text-[12px] font-bold text-gold-200 transition hover:bg-gold-500 hover:text-ink-950 disabled:opacity-35"
            >
              <MonitorUp className="h-4 w-4" />
              Открыть на весь экран сейчас
            </button>
          </div>
        </div>
      </div>

      {/* Реальный полноэкранный показ поверх сайта */}
      <FullscreenArt show={takeover} onClose={() => setTakeover(null)} />
    </section>
  );
}
