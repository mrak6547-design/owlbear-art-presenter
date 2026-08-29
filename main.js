import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";
import "./style.css";

const ID = "com.art-presenter.extension";
const CHANNEL = `${ID}/broadcast`;
const MODAL_ID = `${ID}/viewer`;
const ROOM_KEY = `${ID}/library`;
const MAX_LIBRARY = 30;
const FAV_KEY = `${ID}/favorites`;
const FRAME_KEY = `${ID}/frame`;

const app = document.querySelector("#app");
let role = "PLAYER";
let library = [];
let selectedCategory = "ALL";
let searchTerm = "";
let frame = localStorage.getItem(FRAME_KEY) || "silver";
let favorites = new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]"));

const categories = {
  NPC: "NPC",
  LOCATION: "Локации",
  ITEM: "Артефакты",
  OTHER: "Другое",
};

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const isViewerRoute = () => new URLSearchParams(location.search).get("view") === "1";

function saveFavorites() {
  localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
}

function categoryLabel(category) {
  return categories[category] || categories.OTHER;
}

async function loadLibrary() {
  try {
    const metadata = await OBR.room.getMetadata();
    library = Array.isArray(metadata?.[ROOM_KEY]) ? metadata[ROOM_KEY].slice(0, MAX_LIBRARY) : [];
  } catch {
    library = [];
  }
}

async function saveLibrary(next) {
  library = next.slice(0, MAX_LIBRARY);
  try {
    await OBR.room.setMetadata({ [ROOM_KEY]: library });
  } catch (error) {
    console.warn("Art Presenter: library save failed", error);
  }
}

async function addToLibrary(item) {
  const next = [item, ...library.filter((x) => x.id !== item.id)].slice(0, MAX_LIBRARY);
  await saveLibrary(next);
}

async function removeFromLibrary(id) {
  await saveLibrary(library.filter((x) => x.id !== id));
  favorites.delete(id);
  saveFavorites();
  renderControlPanel();
}

function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  saveFavorites();
  renderControlPanel();
}

function filteredLibrary() {
  const query = searchTerm.trim().toLowerCase();
  return library.filter((item) => {
    const categoryOk = selectedCategory === "ALL"
      || (selectedCategory === "FAVORITES" ? favorites.has(item.id) : item.category === selectedCategory);
    const text = `${item.caption || ""} ${item.name || ""} ${categoryLabel(item.category)}`.toLowerCase();
    return categoryOk && (!query || text.includes(query));
  });
}

function cardTemplate(item) {
  const fav = favorites.has(item.id);
  return `<article class="card">
    <button class="thumb" data-show-id="${escapeHtml(item.id)}" title="Показать всем">
      <img src="${escapeHtml(item.url)}" alt="" loading="lazy" />
      <span class="thumb-badge">${escapeHtml(categoryLabel(item.category))}</span>
    </button>
    <button class="favorite ${fav ? "is-favorite" : ""}" data-fav-id="${escapeHtml(item.id)}" aria-label="${fav ? "Убрать из избранного" : "Добавить в избранное"}">${fav ? "★" : "☆"}</button>
    <div class="card-meta">
      <div class="card-title" title="${escapeHtml(item.caption || item.name)}">${escapeHtml(item.caption || item.name || "Без названия")}</div>
      <div class="card-actions">
        <button class="mini primary-mini" data-show-id="${escapeHtml(item.id)}">Показать</button>
        <button class="mini" data-self-id="${escapeHtml(item.id)}">Только себе</button>
        <button class="mini danger" data-delete-id="${escapeHtml(item.id)}">Удалить</button>
      </div>
    </div>
  </article>`;
}

function renderPlayerPanel() {
  app.innerHTML = `<main class="panel player-panel">
    <header class="brand">
      <div class="brand-icon">✦</div>
      <div class="brand-copy"><h1>Art Presenter</h1><p>Показываемые мастером арты появятся здесь автоматически.</p></div>
    </header>
    <section class="player-note">
      <div class="note-icon">👀</div>
      <h2>Вы игрок</h2>
      <p>Когда мастер покажет NPC, локацию или артефакт, изображение откроется поверх игры. Закрыть его можно только у себя.</p>
    </section>
    <footer>Art Presenter работает на ПК, планшетах и телефонах.</footer>
  </main>`;
}

function renderControlPanel() {
  if (role !== "GM") return renderPlayerPanel();
  const filtered = filteredLibrary();
  const active = selectedCategory;

  app.innerHTML = `<main class="panel">
    <header class="brand">
      <div class="brand-icon">✦</div>
      <div class="brand-copy"><h1>Art Presenter</h1><p>Показывайте арты игрокам поверх Owlbear.</p></div>
      <span class="role-pill">GM</span>
    </header>

    <section class="composer">
      <div class="section-title"><span>Новый показ</span><span class="hint">выберите арт в Owlbear</span></div>
      <button id="pick" class="primary"><span>＋</span> Выбрать изображение</button>
      <label class="field"><span>Название / подпись <small>необязательно</small></span><input id="caption" maxlength="100" placeholder="Например: Лорд-вампир" /></label>
      <div class="category-row" aria-label="Категория">
        ${Object.entries(categories).map(([key, label]) => `<button class="category ${key === "NPC" ? "active" : ""}" data-compose-category="${key}">${label}</button>`).join("")}
      </div>
      <div class="quick-tip">Нажмите на карточку ниже для повторного показа. Для одиночного просмотра используйте «Только себе».</div>
    </section>

    <section class="library">
      <div class="library-head">
        <div><div class="section-title">Библиотека</div><div class="count">${library.length}/${MAX_LIBRARY} сохранено в комнате</div></div>
        <select id="frame-select" title="Рамка">
          <option value="silver" ${frame === "silver" ? "selected" : ""}>Серебро</option>
          <option value="gold" ${frame === "gold" ? "selected" : ""}>Золото</option>
          <option value="dark" ${frame === "dark" ? "selected" : ""}>Тёмная</option>
          <option value="none" ${frame === "none" ? "selected" : ""}>Без рамки</option>
        </select>
      </div>
      <div class="search"><span>⌕</span><input id="search" value="${escapeHtml(searchTerm)}" placeholder="Поиск по имени или категории…" /></div>
      <div class="tabs">
        ${[["ALL","Все"],["FAVORITES","★ Избранное"],...Object.entries(categories)].map(([key,label]) => `<button class="category ${active === key ? "active" : ""}" data-filter-category="${key}">${label}</button>`).join("")}
      </div>
      <div class="grid">${filtered.length ? filtered.map(cardTemplate).join("") : `<div class="empty"><b>${library.length ? "Ничего не найдено" : "Библиотека пока пуста"}</b><span>${library.length ? "Попробуйте другой поиск или категорию." : "Нажмите «Выбрать изображение», выберите арт в библиотеке Owlbear — и он сохранится для быстрого повторного показа."}</span></div>`}</div>
    </section>
    <div id="status" class="status" hidden></div>
    <footer><b>Игрок:</b> закрывает только у себя. <b>GM:</b> может закрыть показ у всех.</footer>
  </main>`;

  document.querySelector("#pick").addEventListener("click", pickImage);
  document.querySelector("#search").addEventListener("input", (e) => { searchTerm = e.target.value; renderControlPanel(); const input = document.querySelector("#search"); input.focus(); input.setSelectionRange(input.value.length, input.value.length); });
  document.querySelector("#frame-select").addEventListener("change", (e) => { frame = e.target.value; localStorage.setItem(FRAME_KEY, frame); });
  document.querySelectorAll("[data-compose-category]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-compose-category]").forEach((b) => b.classList.remove("active"));
    button.classList.add("active");
  }));
  document.querySelectorAll("[data-filter-category]").forEach((button) => button.addEventListener("click", () => {
    selectedCategory = button.dataset.filterCategory;
    renderControlPanel();
  }));
  document.querySelectorAll("[data-show-id]").forEach((button) => button.addEventListener("click", () => {
    const item = library.find((x) => x.id === button.dataset.showId);
    if (item) showItem(item, true);
  }));
  document.querySelectorAll("[data-self-id]").forEach((button) => button.addEventListener("click", () => {
    const item = library.find((x) => x.id === button.dataset.selfId);
    if (item) showItem(item, false);
  }));
  document.querySelectorAll("[data-delete-id]").forEach((button) => button.addEventListener("click", () => removeFromLibrary(button.dataset.deleteId)));
  document.querySelectorAll("[data-fav-id]").forEach((button) => button.addEventListener("click", () => toggleFavorite(button.dataset.favId)));
}

async function pickImage() {
  const button = document.querySelector("#pick");
  const status = document.querySelector("#status");
  const caption = document.querySelector("#caption").value.trim();
  const category = document.querySelector("[data-compose-category].active")?.dataset.composeCategory || "NPC";
  button.disabled = true;
  status.hidden = false;
  status.textContent = "Откройте библиотеку Owlbear и выберите изображение…";
  try {
    const images = await OBR.assets.downloadImages(false, "", "ATTACHMENT");
    if (!images?.length) return;
    const selected = images[0];
    const image = selected.image;
    if (!image?.url) throw new Error("Image URL unavailable");
    const item = {
      id: crypto.randomUUID(),
      url: image.url,
      width: image.width,
      height: image.height,
      name: selected.name || "Арт",
      caption,
      category,
    };
    await addToLibrary(item);
    await showItem(item, true);
    status.textContent = "Показ отправлен всем игрокам.";
    renderControlPanel();
  } catch (error) {
    console.error(error);
    status.textContent = "Не удалось выбрать изображение. Попробуйте ещё раз.";
  } finally {
    button.disabled = false;
  }
}

async function showItem(item, all) {
  const payload = {
    type: "SHOW",
    id: item.id,
    url: item.url,
    width: item.width,
    height: item.height,
    name: item.name,
    caption: item.caption || "",
    category: item.category,
    frame,
  };
  await OBR.broadcast.sendMessage(CHANNEL, payload, { destination: all ? "ALL" : "LOCAL" });
  await openViewer(payload);
}

async function openViewer(data) {
  const params = new URLSearchParams({
    view: "1",
    image: data.url || "",
    caption: data.caption || "",
    name: data.name || "Арт",
    frame: data.frame || frame,
  });
  try {
    await OBR.modal.open({
      id: MODAL_ID,
      url: `./?${params.toString()}`,
      fullScreen: true,
      hidePaper: true,
      hideBackdrop: true,
    });
  } catch (error) {
    console.error("Art Presenter viewer failed", error);
  }
}

async function closeViewer() {
  try { await OBR.modal.close(MODAL_ID); } catch {}
}

async function sendCloseAll() {
  if (role !== "GM") return;
  await OBR.broadcast.sendMessage(CHANNEL, { type: "CLOSE" }, { destination: "ALL" });
  await closeViewer();
}

function renderViewer() {
  const params = new URLSearchParams(location.search);
  const url = params.get("image") || "";
  const caption = params.get("caption") || "";
  const name = params.get("name") || "Арт";
  const viewerFrame = params.get("frame") || frame;

  app.innerHTML = `<div class="viewer frame-${escapeHtml(viewerFrame)}">
    <div class="viewer-backdrop"></div>
    <div class="viewer-frame">
      <img id="art" alt="${escapeHtml(name)}" />
      <div class="viewer-topbar">
        <div class="viewer-caption"><strong>${escapeHtml(caption || name)}</strong><span>${escapeHtml(categoryLabel(params.get("category")))}</span></div>
        <div class="viewer-actions">
          <button id="close-local" class="icon-button" title="Закрыть у себя" aria-label="Закрыть">×</button>
          <button id="close-all" class="all-button" title="Закрыть у всех">Закрыть у всех</button>
        </div>
      </div>
    </div>
  </div>`;
  document.querySelector("#art").src = url;
  document.querySelector("#close-local").addEventListener("click", closeViewer);
  document.querySelector("#close-all").addEventListener("click", sendCloseAll);
  if (role !== "GM") document.querySelector("#close-all").remove();
}

OBR.onReady(async () => {
  role = await OBR.player.getRole();

  if (isViewerRoute()) {
    renderViewer();
  } else {
    await loadLibrary();
    renderControlPanel();
  }

  OBR.broadcast.onMessage(CHANNEL, async (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "SHOW") await openViewer(data);
    if (data.type === "CLOSE") await closeViewer();
  });

  OBR.room.onMetadataChange((metadata) => {
    if (isViewerRoute()) return;
    const next = metadata?.[ROOM_KEY];
    if (Array.isArray(next)) {
      library = next.slice(0, MAX_LIBRARY);
      renderControlPanel();
    }
  });
});
