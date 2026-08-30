import { useState } from "react";

const DEMO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    caption: "Таверна «Золотой Дракон»",
  },
  {
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    caption: "Загадочный артефакт",
  },
  {
    url: "https://images.unsplash.com/photo-1520637836862-4d197d17c0a4?w=800&q=80",
    caption: "Древний замок",
  },
];

export default function DemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(DEMO_IMAGES[0]);
  const [customUrl, setCustomUrl] = useState("");
  const [customCaption, setCustomCaption] = useState("");

  const openDemo = (url: string, caption: string) => {
    setSelectedImage({ url, caption });
    setShowModal(true);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: "linear-gradient(135deg, #0d0d20 0%, #1a1a35 50%, #0d0d20 100%)" }}
    >
      {/* Header */}
      <div
        className="py-8 px-6 text-center border-b"
        style={{ borderColor: "rgba(124,90,30,0.4)" }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">🎨</span>
          <h1
            className="text-3xl md:text-4xl font-bold text-amber-300"
            style={{ textShadow: "0 0 20px rgba(255,180,50,0.4)", fontFamily: "Georgia, serif" }}
          >
            Арт-Витрина
          </h1>
        </div>
        <p className="text-amber-700 text-sm md:text-base max-w-md mx-auto">
          Плагин для Owlbear Rodeo — показывайте игрокам изображения NPC, локаций и артефактов прямо в игре
        </p>
        <div
          className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs text-amber-600 border"
          style={{ borderColor: "rgba(124,90,30,0.4)", background: "rgba(124,90,30,0.1)" }}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Демо-режим (вне Owlbear Rodeo)
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-5xl mx-auto w-full">
        {/* Left: Features */}
        <div className="lg:w-1/2 space-y-4">
          <h2 className="text-amber-400 font-semibold text-lg mb-4" style={{ fontFamily: "Georgia, serif" }}>
            ✨ Возможности плагина
          </h2>

          {[
            { icon: "🖼️", title: "Полноэкранный просмотр", desc: "Красивая рамка в стиле фэнтези на весь экран для всех игроков" },
            { icon: "📤", title: "Мгновенная отправка", desc: "Нажмите кнопку — и все игроки увидят арт одновременно" },
            { icon: "🔗", title: "URL или загрузка", desc: "Вставьте ссылку на изображение или загрузите файл с компьютера" },
            { icon: "🏷️", title: "Подписи", desc: "Добавьте имя NPC, название локации или артефакта" },
            { icon: "🕐", title: "История", desc: "Быстро повторите отправку из истории до 20 изображений" },
            { icon: "🔍", title: "Зум и перемещение", desc: "Игроки могут приближать и двигать изображение" },
            { icon: "📱", title: "Мобильная поддержка", desc: "Работает на телефонах и планшетах" },
            { icon: "✕", title: "Закрыть у всех", desc: "Мастер может закрыть изображение у всех игроков сразу" },
          ].map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,90,30,0.2)" }}
            >
              <span className="text-xl shrink-0">{f.icon}</span>
              <div>
                <h3 className="text-amber-300 font-medium text-sm">{f.title}</h3>
                <p className="text-amber-800 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Interactive Demo */}
        <div className="lg:w-1/2 space-y-4">
          <h2 className="text-amber-400 font-semibold text-lg mb-4" style={{ fontFamily: "Georgia, serif" }}>
            🎮 Попробовать демо
          </h2>

          {/* Pre-set demo images */}
          <div className="space-y-2">
            <p className="text-amber-600 text-xs uppercase tracking-wider mb-2">Готовые примеры</p>
            {DEMO_IMAGES.map((img) => (
              <button
                key={img.caption}
                onClick={() => openDemo(img.url, img.caption)}
                className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all hover:scale-[1.01]"
                style={{
                  background: "rgba(124,90,30,0.1)",
                  border: "1px solid rgba(124,90,30,0.3)",
                }}
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-14 h-10 object-cover rounded flex-shrink-0"
                />
                <div>
                  <p className="text-amber-300 text-sm font-medium">{img.caption}</p>
                  <p className="text-amber-800 text-xs">Нажмите для просмотра</p>
                </div>
                <span className="ml-auto text-amber-600">▶</span>
              </button>
            ))}
          </div>

          {/* Custom URL demo */}
          <div
            className="p-4 rounded-lg space-y-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,90,30,0.2)" }}
          >
            <p className="text-amber-600 text-xs uppercase tracking-wider">Свой URL изображения</p>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-[#0d0d20] border border-amber-900/50 rounded px-3 py-2 text-sm text-white placeholder-amber-900 focus:outline-none focus:border-amber-600"
            />
            <input
              type="text"
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Подпись (необязательно)"
              className="w-full bg-[#0d0d20] border border-amber-900/50 rounded px-3 py-2 text-sm text-white placeholder-amber-900 focus:outline-none focus:border-amber-600"
            />
            <button
              onClick={() => customUrl.trim() && openDemo(customUrl.trim(), customCaption)}
              disabled={!customUrl.trim()}
              className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/40 disabled:text-amber-800 text-white font-medium text-sm transition-colors"
            >
              🖼️ Открыть изображение
            </button>
          </div>

          {/* Install instructions */}
          <div
            className="p-4 rounded-lg"
            style={{ background: "rgba(50,100,50,0.1)", border: "1px solid rgba(50,150,50,0.2)" }}
          >
            <p className="text-green-400 text-xs uppercase tracking-wider mb-2">📦 Установка в Owlbear Rodeo</p>
            <ol className="text-green-700 text-xs space-y-1 list-decimal list-inside">
              <li>Задеплойте этот проект (Vercel, Netlify и т.д.)</li>
              <li>В Owlbear Rodeo: Настройки → Расширения</li>
              <li>Введите URL вашего сайта как источник расширения</li>
              <li>Нажмите иконку 🎨 на панели инструментов</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Demo modal */}
      {showModal && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0"
            style={{ background: "rgba(0,0,0,0.92)" }}
          />
          <DemoModal
            imageUrl={selectedImage.url}
            caption={selectedImage.caption}
            onClose={() => setShowModal(false)}
          />
        </div>
      )}
    </div>
  );
}

// Standalone demo modal (not using OBR)
function DemoModal({
  imageUrl,
  caption,
  onClose,
}: {
  imageUrl: string;
  caption: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastOffset, setLastOffset] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((z) => Math.min(5, Math.max(0.2, z + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - lastOffset.x, y: e.clientY - lastOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastOffset(offset);
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setLastOffset({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Corner ornaments */}
      <div className="absolute top-4 left-4 text-amber-600/30 text-3xl pointer-events-none select-none">✦</div>
      <div className="absolute top-4 right-4 text-amber-600/30 text-3xl pointer-events-none select-none">✦</div>
      <div className="absolute bottom-4 left-4 text-amber-600/30 text-3xl pointer-events-none select-none">✦</div>
      <div className="absolute bottom-4 right-4 text-amber-600/30 text-3xl pointer-events-none select-none">✦</div>

      <div
        className="relative flex flex-col items-center"
        style={{ maxWidth: "min(95vw, 1100px)", maxHeight: "95vh", width: "auto" }}
      >
        {/* Top frame */}
        <div
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-t-lg"
          style={{
            background: "linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a0f00 100%)",
            border: "2.5px solid #7c5a1e",
            borderBottom: "none",
            boxShadow: "0 -4px 20px rgba(124,90,30,0.3)",
          }}
        >
          <span className="text-amber-600/60 text-base">❧</span>

          {caption && (
            <div className="flex-1 text-center px-4">
              <span
                className="text-amber-300 font-medium tracking-wider"
                style={{
                  fontSize: "clamp(13px, 2.5vw, 20px)",
                  textShadow: "0 0 15px rgba(255,180,50,0.6)",
                  fontFamily: "Georgia, serif",
                  letterSpacing: "0.12em",
                }}
              >
                ✧ {caption} ✧
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom((z) => Math.min(5, z + 0.25))}
              className="w-7 h-7 rounded flex items-center justify-center text-amber-400 hover:text-amber-200 hover:bg-amber-900/40 transition-colors font-bold"
              title="Приблизить"
            >+</button>
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.25))}
              className="w-7 h-7 rounded flex items-center justify-center text-amber-400 hover:text-amber-200 hover:bg-amber-900/40 transition-colors font-bold"
              title="Отдалить"
            >−</button>
            <button
              onClick={resetView}
              className="w-7 h-7 rounded flex items-center justify-center text-amber-400 hover:text-amber-200 hover:bg-amber-900/40 transition-colors text-xs"
              title="Сбросить"
            >⊙</button>
            <div className="w-px h-5 bg-amber-900/50 mx-1" />
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white transition-all text-base"
              style={{
                background: "linear-gradient(135deg, #7c1a1a, #b22222)",
                border: "2px solid #c0392b",
                boxShadow: "0 0 12px rgba(192,57,43,0.5)",
              }}
              title="Закрыть"
            >✕</button>
          </div>
        </div>

        {/* Image area */}
        <div
          className="relative overflow-hidden flex items-center justify-center"
          style={{
            border: "2.5px solid #7c5a1e",
            borderTop: "none",
            background: "#080808",
            maxHeight: "calc(95vh - 90px)",
            width: "100%",
            minWidth: "min(80vw, 600px)",
            minHeight: "200px",
            cursor: isDragging ? "grabbing" : zoom > 1 ? "grab" : "default",
            boxShadow: "0 10px 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.5)",
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Inner border decorations */}
          <div className="absolute inset-2 pointer-events-none" style={{ border: "1px solid rgba(124,90,30,0.25)", zIndex: 2 }} />
          <div className="absolute inset-[14px] pointer-events-none" style={{ border: "1px solid rgba(124,90,30,0.12)", zIndex: 2 }} />

          {/* Corner diamonds */}
          <div className="absolute top-3 left-3 text-amber-900/40 text-xs pointer-events-none z-10">◈</div>
          <div className="absolute top-3 right-3 text-amber-900/40 text-xs pointer-events-none z-10">◈</div>
          <div className="absolute bottom-3 left-3 text-amber-900/40 text-xs pointer-events-none z-10">◈</div>
          <div className="absolute bottom-3 right-3 text-amber-900/40 text-xs pointer-events-none z-10">◈</div>

          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-amber-800 border-t-amber-400 animate-spin" />
                <span className="text-amber-600 text-sm">Загрузка...</span>
              </div>
            </div>
          )}

          <img
            src={imageUrl}
            alt={caption}
            onLoad={() => setIsLoaded(true)}
            style={{
              maxWidth: zoom === 1 ? "100%" : "none",
              maxHeight: zoom === 1 ? "100%" : "none",
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease",
              opacity: isLoaded ? 1 : 0,
              display: "block",
              objectFit: "contain",
              pointerEvents: "none",
              userSelect: "none",
              draggable: false,
            } as React.CSSProperties}
            draggable={false}
          />
        </div>

        {/* Bottom frame */}
        <div
          className="w-full flex items-center justify-between px-4 py-1.5 rounded-b-lg"
          style={{
            background: "linear-gradient(135deg, #1a0f00 0%, #2d1a00 50%, #1a0f00 100%)",
            border: "2.5px solid #7c5a1e",
            borderTop: "none",
            boxShadow: "0 4px 20px rgba(124,90,30,0.3)",
          }}
        >
          <span className="text-amber-600/40 text-sm">❦</span>
          <span className="text-amber-800 text-[10px] tracking-widest uppercase">
            {zoom !== 1 ? `Масштаб: ${Math.round(zoom * 100)}%` : "Колесо мыши — зум · Тяните — перемещение"}
          </span>
          <span className="text-amber-600/40 text-sm">❦</span>
        </div>
      </div>
    </div>
  );
}
