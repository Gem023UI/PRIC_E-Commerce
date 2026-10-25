// Temporary placeholder for the quick info and services sections.
export const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg";

export const BRAND_LOGO =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791348338/cd304fcc-7a4f-468c-a885-9ccc263d8d3c.png";

const WALL_IMAGES = [
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293240/787406121_4555971071392654_8235096076024700700_n_nrzqbk.jpg",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/774140328_4545181129138315_1459818386803115824_n_kunz9h.jpg",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/758765059_4523738057949289_8469846181700255174_n_zf5cim.jpg",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/733850121_4492535141069581_1689464869554431150_n_c2yxt4.jpg",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/757507477_4523738144615947_5884373254044440815_n_v6yhno.jpg",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/667665725_4404376059885490_8391566533048496901_n_wmbgrr.jpg",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/758600144_4523738007949294_7588455720974017579_n_dvtcyq.jpg",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293235/775213730_4548485208807907_2974617904954519640_n_ks0pmu.jpg",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg",
];

export const WALL_ITEMS = Array.from({ length: 15 }, (_, i) => ({
  image: WALL_IMAGES[i % WALL_IMAGES.length],
  title: `PRIC photo ${(i % WALL_IMAGES.length) + 1}`,
}));

export const SERVICES = [
  {
    label: "FARM PRODUCTS",
    description:
      "Fresh local harvests from our member farmers, sold directly to the community.",
  },
  {
    label: "PROCESSING",
    description:
      "Turning raw agricultural produce into packaged, ready-to-sell goods.",
  },
  {
    label: "TRAINING",
    description:
      "Skills and livelihood programs that help members grow their farms and income.",
  },
  {
    label: "MARKETING",
    description: "Helping members bring their products to wider markets.",
  },
  {
    label: "COMMUNITY",
    description:
      "Programs and support that keep our members and neighbors growing together.",
  },
].map((s) => ({ image: PLACEHOLDER_IMAGE, ...s }));

export const PRODUCTS = [
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343246/344aad7c-52a3-4c87-b014-c5807958fc48.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343232/c728a9e7-8f4d-4e7f-a95e-c68e5f0084e9.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343191/c6cea27e-4d84-41c3-9352-2736949990b5.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343213/1ed84785-f17c-4b1e-bf47-86c132666f9d.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343044/f531ba2b-ab2b-4141-a43e-71d9865f5ff8.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791342959/2755073f-8896-475c-b3d7-3331231e5dde.png",
].map((image, i) => ({ image, alt: `PRIC product ${i + 1}` }));

// Same gold stops as the hero "PRIC" text, applied statically.
export const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

export const HEADING_STYLE = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;