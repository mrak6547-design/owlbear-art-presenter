import OBR from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@3.1.0/+esm";
import "./style.css";

const EXT = "com.artpresenter.v031";
const CHANNEL = `${EXT}/events`;
const VIEWER_ID = `${EXT}/viewer`;
const LIB_KEY = `${EXT}/library`;
const FRAME_KEY = `${EXT}/frame`;
const MAX_LIBRARY = 30;

const app = document.getElementById("app");
let role = "PLAYER";
let library = [];
let filter = "ALL";
let search = "";
let composeCategory = "NPC";
let frame = localStorage.getItem(FRAME_KEY) || "silver";

const categories = { NPC: "NPC", LOCATION: "Локации", ITEM: "Артефакты", OTHER: "Другое" };

function esc(v="") {
  return String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c]));
}
function viewerMode() { return new URLSearchParams(location.search).get("view") === "1"; }
function saveLibrary() { localStorage.setItem(LIB_KEY, JSON.stringify(library.slice(0, MAX_LIBRARY))); }
function loadLibrary() {
  try { const x = JSON.parse(localStorage.getItem(LIB_KEY) || "[]"); library = Array.isArray(x) ? x.slice(0, MAX_LIBRARY) : []; }
  catch { library = []; }
}
function filtered() {
  const q = search.trim().toLowerCase();
  return library.filter(x => {
    const cat = filter === "ALL" || x.category === filter;
    const text = `${x.name} ${x.caption} ${categories[x.category] || ""}`.toLowerCase();
    return cat && (!q || text.includes(q));
  });
}
function addLibrary(item) {
  library = [item, ...library.filter(x => x.id !== item.id)].slice(0, MAX_LIBRARY);
  saveLibrary();
}

function renderPanel() {
  if (role !== "GM") {
    app.innerHTML = `<main class="panel player"><div class="brand"><div class="logo">✦</div><div><h1>Art Presenter</h1><p>Панель игрока</p></div></div><div class="info"><b>Готово.</b><p>Когда мастер покажет изображение, оно откроется поверх игры. Крестик закрывает его только у вас.</p></div></main>`;
    return;
  }
  const cards = filtered();
  app.innerHTML = `<main class="panel">
    <header class="brand"><div class="logo">✦</div><div><h1>Art Presenter</h1><p>Показывайте арты игрокам</p></div><span class="gm">GM</span></header>
    <section class="composer">
      <button id="pick" class="primary">＋ Выбрать изображение</button>
      <input id="caption" maxlength="100" placeholder="Подпись, например: Лорд-вампир">
      <div class="chips">${Object.entries(categories).map(([k,v]) => `<button class="chip ${composeCategory===k?'active':''}" data-compose="${k}">${v}</button>`).join("")}</div>
    </section>
    <section class="library">
      <div class="library-head"><div><b>Библиотека</b><small>${library.length}/${MAX_LIBRARY}</small></div><select id="frame"><option value="silver">Серебряная рамка</option><option value="gold">Золотая рамка</option><option value="dark">Тёмная рамка</option><option value="none">Без рамки</option></select></div>
      <input id="search" value="${esc(search)}" placeholder="Поиск…">
      <div class="chips filter">${[["ALL","Все"],...Object.entries(categories)].map(([k,v]) => `<button class="chip ${filter===k?'active':''}" data-filter="${k}">${v}</button>`).join("")}</div>
      <div class="grid">${cards.length ? cards.map(card).join("") : `<div class="empty">${library.length ? "Ничего не найдено" : "Библиотека пуста. Выберите изображение выше."}</div>`}</div>
    </section>
    <div id="status" class="status"></div>
  </main>`;
  document.getElementById("pick").onclick = pickImage;
  document.getElementById("search").oninput = e => { search=e.target.value; renderPanel(); const s=document.getElementById("search"); s.focus(); s.setSelectionRange(s.value.length,s.value.length); };
  document.getElementById("frame").value=frame;
  document.getElementById("frame").onchange=e=>{frame=e.target.value;localStorage.setItem(FRAME_KEY,frame);};
  document.querySelectorAll("[data-compose]").forEach(b=>b.onclick=()=>{composeCategory=b.dataset.compose;renderPanel();});
  document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;renderPanel();});
  document.querySelectorAll("[data-show]").forEach(b=>b.onclick=()=>{const x=library.find(i=>i.id===b.dataset.show);if(x)present(x,true);});
  document.querySelectorAll("[data-self]").forEach(b=>b.onclick=()=>{const x=library.find(i=>i.id===b.dataset.self);if(x)present(x,false);});
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{library=library.filter(i=>i.id!==b.dataset.delete);saveLibrary();renderPanel();});
}
function card(x) {
  return `<article class="card"><button class="thumb" data-show="${esc(x.id)}"><img src="${esc(x.url)}" alt="" loading="lazy"><span>${esc(categories[x.category]||"Другое")}</span></button><div class="ct"><b>${esc(x.caption||x.name)}</b><div><button data-show="${esc(x.id)}">Показать всем</button><button data-self="${esc(x.id)}">Только себе</button><button class="danger" data-delete="${esc(x.id)}">Удалить</button></div></div></article>`;
}
async function pickImage() {
  const status=document.getElementById("status"); const caption=document.getElementById("caption")?.value.trim()||"";
  status.textContent="Выберите изображение в библиотеке Owlbear…";
  try {
    const images=await OBR.assets.downloadImages(false,"", "ATTACHMENT");
    if(!images?.length){status.textContent="Выбор отменён.";return;}
    const s=images[0]; const im=s.image;
    if(!im?.url) throw new Error("Owlbear did not return an image URL");
    const item={id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,url:im.url,width:im.width,height:im.height,name:s.name||"Арт",caption,category:composeCategory};
    addLibrary(item); await present(item,true); status.textContent="Показано всем.";
  } catch(e) { console.error(e); status.textContent="Не удалось выбрать изображение."; }
}
async function present(item, all) {
  const data={type:"SHOW",url:item.url,name:item.name||"Арт",caption:item.caption||"",category:item.category||"OTHER",frame};
  if(all) await OBR.broadcast.sendMessage(CHANNEL,data,{destination:"ALL"});
  else await OBR.broadcast.sendMessage(CHANNEL,data,{destination:"LOCAL"});
  await openViewer(data);
}
async function openViewer(data) {
  const p=new URLSearchParams({view:"1",image:data.url||"",name:data.name||"Арт",caption:data.caption||"",category:data.category||"OTHER",frame:data.frame||"silver"});
  try {
    await OBR.modal.open({id:VIEWER_ID,url:`${location.origin}${location.pathname}?${p.toString()}`,fullScreen:true,hidePaper:true,hideBackdrop:true});
  } catch(e) { console.error("Art Presenter modal error",e); }
}
async function closeViewer(){ try{await OBR.modal.close(VIEWER_ID);}catch(e){} }
async function closeAll(){ if(role!=="GM")return; try{await OBR.broadcast.sendMessage(CHANNEL,{type:"CLOSE"},{destination:"ALL"});}finally{await closeViewer();} }
function renderViewer(){
  const p=new URLSearchParams(location.search); const url=p.get("image")||""; const name=p.get("name")||"Арт"; const caption=p.get("caption")||""; const f=p.get("frame")||"silver";
  app.innerHTML=`<div class="viewer frame-${esc(f)}"><div class="viewer-bg"></div><div class="art-wrap"><button id="x" class="x" aria-label="Закрыть">×</button><img id="art" src="${esc(url)}" alt="${esc(name)}"><div class="caption">${esc(caption||name)}</div><button id="all" class="close-all">Закрыть у всех</button></div></div>`;
  document.getElementById("x").onclick=closeViewer; const all=document.getElementById("all"); all.onclick=closeAll; if(role!=="GM")all.remove();
}

OBR.onReady(async()=>{
  try { role=await OBR.player.getRole(); } catch { role="PLAYER"; }
  if(viewerMode()) renderViewer(); else { loadLibrary(); renderPanel(); }
  OBR.broadcast.onMessage(CHANNEL,async event=>{ const d=event?.data; if(!d||typeof d!=="object")return; if(d.type==="SHOW")await openViewer(d); if(d.type==="CLOSE")await closeViewer(); });
});
