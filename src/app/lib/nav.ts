export const NAV_ITEMS = [
  { label: "Главная", id: "hero" },
  { label: "Направления", id: "directions" },
  { label: "Продукты", id: "products" },
  { label: "Кейсы", id: "cases" },
  { label: "Услуги", id: "services" },
] as const;

export const SCROLL_OFFSET = 150;

export function getActiveSectionId(): string {
  let current = NAV_ITEMS[0].id;
  for (const item of NAV_ITEMS) {
    const el = document.getElementById(item.id);
    if (el && el.getBoundingClientRect().top <= SCROLL_OFFSET) {
      current = item.id;
    }
  }
  return current;
}
