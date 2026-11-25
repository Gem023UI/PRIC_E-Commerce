export interface ProductItem {
  id: number;
  name: string;
  description: string;
  image: string;
  /** Price in PHP. */
  price: number;
  stock: number;
  /** True when stock is at or below the product's low-stock level. */
  lowStock: boolean;
}

export const BRAND_LOGO =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791348338/cd304fcc-7a4f-468c-a885-9ccc263d8d3c.png";