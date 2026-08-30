import { useState } from "react";
import { motion } from "framer-motion";
import {
  Drama,
  Maximize2,
  MonitorSmartphone,
  X,
  Link2,
  Copy,
  Check,
  FolderGit2,
  PlusCircle,
  MousePointerClick,
  type LucideIcon,
} from "lucide-react";
import { Hero } from "../sections/Hero";
import { Simulator } from "../sections/Simulator";

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Maximize2,
    title: "Почти весь экран",
    text: "Полноэкранный показ поверх всего интерфейса Owlbear: золотая рама, занавес, свет и киношное зерно.",
  },
  {
    icon: MousePointerClick,
    title: "Один клик мастера",
    text: "ПКМ по картинке на сцене — «Показать игрокам». Или выбор из пульта: арты сцены и ссылки.",
  },
  {
    icon: MonitorSmartphone,
    title: "ПК и телефон",
    text: "Рама адаптируется под любой экран. На сенсоре показ закрывается и свайпом вниз.",
  },
  {
    icon: X,
    title: "Привычное закрытие",
    text: "Крестик в углу рамы или Esc. Мастер может опустить занавес у всех игроков одной кнопкой.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mb-10 text-center sm:mb-14">
      <p className="text-[11px] font-bold tracking-[0.38em] text-gold-400 uppercase">
        {eyebrow}
      </p>
      <h2 className="text-gold-grad engraved mx-auto mt-4 font-display text-[clamp(2rem,6vw,3.6rem)] leading-tight font-semibold">
        {title}
      </h2>
      {text ? (
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-fog sm:text-base">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading
        eyebrow="Возможности"
        title="Театр вместо часовых меток"
        text="Расширение собрано вокруг одного действия: показать арт игрокам так, чтобы в комнате стало тихо."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <motion.article
            key={f.title}
            className="group relative overflow-hidden rounded-2xl border border-gold-500/15 bg-gradient-to-b from-ink-850/80 to-ink-900/80 p-6 transition hover:border-gold-500/40 sm:p-7"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
          >
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl transition group-hover:bg-gold-500/20" />
            <div className="mb-5 grid h-11 w-11 rotate-45 place-items-center rounded-lg border border-gold-500/50 bg-ink-950 shadow-[0_0_24px_rgba(201,162,39,0.25)]">
              <f.icon className="h-5 w-5 -rotate-45 text-gold-300" />
            </div>
            <h3 className="font-display text-xl font-semibold tracking-wide text-gold-100">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-fog">{f.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

const STEPS: { num: string; title: string; text: string }[] = [
  {
    num: "01",
    title: "Мастер показывает",
    text: "ПКМ по картинке на сцене — «Показать игрокам». Либо пульт: картинки сцены и арты по ссылке.",
  },
  {
    num: "02",
    title: "Занавес поднимается у всех",
    text: "Рассылка по каналу расширения. У каждого игрока открывается полноэкранная «сцена» с рамой и светом.",
  },
  {
    num: "03",
    title: "Игрок закрывает",
    text: "Крестик, Esc или свайп вниз на телефоне. Мастер одной кнопкой опускает занавес у всех.",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-900/40 to-ink-950" />
      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.num}
            className="relative border-l-2 border-gold-500/40 pl-6"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: i * 0.1 }}
          >
            <p className="text-gold-grad font-display text-6xl leading-none font-bold">
              {s.num}
            </p>
            <h3 className="mt-4 font-display text-2xl font-semibold text-gold-100">
              {s.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-fog">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Install() {
  const [copied, setCopied] = useState(false);
  const manifestUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/manifest.json`
      : "/manifest.json";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(manifestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* буфер недоступен */
    }
  };

  return (
    <section id="install" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading
        eyebrow="Установка"
        title="Две минуты до премьеры"
        text="Расширение — статический сайт. Соберите, выложите на https-хостинг и добавьте манифест в комнату Owlbear."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            {
              icon: FolderGit2,
              title: "Выложите сборку",
              text: "npm run build → папка dist на GitHub Pages, Netlify или Vercel. Обязателен https.",
            },
            {
              icon: PlusCircle,
              title: "Добавьте в комнату",
              text: "Owlbear Rodeo → комната → «Extensions» → «Add Extensions» → URL манифеста ниже.",
            },
            {
              icon: Drama,
              title: "Поднимите занавес",
              text: "Значок появится в тулбаре сцены. ПКМ по картинке — «Показать игрокам».",
            },
          ].map((s, i) => (
            <motion.div
              key={s.title}
              className="flex gap-4 rounded-2xl border border-gold-500/15 bg-ink-900/60 p-5"
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold-500/15 ring-1 ring-gold-500/40">
                <s.icon className="h-5 w-5 text-gold-300" />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-gold-100">
                  {s.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-fog">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="relative overflow-hidden rounded-2xl border border-gold-500/20 bg-gradient-to-b from-ink-850 to-ink-900 p-6 sm:p-7"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute -top-10 -right-10 h-36 w-36 rounded-full bg-gold-500/10 blur-3xl" />
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] text-gold-400 uppercase">
            <Link2 className="h-3.5 w-3.5" />
            URL манифеста
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-gold-500/25 bg-ink-950 p-2 pl-4">
            <code className="flex-1 truncate font-mono text-[13px] text-gold-200">
              {manifestUrl}
            </code>
            <button
              type="button"
              onClick={copy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[12px] font-bold transition ${
                copied
                  ? "bg-gold-400 text-ink-950"
                  : "bg-gold-500/15 text-gold-200 hover:bg-gold-500 hover:text-ink-950"
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Готово" : "Копировать"}
            </button>
          </div>

          <div className="mt-6 space-y-2 font-mono text-[12.5px] leading-relaxed text-fog">
            <p className="text-gold-300/80"># что внутри сборки</p>
            <p>/manifest.json — точка входа расширения</p>
            <p>/background.js — контекстное меню и рассылка</p>
            <p>/?mode=action — пульт мастера (popover)</p>
            <p>/?mode=modal — экран показа (модал на весь экран)</p>
          </div>

          <p className="mt-6 rounded-lg border border-gold-500/20 bg-ink-950/60 px-4 py-3 text-[12px] leading-relaxed text-fog">
            Полноэкранный модал требует актуальный Owlbear API (SDK&nbsp;2.4+/3.x) — он уже
            подключён в background.js. Рассылка идёт только внутри вашей комнаты.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <div className="relative min-h-dvh bg-ink-950 text-parchment">
      {/* Шапка */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-gold-500/10 bg-ink-950/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
          <a href="#" className="flex items-center gap-2.5">
            <img src="/icon.png" alt="" className="h-8 w-8 rounded-md ring-1 ring-gold-500/50" />
            <span className="font-display text-lg font-bold tracking-[0.18em] text-gold-200">
              ЗАНАВЕС
            </span>
          </a>
          <nav className="ml-auto hidden items-center gap-7 text-[12px] font-bold tracking-[0.18em] text-fog uppercase md:flex">
            <a href="#demo" className="transition hover:text-gold-200">Демо</a>
            <a href="#features" className="transition hover:text-gold-200">Возможности</a>
            <a href="#how" className="transition hover:text-gold-200">Как работает</a>
            <a href="#install" className="transition hover:text-gold-200">Установка</a>
          </nav>
          <a
            href="#install"
            className="ml-auto rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 px-4 py-2 text-[12px] font-extrabold tracking-wide text-ink-950 uppercase transition hover:brightness-110 md:ml-0"
          >
            Установить
          </a>
        </div>
      </header>

      <Hero />
      <div className="hairline mx-auto w-1/2" />
      <Simulator />
      <div className="hairline mx-auto w-1/2" />
      <Features />
      <HowItWorks />
      <Install />

      {/* Подвал */}
      <footer className="border-t border-gold-500/10 py-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 text-center">
          <img src="/icon.png" alt="" className="h-10 w-10 rounded-lg opacity-80 ring-1 ring-gold-500/40" />
          <p className="font-display text-base tracking-[0.2em] text-gold-300/90">ЗАНАВЕС</p>
          <p className="max-w-md text-[12px] leading-relaxed text-fog">
            Расширение для столов Owlbear Rodeo. Арты в демо сгенерированы для
            презентации. Owlbear Rodeo — продукт его правообладателей.
          </p>
        </div>
      </footer>
    </div>
  );
}
