import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

const ID = "dev.artshow.imageviewer";
const KEY = `${ID}/current`;
const MODAL_ID = `${ID}/modal`;

let role = "PLAYER";
let lastToken = null;

function makeToken() {
  const random = globalThis.crypto?.randomUUID?.();
  return `${random || Math.random().toString(36).slice(2)}-${Date.now()}`;
}

async function openViewer() {
  try {
    await OBR.modal.open({
      id: MODAL_ID,
      url: "./modal.html",
      fullScreen: true,
      hidePaper: true,
      hideBackdrop: true,
      disablePointerEvents: false,
    });
  } catch (error) {
    console.error("[Art Show] Не удалось открыть просмотрщик", error);
  }
}

async function closeViewer() {
  try {
    await OBR.modal.close(MODAL_ID);
  } catch {
    // Уже закрыт.
  }
}

async function sync(metadata) {
  const current = metadata?.[KEY] ?? null;

  if (!current?.url) {
    lastToken = null;
    await closeViewer();
    return;
  }

  if (current.gmOnly && role !== "GM") return;
  if (current.token === lastToken) return;

  lastToken = current.token;
  await openViewer();
}

async function showSelected(items) {
  const item = items.find((candidate) => candidate.type === "IMAGE");
  const url = item?.image?.url;

  if (!url) {
    await OBR.notification.show("У выбранного объекта нет изображения.", "WARNING");
    return;
  }

  const caption = item.text?.plainText?.trim() || item.name || "";
  const payload = {
    token: makeToken(),
    url,
    caption,
    fit: "contain",
    gmOnly: false,
    category: "NPC",
  };

  await OBR.room.setMetadata({ [KEY]: payload });
}

OBR.onReady(async () => {
  try {
    role = await OBR.player.getRole();
  } catch {
    role = "PLAYER";
  }

  OBR.player.onChange((player) => {
    role = player.role;
  });

  await OBR.contextMenu.create({
    id: `${ID}/context`,
    icons: [
      {
        icon: "./icon.svg",
        label: "Показать арт игрокам",
        filter: {
          every: [{ key: "type", value: "IMAGE" }],
          roles: ["GM"],
        },
      },
    ],
    onClick: (context) => showSelected(context.items),
  });

  OBR.room.onMetadataChange(sync);
  await sync(await OBR.room.getMetadata());
});
