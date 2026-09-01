/**
 * Фоновый скрипт расширения «Занавес».
 *
 * Работает на КАЖДОМ клиенте (мастер и игроки) и делает три вещи:
 *  1. Добавляет мастеру пункт «Показать игрокам» в контекстное меню картинок.
 *  2. Слушает metadata комнаты — когда мастер запускает показ, модал
 *     открывается у всех; когда снимает показ — закрывается у всех.
 *  3. Подсвечивает значок действия, пока арт «в эфире».
 */

import OBR from "@owlbear-rodeo/sdk";
import {
  CONTEXT_ID,
  MODAL_ID,
  SHOW_KEY,
  kindFromLayer,
  makeViewerUrl,
  parseShowState,
  pickImage,
} from "./lib/obr";
import type { ShowRequest, ShowState } from "./lib/artworks";

/** Иконка пункта контекстного меню — золотая рамка с артом. */
const SHOW_ICON = "context-icon.svg";

let lastToken: string | null = null;

async function openViewer(state: ShowState) {
  const url = makeViewerUrl(state);

  const options = {
    id: MODAL_ID,
    url,
    fullScreen: true,
    hidePaper: true,
    hideBackdrop: true,
    disablePointerEvents: false,
  };

  try {
    await OBR.modal.open(options);
  } catch {
    // Если модал уже открыт — закрываем и открываем заново с новым артом.
    try {
      await OBR.modal.close(MODAL_ID);
      await OBR.modal.open(options);
    } catch (err) {
      console.error("[Занавес] не удалось открыть модал", err);
    }
  }
}

async function closeViewer() {
  try {
    await OBR.modal.close(MODAL_ID);
  } catch {
    /* модал и так закрыт */
  }
}

async function setBadge(live: boolean) {
  try {
    await OBR.action.setBadgeText(live ? "●" : undefined);
    if (live) {
      await OBR.action.setBadgeBackgroundColor("#c9a227");
    }
  } catch {
    /* action может быть недоступен на некоторых клиентах */
  }
}

/** Реагируем на изменение metadata комнаты. */
async function sync(metadata: Record<string, unknown>) {
  const state = parseShowState(metadata?.[SHOW_KEY]);

  if (!state) {
    lastToken = null;
    await closeViewer();
    await setBadge(false);
    return;
  }

  // Тот же самый показ — ничего не делаем.
  if (state.token === lastToken) return;

  lastToken = state.token;
  await openViewer(state);
  await setBadge(true);
}

/** Мастер запускает показ из контекстного меню. */
async function publish(req: ShowRequest) {
  try {
    const by = await OBR.player.getName().catch(() => "Мастер");

    await OBR.room.setMetadata({
      [SHOW_KEY]: {
        ...req,
        by: by?.trim() || "Мастер",
        token: crypto.randomUUID(),
        createdAt: Date.now(),
      },
    });
  } catch (err) {
    console.error("[Занавес] не удалось запустить показ", err);
  }
}

/** Регистрируем пункт в контекстном меню для мастеров. */
async function registerContextMenu() {
  try {
    await OBR.contextMenu.remove(CONTEXT_ID);
  } catch {
    /* ещё не создан */
  }

  await OBR.contextMenu.create({
    id: CONTEXT_ID,
    icons: [
      {
        icon: SHOW_ICON,
        label: "Показать игрокам",
        filter: {
          roles: ["GM"],
          some: [{ key: "type", value: "IMAGE" }],
        },
      },
    ],
    onClick: async (context) => {
      const image = pickImage(context.items);
      if (!image) return;

      await publish({
        src: image.image.url,
        title: image.name?.trim() || "Без названия",
        kind: kindFromLayer(image.layer),
      });
    },
  });
}

OBR.onReady(async () => {
  try {
    await registerContextMenu();
  } catch (err) {
    console.error("[Занавес] контекстное меню не создано", err);
  }

  OBR.room.onMetadataChange((metadata) => {
    void sync(metadata);
  });

  // Восстанавливаем показ при загрузке/обновлении страницы.
  try {
    const metadata = await OBR.room.getMetadata();
    await sync(metadata);
  } catch (err) {
    console.error("[Занавес] не удалось прочитать metadata комнаты", err);
  }
});
