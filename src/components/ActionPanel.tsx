import { useEffect, useState, useRef } from "react";
import OBR from "@owlbear-rodeo/sdk";

const CHANNEL = "artviewer.show-image";
const MODAL_ID = "artviewer.image-modal";

type HistoryItem = {
  imageUrl: string;
  caption: string;
  timestamp: number;
};

export default function ActionPanel() {
  const [isReady, setIsReady] = useState(false);
  const [role, setRole] = useState<"GM" | "PLAYER" | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"send" | "history">("send");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubReady = OBR.onReady(async () => {
      setIsReady(true);
      try {
        const playerRole = await OBR.player.getRole();
        setRole(playerRole);
        // Load history from room metadata
        const meta = await OBR.room.getMetadata();
        const savedHistory = meta["artviewer.history"] as HistoryItem[] | undefined;
        if (savedHistory) setHistory(savedHistory);
      } catch (e) {
        console.error("OBR init error:", e);
      }
    });
    return unsubReady;
  }, []);

  const showStatus = (type: "success" | "error" | "info", text: string) => {
    setStatus({ type, text });
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatus(null), 3000);
  };

  const handleImageInput = (url: string) => {
    setImageUrl(url);
    if (url.trim()) {
      setPreviewUrl(url.trim());
    } else {
      setPreviewUrl("");
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showStatus("error", "Только изображения!");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const sendImage = async (url: string = imageUrl, cap: string = caption) => {
    if (!url.trim()) {
      showStatus("error", "Введите URL или загрузите изображение");
      return;
    }
    setIsLoading(true);
    try {
      // First open modal for GM
      const encodedUrl = encodeURIComponent(url.trim());
      const encodedCaption = cap ? encodeURIComponent(cap) : "";
      const modalUrl = `${window.location.origin}${window.location.pathname}?mode=modal&imageUrl=${encodedUrl}&caption=${encodedCaption}`;

      await OBR.modal.open({
        id: MODAL_ID,
        url: modalUrl,
        fullScreen: true,
        hideBackdrop: false,
        hidePaper: true,
      });

      // Broadcast to players
      await OBR.broadcast.sendMessage(
        CHANNEL,
        { imageUrl: url.trim(), caption: cap },
        { destination: "ALL" }
      );

      // Save to history
      const newItem: HistoryItem = {
        imageUrl: url.trim(),
        caption: cap,
        timestamp: Date.now(),
      };
      const updatedHistory = [newItem, ...history].slice(0, 20);
      setHistory(updatedHistory);
      await OBR.room.setMetadata({ "artviewer.history": updatedHistory });

      showStatus("success", "Изображение отправлено игрокам!");
    } catch (err) {
      console.error("Send error:", err);
      showStatus("error", "Ошибка отправки");
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = async () => {
    try {
      await OBR.modal.close(MODAL_ID);
      await OBR.broadcast.sendMessage(
        "artviewer.close-image",
        { close: true },
        { destination: "ALL" }
      );
      showStatus("info", "Изображение закрыто");
    } catch (e) {
      console.error(e);
    }
  };

  const clearForm = () => {
    setImageUrl("");
    setCaption("");
    setPreviewUrl("");
  };

  if (!isReady) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-[#1a1a2e] text-amber-300">
        <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mb-3" />
        <span className="text-sm">Подключение к Owlbear...</span>
      </div>
    );
  }

  if (role === "PLAYER") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-[#1a1a2e] text-amber-300 p-4 text-center">
        <span className="text-3xl mb-3">🛡️</span>
        <p className="text-sm">Этот инструмент доступен только Мастеру</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e] text-white select-none" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-amber-900/50 bg-[#12122a] shrink-0">
        <span className="text-xl">🎨</span>
        <div>
          <h1 className="text-sm font-bold text-amber-300 leading-tight">Арт-Витрина</h1>
          <p className="text-[10px] text-amber-700 leading-tight">Показ изображений игрокам</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-amber-900/40 shrink-0">
        <button
          onClick={() => setActiveTab("send")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "send"
              ? "text-amber-300 border-b-2 border-amber-400 bg-amber-900/10"
              : "text-amber-700 hover:text-amber-500"
          }`}
        >
          📤 Отправить
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            activeTab === "history"
              ? "text-amber-300 border-b-2 border-amber-400 bg-amber-900/10"
              : "text-amber-700 hover:text-amber-500"
          }`}
        >
          🕐 История ({history.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === "send" && (
          <div className="p-3 space-y-3">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-amber-400 bg-amber-900/20"
                  : "border-amber-900/50 hover:border-amber-700 hover:bg-amber-900/10"
              }`}
            >
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-32 mx-auto rounded object-contain"
                    onError={() => { setPreviewUrl(""); showStatus("error", "Не удалось загрузить изображение"); }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); clearForm(); }}
                    className="absolute top-0 right-0 bg-red-700 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="text-amber-700">
                  <div className="text-2xl mb-1">🖼️</div>
                  <p className="text-xs">Перетащите файл или нажмите</p>
                  <p className="text-[10px] text-amber-900">JPG, PNG, GIF, WebP</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* URL Input */}
            <div>
              <label className="block text-[10px] text-amber-600 mb-1 uppercase tracking-wider">или вставьте URL</label>
              <input
                type="url"
                value={imageUrl.startsWith("data:") ? "" : imageUrl}
                onChange={(e) => handleImageInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-[#0d0d20] border border-amber-900/50 rounded px-2 py-1.5 text-xs text-white placeholder-amber-900 focus:outline-none focus:border-amber-600 transition-colors"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="block text-[10px] text-amber-600 mb-1 uppercase tracking-wider">Подпись (необязательно)</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Имя NPC, название локации..."
                className="w-full bg-[#0d0d20] border border-amber-900/50 rounded px-2 py-1.5 text-xs text-white placeholder-amber-900 focus:outline-none focus:border-amber-600 transition-colors"
                maxLength={120}
              />
            </div>

            {/* Status */}
            {status && (
              <div className={`rounded px-2 py-1.5 text-xs text-center transition-all ${
                status.type === "success" ? "bg-green-900/50 text-green-300 border border-green-800" :
                status.type === "error" ? "bg-red-900/50 text-red-300 border border-red-800" :
                "bg-blue-900/50 text-blue-300 border border-blue-800"
              }`}>
                {status.text}
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => sendImage()}
                disabled={isLoading || !imageUrl.trim()}
                className="w-full py-2 rounded bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900/40 disabled:text-amber-800 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Отправка...
                  </>
                ) : (
                  <>📤 Показать игрокам</>
                )}
              </button>
              <button
                onClick={closeModal}
                className="w-full py-1.5 rounded bg-red-900/50 hover:bg-red-800/60 text-red-300 hover:text-red-200 text-xs transition-colors border border-red-900/50"
              >
                ✕ Закрыть у всех
              </button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="p-2 space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-8 text-amber-800 text-xs">
                <div className="text-3xl mb-2">📭</div>
                История пуста
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0d0d20] border border-amber-900/30 rounded-lg p-2 flex gap-2 items-center cursor-pointer hover:border-amber-700/50 transition-colors"
                  onClick={() => {
                    setImageUrl(item.imageUrl);
                    setCaption(item.caption);
                    setPreviewUrl(item.imageUrl);
                    setActiveTab("send");
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="w-12 h-12 object-cover rounded flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-300 truncate">{item.caption || "Без подписи"}</p>
                    <p className="text-[10px] text-amber-800 truncate">{
                      item.imageUrl.startsWith("data:") ? "Загруженный файл" : item.imageUrl
                    }</p>
                    <p className="text-[10px] text-amber-900">
                      {new Date(item.timestamp).toLocaleTimeString("ru-RU")}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); sendImage(item.imageUrl, item.caption); }}
                    className="text-[10px] bg-amber-800/50 hover:bg-amber-700/60 text-amber-300 rounded px-1.5 py-1 shrink-0"
                  >
                    ▶
                  </button>
                </div>
              ))
            )}
            {history.length > 0 && (
              <button
                onClick={async () => {
                  setHistory([]);
                  await OBR.room.setMetadata({ "artviewer.history": [] });
                }}
                className="w-full text-[10px] text-red-800 hover:text-red-600 py-1 transition-colors"
              >
                Очистить историю
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
