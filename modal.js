import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";

const ID = "dev.artshow.imageviewer";
const KEY = `${ID}/current`;
const MODAL_ID = `${ID}/modal`;

const $ = (id) => document.getElementById(id);
const img = $("img");
const stage = $("stage");
const status = $("status");
const caption = $("caption");
const closeButton = $("close");
const closeAllButton = $("close-all");
const resetButton = $("reset");

let role = "PLAYER";
let currentToken = null;
const view = { scale: 1, x: 0, y: 0 };
const MIN = 1;
const MAX = 6;

function applyTransform() {
  img.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  stage.classList.toggle("zoomed", view.scale > 1.01);
}

function reset() {
  view.scale = 1;
  view.x = 0;
  view.y = 0;
  applyTransform();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function zoomAt(factor, clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  const px = clientX - rect.left - rect.width / 2;
  const py = clientY - rect.top - rect.height / 2;
  const next = clamp(view.scale * factor, MIN, MAX);
  const k = next / view.scale;
  view.x = (view.x - px) * k + px;
  view.y = (view.y - py) * k + py;
  view.scale = next;
  if (view.scale <= MIN + 0.01) {
    view.x = 0;
    view.y = 0;
  }
  applyTransform();
}

stage.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15, event.clientX, event.clientY);
}, { passive: false });

const pointers = new Map();
let pinchStart = null;
let lastTap = 0;

stage.addEventListener("pointerdown", (event) => {
  stage.setPointerCapture(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      scale: view.scale,
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
    };
  }
});

stage.addEventListener("pointermove", (event) => {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  const current = { x: event.clientX, y: event.clientY };

  if (pointers.size === 2 && pinchStart) {
    pointers.set(event.pointerId, current);
    const [a, b] = [...pointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y);
    const target = clamp((pinchStart.scale * distance) / pinchStart.dist, MIN, MAX);
    zoomAt(target / view.scale, pinchStart.cx, pinchStart.cy);
    return;
  }

  if (pointers.size === 1 && view.scale > 1.01) {
    view.x += current.x - previous.x;
    view.y += current.y - previous.y;
    applyTransform();
  }
  pointers.set(event.pointerId, current);
});

function endPointer(event) {
  pointers.delete(event.pointerId);
  if (pointers.size < 2) pinchStart = null;
}

stage.addEventListener("pointerup", (event) => {
  endPointer(event);
  const now = Date.now();
  if (now - lastTap < 300) {
    if (view.scale > 1.01) reset();
    else zoomAt(2.5, event.clientX, event.clientY);
    lastTap = 0;
  } else {
    lastTap = now;
  }
});
stage.addEventListener("pointercancel", endPointer);
stage.addEventListener("contextmenu", (event) => event.preventDefault());

async function closeForMe() {
  await OBR.modal.close(MODAL_ID).catch(() => {});
}

async function closeForAll() {
  await OBR.room.setMetadata({ [KEY]: null });
  await OBR.modal.close(MODAL_ID).catch(() => {});
}

closeButton.addEventListener("click", closeForMe);
closeAllButton.addEventListener("click", closeForAll);
resetButton.addEventListener("click", reset);
$("backdrop").addEventListener("pointerdown", closeForMe);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeForMe();
  if (event.key === "0") reset();
});

function render(current) {
  if (!current?.url) {
    OBR.modal.close(MODAL_ID).catch(() => {});
    return;
  }

  if (current.token !== currentToken) reset();
  currentToken = current.token;

  if (img.src !== current.url) {
    status.textContent = "Загрузка…";
    status.classList.remove("hidden");
    img.src = current.url;
  }
  img.style.objectFit = current.fit === "cover" ? "cover" : "contain";
  caption.textContent = current.caption || "";
  caption.classList.toggle("hidden", !current.caption);
}

img.addEventListener("load", () => status.classList.add("hidden"));
img.addEventListener("error", () => {
  status.classList.remove("hidden");
  status.textContent = "Не удалось загрузить изображение.";
});

OBR.onReady(async () => {
  role = await OBR.player.getRole();
  closeAllButton.classList.toggle("hidden", role !== "GM");

  const query = new URLSearchParams(location.search);
  const encoded = query.get("payload");
  if (encoded) {
    try {
      render(JSON.parse(encoded));
      return;
    } catch (error) {
      console.error("[Art Show] invalid local payload", error);
    }
  }

  OBR.room.onMetadataChange((metadata) => render(metadata?.[KEY] ?? null));
  render((await OBR.room.getMetadata())[KEY] ?? null);
});
