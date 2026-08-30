import { motion } from "framer-motion";
import { Drama, Download, ChevronDown } from "lucide-react";
import { DEMO_ARTWORKS } from "../lib/artworks";
import { Dust } from "../components/FullscreenArt";

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* Фон */}
      <div className="absolute inset-0" aria-hidden>
        <img
          src="/images/hero-bg.jpg"
          alt=""
          className="h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/80 via-ink-950/35 to-ink-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/70 via-transparent to-ink-950/70" />
        <div className="vignette absolute inset-0" />
      </div>
      <Dust count={18} />

      {/* Контент */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 pt-28 pb-16 text-center">
        <motion.p
          className="mb-6 flex items-center gap-3 text-[11px] font-bold tracking-[0.38em] text-gold-300/90 uppercase"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="hairline w-8" />
          Расширение для Owlbear Rodeo
          <span className="hairline w-8" />
        </motion.p>

        <motion.h1
          className="text-gold-grad engraved font-display text-[clamp(4rem,15vw,12rem)] leading-[0.9] font-bold tracking-[0.05em] select-none"
          initial={{ opacity: 0, y: 26, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          ЗАНАВЕС
        </motion.h1>

        <motion.p
          className="mt-6 font-serif text-[clamp(1.15rem,2.6vw,1.6rem)] text-parchment/90 italic"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          Мастер показывает. Игроки замирают.
        </motion.p>

        <motion.p
          className="mt-4 max-w-2xl text-sm leading-relaxed text-fog sm:text-base"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.48 }}
        >
          Одним кликом покажите внешность NPC, арт локации или артефакт почти на весь
          экран игроков — в золотой раме, с крестиком. Красиво на ПК и на телефоне.
        </motion.p>

        <motion.div
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.62 }}
        >
          <a
            href="#demo"
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-7 py-3.5 text-sm font-extrabold tracking-wide text-ink-950 uppercase shadow-[0_18px_44px_-12px_rgba(201,162,39,0.8)] transition hover:brightness-110 active:scale-[0.98]"
          >
            <Drama className="h-4.5 w-4.5" />
            Поднять занавес
          </a>
          <a
            href="#install"
            className="inline-flex items-center gap-2.5 rounded-xl border border-gold-500/40 bg-ink-900/50 px-7 py-3.5 text-sm font-bold tracking-wide text-gold-200 uppercase backdrop-blur-sm transition hover:border-gold-300 hover:bg-ink-800 active:scale-[0.98]"
          >
            <Download className="h-4.5 w-4.5" />
            Установить
          </a>
        </motion.div>
      </div>

      {/* Карусель артов */}
      <motion.div
        className="relative z-10 pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.9 }}
        aria-hidden
      >
        <div
          className="overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <div className="animate-marquee flex w-max gap-4 px-2">
            {[...DEMO_ARTWORKS, ...DEMO_ARTWORKS].map((a, i) => (
              <div
                key={`${a.id}-${i}`}
                className="group relative h-28 w-44 shrink-0 overflow-hidden rounded-md p-[3px] sm:h-32 sm:w-52"
                style={{
                  background:
                    "linear-gradient(160deg,#6b5320,#e9cf8e 30%,#7a5e26 60%,#caa64f)",
                }}
              >
                <img
                  src={a.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full rounded-[3px] object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-center">
          <ChevronDown className="h-5 w-5 animate-bounce text-gold-400/80" />
        </div>
      </motion.div>
    </section>
  );
}
