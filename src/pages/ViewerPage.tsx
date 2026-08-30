import { useMemo } from "react";
import { FullscreenArt } from "../components/FullscreenArt";

export function ViewerPage() {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const src = params.get("src") ?? "";
  const title = params.get("title") ?? "";
  const kind = params.get("kind") ?? "location";
  const by = params.get("by") ?? "";

  if (!src) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-400">
        Нет изображения.
      </div>
    );
  }

  return (
    <FullscreenArt
      open
      image={{
        src,
        title,
        kind,
        by,
      }}
      onClose={() => {}}
    />
  );
}
