/* Занавес — фоновый скрипт расширения для Owlbear Rodeo.
   Делает три вещи:
   1. Добавляет «Показать игрокам» в контекстное меню любой картинки на сцене.
   2. Слушает рассылку канала расширения на КАЖДОМ клиенте.
   3. Открывает/закрывает полноэкранный модал с артом у всех игроков. */

import OBR from "https://esm.sh/@owlbear-rodeo/sdk";

const ID = "zanaves";
const KEY = `${ID}/current`;
const MODAL_ID = `${ID}/viewer`;

let role = "PLAYER";
let lastToken = null;

function buildViewerUrl(data) {
  const p = new URLSearchParams({
    mode: "viewer",
    src: data.src,
    title: data.title || "",
    kind: data.kind || "location",
    by: data.by || "",
    token: data.token,
  });

  return `/?${p.toString()}`;
}

async function openViewer(data) {
  try {
    await OBR.modal.open({
      id: MODAL_ID,
      url: buildViewerUrl(data),
      fullScreen: true,
      hidePaper: true,
      hideBackdrop: true,
      disablePointerEvents: false,
    });
  } catch (e) {
    console.error("[Занавес] Не удалось открыть модал", e);
  }
}

async function closeViewer() {
  try {
    await OBR.modal.close(MODAL_ID);
  } catch {}
}

async function sync(metadata) {
  const current = metadata?.[KEY];

  if (!current) {
    lastToken = null;
    await closeViewer();
    return;
  }

  if (current.gmOnly && role !== "GM") return;

  if (current.token === lastToken) return;

  lastToken = current.token;

  await openViewer(current);
}

OBR.onReady(async () => {
  role = await OBR.player.getRole();

  OBR.player.onChange((player) => {
    role = player.role;
  });

  OBR.room.onMetadataChange(sync);

  await sync(await OBR.room.getMetadata());
});
