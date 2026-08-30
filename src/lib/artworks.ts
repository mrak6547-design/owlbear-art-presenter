export type ArtKind = "npc" | "location" | "artifact" | "encounter";

export interface Artwork {
  id: string;
  title: string;
  sub?: string;
  kind: ArtKind;
  src: string;
}

export const KIND_LABEL: Record<string, string> = {
  npc: "Персонаж",
  location: "Локация",
  artifact: "Артефакт",
  encounter: "Происшествие",
  map: "Карта",
};

/** Демо-галерея для лендинга и симулятора */
export const DEMO_ARTWORKS: Artwork[] = [
  {
    id: "npc-nera",
    title: "Нера Изумрудная",
    sub: "Информаторша из Нижнего квартала",
    kind: "npc",
    src: "/images/art-npc1.jpg",
  },
  {
    id: "npc-baldur",
    title: "Король Бальдур Третий",
    sub: "Последний из Железной династии",
    kind: "npc",
    src: "/images/art-npc2.jpg",
  },
  {
    id: "loc-cathedral",
    title: "Собор Ушедшего света",
    sub: "Крыло II — разрушенный неф",
    kind: "location",
    src: "/images/art-loc1.jpg",
  },
  {
    id: "loc-shrine",
    title: "Арка Тихих болот",
    sub: "Точка перемещения отряда",
    kind: "location",
    src: "/images/art-loc2.jpg",
  },
  {
    id: "art-sword",
    title: "Клинок Рассвета",
    sub: "Реликвия, найденная в склепе",
    kind: "artifact",
    src: "/images/art-art1.jpg",
  },
  {
    id: "art-orb",
    title: "Око Провидца",
    sub: "Сфера из зала Совета",
    kind: "artifact",
    src: "/images/art-art2.jpg",
  },
  {
    id: "enc-dragon",
    title: "Каргрим Рыжий",
    sub: "Хозяин нижних пещер",
    kind: "encounter",
    src: "/images/art-enc1.jpg",
  },
];

export interface ShowRequest {
  src: string;
  title: string;
  kind: string;
  by?: string;
}
