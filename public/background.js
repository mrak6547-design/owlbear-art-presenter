/* Занавес — фоновый скрипт расширения для Owlbear Rodeo.
   Делает три вещи:
   1. Добавляет «Показать игрокам» в контекстное меню любой картинки на сцене.
   2. Слушает рассылку канала расширения на КАЖДОМ клиенте.
   3. Открывает/закрывает полноэкранный модал с артом у всех игроков. */

import OBR from "https://esm.sh/@owlbear-rodeo/sdk";

const EXT_ID = "zanaves";
const SHOW_KEY = `${EXT_ID}/current`;
const MODAL_ID = `${EXT_ID}/viewer`;

let role = "PLAYER";
let lastToken = null;

function buildViewerUrl(data) {
  const params = new URLSearchParams({
    mode: "modal",
    src: data.src,
    title: data.title || "",
    kind: data.kind || "location",
    by: data.by || "",
    token: data.token || "",
  });

  return `/?${params.toString()}`;
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
  } catch (err) {
    console.error("[Занавес] modal open failed", err);
  }
}

async function closeViewer() {
  try {
    await OBR.modal.close(MODAL_ID);
  } catch {}
}

async function sync(metadata) {
  const current = metadata?.[SHOW_KEY] ?? null;

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
