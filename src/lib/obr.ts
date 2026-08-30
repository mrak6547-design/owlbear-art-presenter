import type { ShowRequest } from "./artworks";

/** Идентификатор расширения — должен совпадать с public/manifest.json и public/background.js */
export const EXT_ID = "ru.curtain.showcase";
/** Канал рассылки «покажи/закрой» между фоном, пультом и зрителем */
export const CHANNEL = `${EXT_ID}/show`;
export const MODAL_ID = `${EXT_ID}/modal`;

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
  if (l === "MAP" || l === "PROP" || l === "DRAWING" || l === "GRID") return "location";
  return "artifact";
}

/** Ждём, пока приложение окажется внутри Owlbear Rodeo. Снаружи — аккуратно возвращаем null. */
export async function waitForOwlbear(timeout = 1800): Promise<OBRClient | null> {
  try {
    const mod = await import("@owlbear-rodeo/sdk");
    const OBR = mod.default;
    return await new Promise<OBRClient | null>((resolve) => {
      let settled = false;
      const t = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, timeout);
      OBR.onReady(() => {
        if (!settled) {
          settled = true;
          clearTimeout(t);
          resolve(OBR);
        }
      });
    });
  } catch {
    return null;
  }
}

export async function getRole(OBR: OBRClient): Promise<"GM" | "PLAYER"> {
  try {
    const role = await OBR.player.getRole();
    return role === "GM" ? "GM" : "PLAYER";
  } catch {
    return "PLAYER";
  }
}

export async function getPlayerName(OBR: OBRClient): Promise<string> {
  try {
    return await OBR.player.getName();
  } catch {
    return "Мастер";
  }
}

/** Все картинки текущей сцены — именно их мастер может показать игрокам */
export async function listSceneArts(OBR: OBRClient): Promise<SceneArt[]> {
  try {
    const items = await OBR.scene.items.getItems((item) => item.type === "IMAGE");
    return items
      .map((item) => {
        // Выше отфильтрованы только IMAGE-предметы, у них всегда есть поле image
        const withImage = item as unknown as { image: { url: string } };
        return {
          id: item.id,
          name: item.name?.trim() || "Без названия",
          url: withImage.image.url,
          layer: String(item.layer),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  } catch {
    return [];
  }
}

export async function broadcastShow(OBR: OBRClient, req: ShowRequest): Promise<void> {
  await OBR.broadcast.sendMessage(CHANNEL, { action: "show", ...req });
}

export async function broadcastHide(OBR: OBRClient): Promise<void> {
  await OBR.broadcast.sendMessage(CHANNEL, { action: "hide" });
}

export async function openShowModal(OBR: OBRClient, req: ShowRequest): Promise<void> {
  const params = new URLSearchParams({
    mode: "modal",
    src: req.src,
    title: req.title,
    kind: req.kind,
    by: req.by ?? "",
  });
  try {
    await OBR.modal.close(MODAL_ID);
  } catch {
    /* модала ещё нет — не страшно */
  }
  await OBR.modal.open({
    id: MODAL_ID,
    url: `/?${params.toString()}`,
    fullScreen: true,
    hidePaper: true,
  });
}

export async function closeShowModal(OBR: OBRClient): Promise<void> {
  try {
    await OBR.modal.close(MODAL_ID);
  } catch {
    /* уже закрыт */
  }
}

export function kindFromLayer(layer: string): string {
  return guessKind(layer);
}
