import { useEffect, useMemo, useState } from "react";
import { FullscreenArt } from "../components/FullscreenArt";
import { MODAL_ID, waitForOwlbear } from "../lib/obr";
import type { ShowRequest } from "../lib/artworks";
import { Drama, RotateCcw } from "lucide-react";

/**
 * Страница модала: Owlbear открывает её во весь экран (fullScreen + hidePaper),
 * поэтому фон страницы — полностью прозрачный, а всю красоту рисует FullscreenArt.
 */
export function ViewerPage() {
  const show = useMemo<ShowRequest | null>(() => {
    const q = new URLSearchParams(window.location.search);
    const src = q.get("src");
    if (!src) return null;
    return {
      src,
      title: q.get("title") || "Без названия",
      kind: q.get("kind") || "artifact",
      by: q.get("by") || undefined,
    };
  }, []);

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Прозрачный фон, чтобы под рамой просвечивал интерфейс Owlbear
    const root = document.documentElement;
    root.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      root.style.background = "";
      document.body.style.background = "";
    };
  }, []);

  const close = async () => {
    setVisible(false);
    const obr = await waitForOwlbear(600);
    if (obr) {
      try {
        await obr.modal.close(MODAL_ID);
      } catch {
        /* уже закрыт */
      }
    }
  };

  if (!show) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-950 p-8 text-center">
        <Drama className="h-10 w-10 text-gold-400" />
        <p className="font-display text-2xl font-semibold text-gold-200">
          Занавес пока закрыт
        </p>
        <p className="max-w-sm text-sm leading-relaxed text-fog">
          Это экран зрителя. Когда мастер покажет арт, он появится здесь почти на весь
          экран — в золотой раме, с крестиком.
        </p>
        <a
          href="/"
          className="mt-2 rounded-lg border border-gold-500/40 px-4 py-2 text-sm font-semibold text-gold-200 transition hover:bg-gold-500 hover:text-ink-950"
        >
          На главную
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-dvh" style={{ background: "transparent" }}>
      <FullscreenArt show={visible ? show : null} onClose={close} />
      {!visible && (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ink-950 p-8 text-center">
          <p className="font-display text-2xl font-semibold text-gold-200">Занавес опущен</p>
          <button
            type="button"
            onClick={() => setVisible(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gold-500/40 px-4 py-2 text-sm font-semibold text-gold-200 transition hover:bg-gold-500 hover:text-ink-950"
          >
            <RotateCcw className="h-4 w-4" />
            Показать ещё раз
          </button>
        </div>
      )}
    </div>
  );
}
