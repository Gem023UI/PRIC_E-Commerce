export interface ProductItem {
  id: number;
  name: string;
  description: string;
  image: string;
}

export const BRAND_LOGO =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791348338/cd304fcc-7a4f-468c-a885-9ccc263d8d3c.png";

const IMAGES = [
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343246/344aad7c-52a3-4c87-b014-c5807958fc48.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343232/c728a9e7-8f4d-4e7f-a95e-c68e5f0084e9.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343191/c6cea27e-4d84-41c3-9352-2736949990b5.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343213/1ed84785-f17c-4b1e-bf47-86c132666f9d.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343044/f531ba2b-ab2b-4141-a43e-71d9865f5ff8.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791342959/2755073f-8896-475c-b3d7-3331231e5dde.png",
];

// Placeholder names / descriptions. Edit these per product.
export const PRODUCT_LIST: ProductItem[] = IMAGES.map((image, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  description: "Product description goes here.",
  image,
}));