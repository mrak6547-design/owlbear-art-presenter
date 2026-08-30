import { useCallback, useEffect, useState } from "react";
import {
  Drama,
  RotateCw,
  EyeOff,
  ImageOff,
  Lock,
  MonitorUp,
  Link2,
  Loader2,
  User,
  MapPin,
  Gem,
  Flame,
  Image as ImageIcon,
} from "lucide-react";
import { KIND_LABEL, type ShowRequest } from "../lib/artworks";
import {
  waitForOwlbear,
  getRole,
  getPlayerName,
  listSceneArts,
  broadcastShow,
  broadcastHide,
  kindFromLayer,
  type OBRClient,
  type SceneArt,
} from "../lib/obr";

const KIND_ICON: Record<string, typeof Gem> = {
  npc: User,
  location: MapPin,
  artifact: Gem,
  encounter: Flame,
};

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-ink-950 shadow-[0_10px_28px_-10px_rgba(201,162,39,0.8)] transition hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-gold-500/30 bg-ink-800/60 px-3.5 py-2 text-[13px] font-semibold text-gold-200 transition hover:border-gold-400/70 hover:bg-ink-700/70 active:scale-[0.98] disabled:opacity-40";

const input =
  "w-full rounded-lg border border-gold-500/20 bg-ink-900 px-3.5 py-2.5 text-sm text-parchment placeholder:text-fog/50 outline-none transition focus:border-gold-400/70 focus:ring-2 focus:ring-gold-500/20";

interface ActionPanelProps {
  demo?: boolean;
  demoArts?: { id: string; name: string; url: string; kind: string }[];
  onDemoShow?: (req: ShowRequest) => void;
  onDemoHide?: () => void;
  embedded?: boolean;
}

export function ActionPanel({
  demo = false,
  demoArts,
  onDemoShow,
  onDemoHide,
  embedded = false,
}: ActionPanelProps) {
  const [obr, setObr] = useState<OBRClient | null>(null);
  const [obrChecked, setObrChecked] = useState(false);
  const [demoMode, setDemoMode] = useState(demo);
  const [role, setRole] = useState<"GM" | "PLAYER">("GM");
  const [master, setMaster] = useState("Мастер");

  const [arts, setArts] = useState<SceneArt[]>([]);
  const [loadingArts, setLoadingArts] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("location");
  const [live, setLive] = useState<ShowRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async (client: OBRClient) => {
    setLoadingArts(true);
    setArts(await listSceneArts(client));
    setLoadingArts(false);
  }, []);

  useEffect(() => {
    let off: (() => void) | undefined;

    if (demo) {
      setObrChecked(true);
      setDemoMode(true);
      return;
    }

    waitForOwlbear().then(async (client) => {
      setObrChecked(true);
      if (!client) return;

      setObr(client);
      setMaster(await getPlayerName(client));
      setRole(await getRole(client));

      await refresh(client);

      const u: unknown = client.scene.items.onChange(() => void refresh(client));

      Promise.resolve(u as (() => void) | Promise<() => void>)
        .then((fn) => {
          off = typeof fn === "function" ? fn : undefined;
        })
        .catch(() => undefined);
    });

    return () => off?.();
  }, [demo, refresh]);

  useEffect(() => {
    if (!demoMode) return;

    setArts(
      (demoArts ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        layer: a.kind,
      })),
    );
    setLoadingArts(false);
  }, [demoMode, demoArts]);

  const show = async (req: ShowRequest) => {
    setErr(null);
    setBusy(true);

    try {
      if (demoMode || !obr) {
        onDemoShow?.(req);
      } else {
        await broadcastShow(obr, req);
        // ВАЖНО: модал больше не открывается здесь.
        // Его откроет background.js через OBR.modal.open(fullScreen).
      }

      setLive(req);
    } catch {
      setErr("Не удалось поднять занавес.");
    }

    setBusy(false);
  };

  const hide = async () => {
    setBusy(true);

    try {
      if (demoMode || !obr) {
        onDemoHide?.();
      } else {
        await broadcastHide(obr);
        // background.js сам закроет модал у всех.
      }

      setLive(null);
    } finally {
      setBusy(false);
    }
  };

  const showCustom = () => {
    const src = url.trim();
    if (!src) return;

    show({
      src,
      title: title.trim() || "Без названия",
      kind,
      by: master,
    });
  };

  const isLoading = !obrChecked && !demo;
  const locked = !demoMode && obr && role !== "GM";

  return (
    <div
      className={`w-full ${embedded ? "" : "mx-auto max-w-[440px]"} bg-ink-900 text-parchment`}
      style={{
        borderLeft: "1px solid rgba(217,181,108,0.14)",
        borderRight: "1px solid rgba(217,181,108,0.14)",
      }}
    >
      <div className="flex items-center gap-3 border-b border-gold-500/15 bg-ink-850/80 px-4 py-3.5">
        <img
          src="/icon.png"
          alt=""
          className="h-11 w-11 rounded-lg object-cover ring-1 ring-gold-500/40"
        />

        <div className="min-w-0 flex-1">
          <p className="font-display text-[22px] leading-none font-semibold tracking-[0.14em] text-gold-200">
            ЗАНАВЕС
          </p>

          <p className="mt-1 text-[11px] tracking-[0.18em] text-fog uppercase">
            Пульт мастера · показ артов
          </p>
        </div>

        <span className="flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-ink-800 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-gold-300 uppercase">
          {demoMode ? <MonitorUp className="h-3 w-3" /> : <Drama className="h-3 w-3" />}
          {demoMode ? "Демо" : locked ? "Игрок" : "Мастер"}
        </span>
      </div>

      <div className="space-y-5 px-4 py-5">
        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
            <p className="font-serif text-sm tracking-[0.2em] text-fog uppercase">
              Подключаемся к сцене…
            </p>
          </div>
        )}

        {!isLoading && obrChecked && !obr && !demoMode && (
          <div className="rounded-xl border border-dashed border-gold-500/30 bg-ink-850 p-5 text-center">
            <Drama className="mx-auto mb-3 h-8 w-8 text-gold-400" />
            <p className="font-display text-lg font-semibold text-gold-200">
              Панель живёт внутри Owlbear Rodeo
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-fog">
              Добавьте расширение в комнату.
            </p>
            <button
              type="button"
              onClick={() => setDemoMode(true)}
              className={`${btnPrimary} mt-4`}
            >
              <MonitorUp className="h-4 w-4" />
              Запустить демо
            </button>
          </div>
        )}

        {obrChecked && (demoMode || obr) && (
          <div className={locked ? "pointer-events-none opacity-45 select-none" : ""}>
            <div className="space-y-5">
              {live && (
                <div className="flex items-center gap-3 rounded-xl border border-gold-400/40 bg-gold-500/10 p-3">
                  <span className="animate-soft-pulse relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute h-full w-full rounded-full bg-gold-400" />
                  </span>

                  <p className="min-w-0 flex-1 text-[13px] font-semibold text-gold-100">
                    На экранах:{" "}
                    <span className="font-display text-sm tracking-wide">
                      «{live.title}»
                    </span>
                  </p>

                  <button type="button" onClick={hide} disabled={busy} className={btnGhost}>
                    <EyeOff className="h-3.5 w-3.5" />
                    Опустить занавес
                  </button>
                </div>
              )}

              <section>
                <div className="mb-2.5 flex items-center justify-between">
                  <h2 className="text-[11px] font-bold tracking-[0.24em] text-fog uppercase">
                    Картинки на сцене
                  </h2>

                  {!demoMode && (
                    <button
                      type="button"
                      onClick={() => obr && refresh(obr)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-gold-300 transition hover:text-gold-100"
                    >
                      <RotateCw
                        className={`h-3 w-3 ${loadingArts ? "animate-spin" : ""}`}
                      />
                      Обновить
                    </button>
                  )}
                </div>

                {loadingArts ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="h-24 animate-pulse rounded-lg bg-ink-800" />
                    ))}
                  </div>
                ) : arts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gold-500/25 px-4 py-7 text-center">
                    <ImageOff className="h-6 w-6 text-fog" />
                    <p className="text-[13px] leading-relaxed text-fog">
                      На сцене нет картинок.
                    </p>
                  </div>
                ) : (
                  <div className="grid max-h-[296px] grid-cols-2 gap-2 overflow-y-auto pr-0.5">
                    {arts.map((a) => {
                      const k = kindFromLayer(a.layer);
                      const Icon = KIND_ICON[k] ?? ImageIcon;

                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() =>
                            show({
                              src: a.url,
                              title: a.name,
                              kind: k,
                              by: master,
                            })
                          }
                          className="group relative h-24 overflow-hidden rounded-lg ring-1 ring-gold-500/20 transition hover:ring-gold-300/70"
                        >
                          <img
                            src={a.url}
                            alt={a.name}
                            className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-110"
                          />

                          <span className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/20 to-transparent" />

                          <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1 p-2">
                            <span className="truncate text-[12px] font-semibold text-parchment">
                              {a.name}
                            </span>
                            <Icon className="h-3.5 w-3.5 text-gold-300/90" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-gold-500/15 bg-ink-850/70 p-4">
                <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold tracking-[0.24em] text-fog uppercase">
                  <Link2 className="h-3.5 w-3.5 text-gold-400" />
                  Арт по ссылке
                </h2>

                <div className="space-y-2.5">
                  <input
                    className={input}
                    placeholder="https://…/арт.jpg"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <input
                      className={`${input} flex-1`}
                      placeholder="Название"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />

                    <select
                      className={`${input} w-[128px]`}
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      {["npc", "location", "artifact", "encounter"].map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={showCustom}
                    disabled={busy || !url.trim()}
                    className={`${btnPrimary} w-full`}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Drama className="h-4 w-4" />
                    )}

                    Поднять занавес для всех
                  </button>
                </div>
              </section>

              {err && (
                <p className="rounded-lg border border-wine-700 bg-wine-900/40 px-3.5 py-2.5 text-[12px] text-ember-400">
                  {err}
                </p>
              )}

              <p className="text-center text-[11px] leading-relaxed text-fog/80">
                Арт откроется у игроков почти на весь экран — в раме, с крестиком.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
