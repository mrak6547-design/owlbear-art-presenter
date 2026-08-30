/* Занавес — фоновый скрипт расширения для Owlbear Rodeo.
   Делает три вещи:
   1. Добавляет «Показать игрокам» в контекстное меню любой картинки на сцене.
   2. Слушает рассылку канала расширения на КАЖДОМ клиенте.
   3. Открывает/закрывает полноэкранный модал с артом у всех игроков. */

var ID = "ru.curtain.showcase";
var CHANNEL = ID + "/show";
var MODAL_ID = ID + "/modal";

var ICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D9B56C" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 3h16"/><path d="M4 3c2.6 4 2.6 14 0 18"/><path d="M20 3c-2.6 4-2.6 14 0 18"/><path d="M12 4v16" stroke-dasharray="2 2.6"/><path d="M4 21h16"/></svg>'
  );

function guessKind(layer) {
  if (layer === "CHARACTER" || layer === "MOUNT") return "npc";
  if (layer === "MAP" || layer === "PROP" || layer === "DRAWING" || layer === "GRID")
    return "location";
  return "artifact";
}

async function main() {
  var OBR;
  try {
    var mod = await import("https://esm.sh/@owlbear-rodeo/sdk@3");
    OBR = mod.default;
  } catch (e) {
    console.error("[Занавес] Не удалось загрузить Owlbear SDK:", e);
    return;
  }

  OBR.onReady(function () {
    /* 1. Контекстное меню на картинках */
    try {
      OBR.contextMenu.create({
        id: ID + "/menu.show",
        icons: [
          {
            icon: ICON,
            label: "Показать игрокам",
            filter: {
              every: [{ key: "type", value: "IMAGE" }],
            },
          },
        ],
        shortcut: "S",
        onClick: function (context) {
          (async function () {
            try {
              var role = await OBR.player.getRole();
              if (role !== "GM") return;
              var item = context.items && context.items[0];
              if (!item || item.type !== "IMAGE" || !item.image) return;
              var name = "Мастер";
              try {
                name = await OBR.player.getName();
              } catch (_) {}
              await OBR.broadcast.sendMessage(CHANNEL, {
                action: "show",
                src: item.image.url,
                title: item.name || "Без названия",
                kind: guessKind(String(item.layer)),
                by: name,
              });
            } catch (e) {
              console.error("[Занавес] Ошибка показа из контекстного меню:", e);
            }
          })();
        },
      });
    } catch (e) {
      console.error("[Занавес] Не удалось создать контекстное меню:", e);
    }

    /* 2–3. Рассылка показа */
    OBR.broadcast.onMessage(CHANNEL, function (event) {
      (async function () {
        var data = (event && event.data) || {};
        try {
          await OBR.modal.close(MODAL_ID);
        } catch (_) {
          /* модала ещё не было — это нормально */
        }
        if (data.action === "hide") return;
        if (data.action !== "show" || !data.src) return;
        try {
          var params = new URLSearchParams({
            mode: "modal",
            src: String(data.src),
            title: String(data.title || "Без названия"),
            kind: String(data.kind || "artifact"),
            by: String(data.by || ""),
          });
          await OBR.modal.open({
            id: MODAL_ID,
            url: "/?" + params.toString(),
            fullScreen: true,
            hidePaper: true,
          });
        } catch (e) {
          console.error("[Занавес] Не удалось открыть показ:", e);
        }
      })();
    });
  });
}

main();
