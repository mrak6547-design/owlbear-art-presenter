import type { Image, Item } from "@owlbear-rodeo/sdk";
import type { ShowRequest, ShowState } from "./artworks";

/** Идентификатор расширения. */
export const EXT_ID = "zanaves";
/** Ключ текущего показа в metadata комнаты. */
export const SHOW_KEY = `${EXT_ID}/state`;
/** ID полноэкранного модала у игроков. */
export const MODAL_ID = `${EXT_ID}/viewer`;
/** ID пункта контекстного меню. */
export const CONTEXT_ID = `${EXT_ID}/show-art`;

export type OBRClient = typeof import("@owlbear-rodeo/sdk").default;

export interface SceneArt {
  id: string;
  name: string;
  url: string;
  layer: string;
  kind: string;
}

/** «Догадываемся» о типе арта по слою, на котором лежит картинка. */
export function kindFromLayer(layer: string): string {
  const l = String(layer).toUpperCase();

  if (l === "CHARACTER" || l === "MOUNT" || l === "ATTACHMENT")
    return "npc";

  if (l === "MAP" || l === "GRID") return "map";

  if (l === "DRAWING") return "location";

  if (l === "PROP") return "artifact";

  return "encounter";
}

export function isImageItem(item: Item): item is Image {
  return item.type === "IMAGE";
}

/** Выбираем лучшую картинку из выделения: самую «крупную». */
export function pickImage(items: Item[]): Image | null {
  return (
    items
      .filter(isImageItem)
      .sort((a, b) => {
        const areaA = (a.image?.width ?? 0) * (a.image?.height ?? 0);
        const areaB = (b.image?.width ?? 0) * (b.image?.height ?? 0);
        return areaB - areaA || b.zIndex - a.zIndex;
      })[0] ?? null
  );
}

/** Проверка значения из metadata: это наш текущий показ? */
export function parseShowState(value: unknown): ShowState | null {
  if (!value || typeof value !== "object") return null;

  const v = value as Record<string, unknown>;

  if (typeof v.src !== "string" || !v.src) return null;
  if (typeof v.token !== "string" || !v.token) return null;

  return {
    src: v.src,
    title: typeof v.title === "string" ? v.title : "Без названия",
    kind: typeof v.kind === "string" && v.kind ? v.kind : "scene",
    by: typeof v.by === "string" ? v.by : undefined,
    token: v.token,
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
  };
}

/** URL полноэкранной страницы показа (относительно корня расширения). */
export function makeViewerUrl(req: ShowRequest): string {
  const base = new URL("index.html", window.location.href);
  base.search = new URLSearchParams({
    mode: "viewer",
    src: req.src,
    title: req.title ?? "",
    kind: req.kind ?? "",
    by: req.by ?? "",
  }).toString();
  return base.toString();
}

/** Ждём, пока страница окажется внутри Owlbear Rodeo. */
export async function waitForOwlbear(
  timeoutMs = 2500,
): Promise<OBRClient | null> {
  try {
    const mod = await import("@owlbear-rodeo/sdk");
    const OBR = mod.default;

    if (!OBR.isAvailable) return null;

    return await new Promise<OBRClient | null>((resolve) => {
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, timeoutMs);

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
  client: OBRClient,
): Promise<"GM" | "PLAYER"> {
  try {
    return (await client.player.getRole()) === "GM" ? "GM" : "PLAYER";
  } catch {
    return "PLAYER";
  }
}

export async function getPlayerName(
  client: OBRClient,
): Promise<string> {
  try {
    const name = await client.player.getName();
    return name?.trim() || "Мастер";
  } catch {
    return "Мастер";
  }
}

/** Все IMAGE-объекты текущей сцены (картинки из хранилища/сцены). */
export async function listSceneArts(
  client: OBRClient,
): Promise<SceneArt[]> {
  try {
    const items = await client.scene.items.getItems(
      (item): item is Image => item.type === "IMAGE",
    );

    return items
      .map((item): SceneArt => {
        const layer = String(item.layer);
        return {
          id: item.id,
          name: item.name?.trim() || "Без названия",
          url: item.image.url,
          layer,
          kind: kindFromLayer(layer),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  } catch {
    return [];
  }
}

/** Пишем состояние показа в metadata комнаты — увидят все клиенты. */
export async function setShowState(
  client: OBRClient,
  req: ShowRequest,
): Promise<ShowState> {
  const state: ShowState = {
    ...req,
    token: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  await client.room.setMetadata({ [SHOW_KEY]: state });
  return state;
}

/** Снимаем показ у всех. */
export async function clearShowState(
  client: OBRClient,
): Promise<void> {
  await client.room.setMetadata({ [SHOW_KEY]: null });
}

export async function readShowState(
  client: OBRClient,
): Promise<ShowState | null> {
  try {
    const metadata = await client.room.getMetadata();
    return parseShowState(metadata?.[SHOW_KEY]);
  } catch {
    return null;
  }
}

/** Подписка на изменение показа. Возвращает отписку. */
export function onShowStateChange(
  client: OBRClient,
  callback: (state: ShowState | null) => void,
): () => void {
  return client.room.onMetadataChange((metadata) => {
    callback(parseShowState(metadata?.[SHOW_KEY]));
  });
}
