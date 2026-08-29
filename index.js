import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

const ID = "dev.artshow.imageviewer";
const KEY = `${ID}/current`;
const HISTORY_KEY = `${ID}/history`;
const MODAL_ID = `${ID}/modal`;

const $ = (id) => document.getElementById(id);
const pickButton = $("pick");
const captionInput = $("caption");
const categoryInput = $("category");
const showAllButton = $("show-all");
const showSelfButton = $("show-self");
const closeAllButton = $("close-all");
const historyEl = $("history");
const clearHistoryButton = $("clear-history");
const gate = $("gate");
const ui = $("ui");

let role = "PLAYER";
let selected = null;
let history = loadHistory();

function loadHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value.slice(0, 20) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
}

function token() {
  const random = globalThis.crypto?.randomUUID?.();
  return `${random || Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function setSelected(data) {
  selected = data;
  showAllButton.disabled = !selected;
  showSelfButton.disabled = !selected;
  renderHistory();
}

function remember(data) {
  history = [data, ...history.filter((item) => item.url !== data.url)].slice(0, 20);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyEl.replaceChildren();
  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Здесь появятся последние показанные арты.";
    historyEl.append(empty);
    return;
  }

  for (const item of history) {
    const card = document.createElement("button");
    card.className = "thumb";
    card.type = "button";
    card.title = item.caption || "Показать арт";
    card.style.backgroundImage = `url(${JSON.stringify(item.url).slice(1, -1)})`;

    const label = document.createElement("span");
    label.className = "thumb-label";
    label.textContent = item.caption || item.category || "Арт";
    card.append(label);

    card.addEventListener("click", () => {
      captionInput.value = item.caption || "";
      categoryInput.value = item.category || "OTHER";
      setSelected({ ...item });
    });
    historyEl.append(card);
  }
}

async function pickImage() {
  try {
    const images = await OBR.assets.downloadImages(false);
    const image = images?.[0];
    if (!image?.image?.url) return;

    setSelected({
      url: image.image.url,
      caption: image.text?.plainText?.trim() || image.name || "",
      category: categoryInput.value,
      fit: "contain",
    });
  } catch (error) {
    console.error(error);
    await OBR.notification.show("Не удалось открыть выбор изображения.", "ERROR");
  }
}

function makePayload(gmOnly = false) {
  return {
    token: token(),
    url: selected.url,
    caption: captionInput.value.trim(),
    category: categoryInput.value,
    fit: "contain",
    gmOnly,
  };
}

async function showAll() {
  if (!selected) return;
  const payload = makePayload(false);
  await OBR.room.setMetadata({ [KEY]: payload });
  remember({ url: payload.url, caption: payload.caption, category: payload.category });
  await OBR.notification.show("Арт показан всем.", "SUCCESS");
}

async function showSelf() {
  if (!selected) return;
  const payload = makePayload(true);
  remember({ url: payload.url, caption: payload.caption, category: payload.category });
  await OBR.modal.open({
    id: MODAL_ID,
    url: `./modal.html?payload=${encodeURIComponent(JSON.stringify(payload))}`,
    fullScreen: true,
    hidePaper: true,
    hideBackdrop: true,
    disablePointerEvents: false,
  });
}

async function closeAll() {
  await OBR.room.setMetadata({ [KEY]: null });
  await OBR.modal.close(MODAL_ID).catch(() => {});
}

pickButton.addEventListener("click", pickImage);
showAllButton.addEventListener("click", showAll);
showSelfButton.addEventListener("click", showSelf);
closeAllButton.addEventListener("click", closeAll);
clearHistoryButton.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});
categoryInput.addEventListener("change", () => {
  if (selected) selected.category = categoryInput.value;
});

OBR.onReady(async () => {
  role = await OBR.player.getRole();
  if (role !== "GM") {
    ui.classList.add("hidden");
    gate.classList.remove("hidden");
    return;
  }
  renderHistory();
});
