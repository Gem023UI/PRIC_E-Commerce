export const SHIPPING_FEE = 50; // PHP, fixed for now
export const MAX_LINE_QUANTITY = 50;

export type CatalogItem = { id: number; name: string; price: number };

const ITEMS: CatalogItem[] = [
  { id: 1, name: "Hillside Turmeric Brew – Luyang Dilaw", price: 150 },
  { id: 2, name: "Hillside Ginger Brew – With Coco Sugar", price: 165 },
  { id: 3, name: "Hillside Ginger Brew – Instant Salabat", price: 120 },
  { id: 4, name: "Hillside Ginger Brew – With Oregano", price: 155 },
  { id: 5, name: "Hillside Ginger Brew – With Turmeric", price: 160 },
  { id: 6, name: "Hillside Ginger Brew – With Honey", price: 180 },
  { id: 7, name: "Hillside Ginger Brew – With Moringa", price: 170 },
  { id: 8, name: "Hillside Ginger Cookies", price: 95 },
  { id: 9, name: "Hillside Peanut Brittle", price: 85 },
];

export const CATALOG = new Map<number, CatalogItem>(ITEMS.map((i) => [i.id, i]));