import type { ShowRequest } from "./artworks";

/** Идентификатор расширения */
export const EXT_ID = "zanaves";
/** Ключ в metadata комнаты */
export const SHOW_KEY = `${EXT_ID}/current`;
/** ID полноэкранного модала */
export const MODAL_ID = `${EXT_ID}/viewer`;

export type OBRClient = typeof import("@owlbear-rodeo/sdk").default;

export interface SceneArt {
  id: string;
  name: string;
  url: string;
  layer: string;
}

function guessKind(layer: string): string {
  const l = layer.toUpperCase();

  if (l === "CHARACTER" || l === "MOUNT") return "npc";

  if (
    l === "MAP" ||
    l === "PROP" ||
    l === "DRAWING" ||
    l === "GRID"
  ) {
    return "location";
  }

  return "artifact";
}

/** Ждём, пока приложение окажется внутри Owlbear Rodeo. */
export async function waitForOwlbear(
  timeout = 1800,
): Promise<OBRClient | null> {
  try {
    const mod = await import("@owlbear-rodeo/sdk");
    const OBR = mod.default;

    return await new Promise<OBRClient | null>((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, timeout);

      OBR.onReady(() => {
        if (settled) return;

        settled = true;
        clearTimeout(timer);
        resolve(OBR);
      });
    });
  } catch {
    return null;
  }
}

export async function getRole(
  OBR: OBRClient,
): Promise<"GM" | "PLAYER"> {
  try {
    return (await OBR.player.getRole()) === "GM"
      ? "GM"
      : "PLAYER";
  } catch {
    return "PLAYER";
  }
}

export async function getPlayerName(
  OBR: OBRClient,
): Promise<string> {
  try {
    return await OBR.player.getName();
  } catch {
    return "Мастер";
  }
}

/** Все картинки сцены */
export async function listSceneArts(
  OBR: OBRClient,
): Promise<SceneArt[]> {
  try {
    const items = await OBR.scene.items.getItems(
      (item) => item.type === "IMAGE",
    );

    return items
      .map((item) => {
        const img = item as unknown as {
          image: { url: string };
        };

        return {
          id: item.id,
          name: item.name?.trim() || "Без названия",
          url: img.image.url,
          layer: String(item.layer),
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, "ru"),
      );
  } catch {
    return [];
  }
}

/** Показать всем */
export async function broadcastShow(
  OBR: OBRClient,
  req: ShowRequest,
): Promise<void> {
  await OBR.room.setMetadata({
    [SHOW_KEY]: {
      ...req,
      token: crypto.randomUUID(),
      createdAt: Date.now(),
      gmOnly: false,
    },
  });
}

/** Скрыть у всех */
export async function broadcastHide(
  OBR: OBRClient,
): Promise<void> {
  await OBR.room.setMetadata({
    [SHOW_KEY]: null,
  });
}

/**
 * Совместимость.
 * Теперь эти функции ничего не открывают —
 * полноэкранным показом управляет background.js.
 */

export async function openShowModal(
  _OBR: OBRClient,
  _req: ShowRequest,
): Promise<void> {
  return;
}

export async function closeShowModal(
  _OBR: OBRClient,
): Promise<void> {
  return;
}

export function kindFromLayer(layer: string): string {
  return guessKind(layer);
}
