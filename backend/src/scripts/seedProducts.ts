import { connectDatabase, disconnectDatabase } from "../database/connection";
import { Order } from "../database/models/order.model";
import { Product } from "../database/models/product.model";
import { StockMovement } from "../database/models/stockMovement.model";

const PLACEHOLDER = "/products.png";
const START_STOCK = 50; // change it afterwards from the admin dashboard

const PRODUCTS = [
  { productId: 1, name: "Hillside Turmeric Brew – Luyang Dilaw", price: 150, description: "A natural turmeric-based powdered beverage made from luyang dilaw, offering a warm, earthy flavor." },
  { productId: 2, name: "Hillside Ginger Brew – With Coco Sugar", price: 165, description: "A ginger-based powdered beverage blended with coconut sugar for a naturally sweet taste." },
  { productId: 3, name: "Hillside Ginger Brew – Instant Salabat", price: 120, description: "A convenient instant ginger beverage inspired by traditional Filipino salabat, delivering a warm and refreshing ginger flavor." },
  { productId: 4, name: "Hillside Ginger Brew – With Oregano", price: 155, description: "A ginger-based powdered beverage infused with oregano, combining the distinct flavors of ginger and aromatic herbs." },
  { productId: 5, name: "Hillside Ginger Brew – With Turmeric", price: 160, description: "A blend of ginger and turmeric that combines their earthy, mildly spicy flavors in a convenient powdered drink." },
  { productId: 6, name: "Hillside Ginger Brew – With Honey", price: 180, description: "A ginger-based beverage blended with honey for a naturally sweet and soothing flavor." },
  { productId: 7, name: "Hillside Ginger Brew – With Moringa", price: 170, description: "A ginger-based powdered beverage featuring moringa, combining ginger's distinct flavor with the earthy taste of moringa leaves." },
  { productId: 8, name: "Hillside Ginger Cookies", price: 95, description: "Crunchy ginger-flavored cookies made with ginger as a key ingredient, offering a sweet and mildly spiced snack." },
  { productId: 9, name: "Hillside Peanut Brittle", price: 85, description: "A traditional crunchy confection made with peanuts and caramelized sugar, offering a sweet, nutty flavor." },
];

type LeanOrder = { _id: unknown; items: { productId: number; image?: string | null }[] };

async function main() {
  await connectDatabase();

  // Existing products are never overwritten, so this is safe to rerun.
  let created = 0;
  for (const p of PRODUCTS) {
    const res = await Product.updateOne(
      { productId: p.productId },
      {
        $setOnInsert: {
          ...p,
          image: PLACEHOLDER,
          stock: START_STOCK,
          lowStockThreshold: 10,
          published: true,
          deletedAt: null,
        },
      },
      { upsert: true },
    );
    if (res.upsertedCount) {
      created++;
      await StockMovement.create({
        productId: p.productId,
        delta: START_STOCK,
        balance: START_STOCK,
        reason: "initial",
        note: "Starting stock",
        by: "Seed script",
      });
    }
  }
  console.log(`Products: ${created} added, ${PRODUCTS.length - created} already existed.`);

  // Older orders have no item images; copy them from the matching product.
  const images = new Map(
    ((await Product.find().select("productId image").lean()) as unknown as { productId: number; image: string }[]).map(
      (p) => [p.productId, p.image],
    ),
  );
  const stale = (await Order.find({ items: { $elemMatch: { image: { $in: [null, ""] } } } })
    .select("items")
    .lean()) as unknown as LeanOrder[];

  for (const o of stale) {
    const items = o.items.map((i) => ({ ...i, image: i.image || images.get(i.productId) || PLACEHOLDER }));
    await Order.updateOne({ _id: o._id }, { $set: { items } });
  }
  console.log(`Orders: added images to ${stale.length} older order(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());