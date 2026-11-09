export interface ProductItem {
  id: number;
  name: string;
  description: string;
  image: string;
  /** Placeholder price in PHP. */
  price: number;
}

export const BRAND_LOGO =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791348338/cd304fcc-7a4f-468c-a885-9ccc263d8d3c.png";

// Placeholder until real product photos are available (public/products.png).
const PLACEHOLDER_IMAGE = "/products.png";

export const PRODUCT_LIST: ProductItem[] = [
  {
    id: 1,
    name: "Hillside Turmeric Brew – Luyang Dilaw",
    description:
      "A natural turmeric-based powdered beverage made from luyang dilaw, offering a warm, earthy flavor.",
    image: PLACEHOLDER_IMAGE,
    price: 150,
  },
  {
    id: 2,
    name: "Hillside Ginger Brew – With Coco Sugar",
    description:
      "A ginger-based powdered beverage blended with coconut sugar for a naturally sweet taste.",
    image: PLACEHOLDER_IMAGE,
    price: 165,
  },
  {
    id: 3,
    name: "Hillside Ginger Brew – Instant Salabat",
    description:
      "A convenient instant ginger beverage inspired by traditional Filipino salabat, delivering a warm and refreshing ginger flavor.",
    image: PLACEHOLDER_IMAGE,
    price: 120,
  },
  {
    id: 4,
    name: "Hillside Ginger Brew – With Oregano",
    description:
      "A ginger-based powdered beverage infused with oregano, combining the distinct flavors of ginger and aromatic herbs.",
    image: PLACEHOLDER_IMAGE,
    price: 155,
  },
  {
    id: 5,
    name: "Hillside Ginger Brew – With Turmeric",
    description:
      "A blend of ginger and turmeric that combines their earthy, mildly spicy flavors in a convenient powdered drink.",
    image: PLACEHOLDER_IMAGE,
    price: 160,
  },
  {
    id: 6,
    name: "Hillside Ginger Brew – With Honey",
    description:
      "A ginger-based beverage blended with honey for a naturally sweet and soothing flavor.",
    image: PLACEHOLDER_IMAGE,
    price: 180,
  },
  {
    id: 7,
    name: "Hillside Ginger Brew – With Moringa",
    description:
      "A ginger-based powdered beverage featuring moringa, combining ginger's distinct flavor with the earthy taste of moringa leaves.",
    image: PLACEHOLDER_IMAGE,
    price: 170,
  },
  {
    id: 8,
    name: "Hillside Ginger Cookies",
    description:
      "Crunchy ginger-flavored cookies made with ginger as a key ingredient, offering a sweet and mildly spiced snack.",
    image: PLACEHOLDER_IMAGE,
    price: 95,
  },
  {
    id: 9,
    name: "Hillside Peanut Brittle",
    description:
      "A traditional crunchy confection made with peanuts and caramelized sugar, offering a sweet, nutty flavor.",
    image: PLACEHOLDER_IMAGE,
    price: 85,
  },
];