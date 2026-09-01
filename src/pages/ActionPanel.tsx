import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Drama,
  EyeOff,
  Flame,
  FolderOpen,
  Gem,
  Image as ImageIcon,
  ImageOff,
  Link2,
  Loader2,
  Lock,
  Map as MapIcon,
  MapPin,
  MonitorUp,
  RefreshCw,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import {
  DEMO_ARTWORKS,
  KIND_FILTERS,
  KIND_LABEL,
  type ShowRequest,
  type ShowState,
} from "../lib/artworks";
import {
  clearShowState,
  getPlayerName,
  getRole,
  kindFromLayer,
  listSceneArts,
  makeViewerUrl,
  onShowStateChange,
  readShowState,
  setShowState,
  waitForOwlbear,
  type OBRClient,
  type SceneArt,
} from "../lib/obr";
import { useObrTheme } from "../lib/theme";

const KIND_ICON: Record<string, typeof User> = {
  npc: User,
  location: MapPin,
  artifact: Gem,
  encounter: Flame,
  map: MapIcon,
};

/** Скелет загрузки. */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl"
          style={{ background: "var(--panel-card-2)" }}
        />
      ))}
    </div>
  );
}

export function ActionPanel() {
  const themeMode = useObrTheme();
  const [client, setClient] = useState<OBRClient | null>(null);
  const [checked, setChecked] = useState(false);
  const [demo, setDemo] = useState(false);
  const [role, setRole] = useState<"GM" | "PLAYER">("GM");
  const [master, setMaster] = useState("Мастер");

  const [items, setItems] = useState<SceneArt[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [live, setLive] = useState<ShowState | null>(null);

  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customKind, setCustomKind] = useState("location");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demoArts = useMemo(
    () =>
      DEMO_ARTWORKS.map((a): SceneArt => ({
        id: a.id,
        name: a.title,
        url: a.src,
        layer: a.kind,
        kind: a.kind,
      })),
    [],
  );

  const refresh = useCallback(async (obr: OBRClient) => {
    setLoading(true);
    const found = await listSceneArts(obr);
    setItems(found);
    setLoading(false);
  }, []);

  /* Подключение к Owlbear Rodeo */
  useEffect(() => {
    let alive = true;
    const offs: (() => void)[] = [];

    void (async () => {
      const obr = await waitForOwlbear();
      if (!alive) return;
      setChecked(true);

      if (!obr) return;

      setClient(obr);
      setRole(await getRole(obr));
      setMaster(await getPlayerName(obr));
      await refresh(obr);
      if (!alive) return;

      offs.push(obr.scene.items.onChange(() => void refresh(obr)));
      offs.push(
        obr.player.onChange((player) =>
          setRole(player.role === "GM" ? "GM" : "PLAYER"),
        ),
      );
      offs.push(onShowStateChange(obr, (state) => setLive(state)));

      const current = await readShowState(obr);
      if (alive) setLive(current);
    })();

    return () => {
      alive = false;
      offs.forEach((off) => off());
    };
  }, [refresh]);

  const startDemo = useCallback(() => {
    setDemo(true);
    setItems(demoArts);
    setLoading(false);
  }, [demoArts]);

  const runShow = useCallback(
    async (req: ShowRequest) => {
      setBusy(true);
      setError(null);

      try {
        if (client && !demo) {
          const state = await setShowState(client, {
            ...req,
            by: master,
          });
          setLive(state);
        } else {
          window.open(makeViewerUrl(req), "_blank", "noopener");
          setLive({
            ...req,
            token: crypto.randomUUID(),
            createdAt: Date.now(),
          });
        }
      } catch {
        setError("Не удалось поднять занавес. Проверьте подключение к комнате.");
      } finally {
        setBusy(false);
      }
    },
    [client, demo, master],
  );

  const hide = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      if (client && !demo) await clearShowState(client);
      setLive(null);
    } catch {
      setError("Не удалось опустить занавес.");
    } finally {
      setBusy(false);
    }
  }, [client, demo]);

  /** Выбор картинки из хранилища стола (ассетов Owlbear). */
  const pickFromLibrary = useCallback(async () => {
    if (!client || demo) return;
    setError(null);

    try {
      const [chosen] = await client.assets.downloadImages(false, "арт");
      if (chosen) {
        await runShow({
          src: chosen.image.url,
          title: chosen.name?.trim() || "Без названия",
          kind: kindFromLayer(chosen.type),
        });
      }
    } catch {
      setError("Не удалось открыть хранилище.");
    }
  }, [client, demo, runShow]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((art) => {
      if (filter !== "all" && art.kind !== filter) return false;
      if (
        q &&
        !art.name.toLowerCase().includes(q) &&
        !art.url.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [items, query, filter]);

  const locked = Boolean(client) && !demo && role !== "GM";
  const showCustom = () => {
    const src = url.trim();
    if (!src) return;
    void runShow({
      src,
      title: customTitle.trim() || "Без названия",
      kind: customKind,
    });
  };

  return (
    <div
      className={`panel-shell ${themeMode === "LIGHT" ? "theme-light" : ""}`}
    >
      {/* ---------- шапка ---------- */}
      <header
        className="relative flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: "1px solid var(--panel-line)" }}
      >
        <div className="relative shrink-0">
          <img
            src="icon.png"
            alt=""
            className="h-11 w-11 rounded-xl object-cover"
            style={{
              boxShadow:
                "0 0 0 1px var(--panel-line-strong), 0 10px 24px -12px var(--panel-shadow)",
            }}
          />
          {live && (
            <span
              className="live-dot absolute -right-0.5 -top-0.5"
              title="В эфире"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[20px] leading-none font-semibold tracking-[0.16em] text-gold-200">
            ЗАНАВЕС
          </p>
          <p
            className="mt-1 text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ color: "var(--panel-dim)" }}
          >
            Пульт мастера · показ артов
          </p>
        </div>

        <span
          className="chip pointer-events-none"
          style={{ cursor: "default" }}
        >
          {demo ? (
            <Sparkles className="h-3 w-3" />
          ) : locked ? (
            <Lock className="h-3 w-3" />
          ) : (
            <MonitorUp className="h-3 w-3" />
          )}
          {demo ? "Демо" : locked ? "Игрок" : role === "GM" ? "Мастер" : "Игрок"}
        </span>
      </header>

      {/* ---------- содержимое ---------- */}
      <div className="panel-scroll">
        <div className="space-y-4 px-4 py-4">
          {/* ожидание подключения */}
          {!checked && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
              <p
                className="text-[11px] font-bold tracking-[0.24em] uppercase"
                style={{ color: "var(--panel-dim)" }}
              >
                Поднимаемся на сцену…
              </p>
            </div>
          )}

          {/* вне Owlbear — предложить демо */}
          {checked && !client && !demo && (
            <div className="card px-5 py-8 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-gold-500/30 bg-gold-500/10">
                <Drama className="h-6 w-6 text-gold-300" />
              </div>
              <p className="font-display text-lg font-semibold text-gold-200">
                Пульт живёт внутри Owlbear Rodeo
              </p>
              <p
                className="mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed"
                style={{ color: "var(--panel-dim)" }}
              >
                Откройте расширение в комнате стола или посмотрите, как всё
                работает, на примерах.
              </p>
              <button
                type="button"
                className="btn-primary mt-5"
                onClick={startDemo}
              >
                <Sparkles className="h-4 w-4" />
                Попробовать в демо
              </button>
            </div>
          )}

          {/* запрет для игроков */}
          {locked && (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-gold-500/30 bg-gold-500/10">
                <Lock className="h-6 w-6 text-gold-300" />
              </div>
              <p className="font-display text-xl font-semibold text-gold-200">
                Только для мастера
              </p>
              <p
                className="max-w-[280px] text-[13px] leading-relaxed"
                style={{ color: "var(--panel-dim)" }}
              >
                Пульт «Занавеса» доступен мастеру стола. Игроки увидят арт,
                когда мастер поднимет занавес.
              </p>
            </div>
          )}

          {/* рабочий пульт */}
          {(demo || (checked && client && role === "GM")) && (
            <>
              {/* сейчас в эфире */}
              {live && (
                <div
                  className="card relative overflow-hidden p-3"
                  style={{
                    borderColor: "rgba(201,162,39,0.65)",
                    background:
                      "linear-gradient(120deg, rgba(201,162,39,0.16), rgba(201,162,39,0.05))",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={live.src}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                      style={{
                        boxShadow:
                          "0 0 0 1px rgba(217,181,108,0.6), 0 8px 20px -10px rgba(0,0,0,0.7)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[10px] font-extrabold tracking-[0.22em] text-gold-300 uppercase">
                        <span className="live-dot" />
                        Сейчас на экранах
                      </p>
                      <p className="font-display mt-1.5 truncate text-[15px] leading-tight text-gold-100">
                        {live.title}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-ghost btn-danger shrink-0"
                      onClick={() => void hide()}
                      disabled={busy}
                    >
                      {busy ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <EyeOff className="h-3.5 w-3.5" />
                      )}
                      Скрыть
                    </button>
                  </div>
                </div>
              )}

              {/* поиск */}
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--panel-dim)" }}
                />
                <input
                  className="field pr-9 pl-9"
                  placeholder="Найти арт по имени…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="absolute top-1/2 right-2.5 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full"
                    style={{ color: "var(--panel-dim)" }}
                    onClick={() => setQuery("")}
                    aria-label="Очистить поиск"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* фильтры */}
              <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5">
                {KIND_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`chip ${filter === f.id ? "chip-active" : ""}`}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* сетка артов */}
              <section>
                <div
                  className="mb-2 flex items-center justify-between"
                  style={{ color: "var(--panel-dim)" }}
                >
                  <h2 className="text-[10px] font-extrabold tracking-[0.24em] uppercase">
                    Картинки на сцене · {items.length}
                  </h2>
                  {client && !demo && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="btn-ghost btn-ghost-sm"
                        onClick={() => void pickFromLibrary()}
                        disabled={busy}
                        title="Выбрать из хранилища стола"
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        Хранилище
                      </button>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-lg text-gold-300 transition hover:text-gold-100"
                        onClick={() => void refresh(client)}
                        title="Обновить список"
                        aria-label="Обновить список"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <SkeletonGrid />
                ) : filtered.length === 0 ? (
                  <div className="card flex flex-col items-center gap-2 px-4 py-8 text-center">
                    <ImageOff
                      className="h-6 w-6"
                      style={{ color: "var(--panel-dim)" }}
                    />
                    <p
                      className="max-w-[260px] text-[13px] leading-relaxed"
                      style={{ color: "var(--panel-dim)" }}
                    >
                      {items.length === 0
                        ? "На сцене нет картинок — добавьте арт или вставьте ссылку ниже."
                        : "Ничего не нашлось. Попробуйте другой запрос."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {filtered.map((art) => {
                      const Icon = KIND_ICON[art.kind] ?? ImageIcon;
                      const isLive = live?.src === art.url;

                      return (
                        <button
                          key={art.id}
                          type="button"
                          className={`art-card group ${isLive ? "art-live" : ""}`}
                          onClick={() =>
                            void runShow({
                              src: art.url,
                              title: art.name,
                              kind: art.kind,
                            })
                          }
                          title={`Показать «${art.name}» игрокам`}
                        >
                          <img src={art.url} alt={art.name} loading="lazy" />
                          <span
                            className="pointer-events-none absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(180deg, transparent 30%, rgba(5,4,2,0.92) 100%)",
                            }}
                          />
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-1.5 p-2.5">
                            <span className="min-w-0 flex-1 truncate text-left text-[11px] font-bold text-parchment">
                              {art.name}
                            </span>
                            <Icon className="h-3.5 w-3.5 shrink-0 text-gold-300/90" />
                          </span>
                          {isLive && (
                            <span className="live-badge absolute top-2 right-2">
                              В эфире
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* арт по ссылке */}
              <details className="card overflow-hidden">
                <summary
                  className="flex cursor-pointer list-none items-center gap-2 px-4 py-3.5 text-[10px] font-extrabold tracking-[0.22em] uppercase select-none"
                  style={{ color: "var(--panel-dim)" }}
                >
                  <Link2 className="h-3.5 w-3.5 text-gold-400" />
                  Арт по ссылке
                  <ChevronDown
                    className="zv-chevron ml-auto h-4 w-4"
                    style={{ color: "var(--panel-dim)" }}
                  />
                </summary>
                <div
                  className="space-y-2.5 px-4 pt-3 pb-4"
                  style={{ borderTop: "1px solid var(--panel-line)" }}
                >
                  <input
                    className="field"
                    placeholder="https://…/картина.jpg"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input
                      className="field min-w-0 flex-1"
                      placeholder="Название"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                    <select
                      className="field w-[128px] shrink-0"
                      value={customKind}
                      onChange={(e) => setCustomKind(e.target.value)}
                    >
                      {["npc", "location", "artifact", "encounter", "map"].map(
                        (k) => (
                          <option key={k} value={k}>
                            {KIND_LABEL[k]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full"
                    disabled={busy || !url.trim()}
                    onClick={showCustom}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Drama className="h-4 w-4" />
                    )}
                    Показать игрокам
                  </button>
                </div>
              </details>

              {error && (
                <p
                  className="rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold"
                  style={{
                    borderColor: "rgba(224,120,64,0.4)",
                    background: "rgba(74,29,29,0.35)",
                    color: "#f2b3a9",
                  }}
                >
                  {error}
                </p>
              )}

              <p
                className="pb-1 text-center text-[11px] leading-relaxed"
                style={{ color: "var(--panel-dim)" }}
              >
                Клик по картинке — показ почти во весь экран, в золотой раме.
                <br />
                Работает у всех игроков, на ПК и телефонах.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
