import { Anton, Poppins } from "next/font/google";

import DriftWall from "@/components/ui/Driftwall";
import AccordionGallery from "@/components/ui/AccordionGallery";
import ProductCarousel from "@/components/ui/ProductCarousel";
import EventCarousel from "@/components/ui/EventCarousel";
import { Footer } from "@/components/footer";
import { MetallicGoldText } from "@/components/metallic-gold-text";
import { Reveal } from "@/components/Reveal";
import { EVENTS } from "@/data/events";
import { cn } from "@/lib/utils";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Temporary placeholder for the quick info and services sections.
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg";

const BRAND_LOGO =
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

const WALL_ITEMS = Array.from({ length: 15 }, (_, i) => ({
  image: WALL_IMAGES[i % WALL_IMAGES.length],
  title: `PRIC photo ${(i % WALL_IMAGES.length) + 1}`,
}));

const SERVICES = [
  {
    label: "FARM PRODUCTS",
    description: "Fresh local harvests from our member farmers, sold directly to the community.",
  },
  {
    label: "PROCESSING",
    description: "Turning raw agricultural produce into packaged, ready-to-sell goods.",
  },
  {
    label: "TRAINING",
    description: "Skills and livelihood programs that help members grow their farms and income.",
  },
  {
    label: "MARKETING",
    description: "Helping members bring their products to wider markets.",
  },
  {
    label: "COMMUNITY",
    description: "Programs and support that keep our members and neighbors growing together.",
  },
].map((s) => ({ image: PLACEHOLDER_IMAGE, link: "#", ...s }));

const PRODUCTS = [
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343246/344aad7c-52a3-4c87-b014-c5807958fc48.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343232/c728a9e7-8f4d-4e7f-a95e-c68e5f0084e9.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343191/c6cea27e-4d84-41c3-9352-2736949990b5.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343213/1ed84785-f17c-4b1e-bf47-86c132666f9d.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791343044/f531ba2b-ab2b-4141-a43e-71d9865f5ff8.png",
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791342959/2755073f-8896-475c-b3d7-3331231e5dde.png",
].map((image, i) => ({ image, alt: `PRIC product ${i + 1}` }));

// Same gold stops as the hero "PRIC" text, applied statically.
const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

export default function Home() {
  return (
    <>
      <main className={cn(poppins.className, "bg-black text-white")}>
        {/* HERO */}
        <section
          id="home"
          className="relative h-svh min-h-[520px] w-full overflow-hidden bg-black [container-type:inline-size]"
        >
          <div className="absolute inset-0">
            <DriftWall
              items={WALL_ITEMS}
              columns={5}
              tileWidth={200}
              tileHeight={132}
              gap={18}
              tilt={16}
              turn={0}
              perspective={2000}
              depth={120}
              speed={42}
              direction="up"
              variance={0.45}
              parallax={0.6}
              lift={64}
              fade={0.6}
              dim={2}
              overlayColor="#08080800"
              radius={14}
              roll={0}
              pauseOnHover={false}
              grayscale={false}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.4)_75%)]" />

          <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
            <Reveal>
              <MetallicGoldText
                as="h1"
                className={cn(anton.className, "select-none")}
                style={{
                  fontSize: "24cqw",
                  lineHeight: 1.1,
                  letterSpacing: "0.01em",
                }}
              >
                PRIC
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150}>
              <h2
                className="mt-[1.5cqw] font-semibold uppercase text-balance"
                style={{ fontSize: "clamp(0.7rem, 1.7cqw, 1.6rem)" }}
              >
                Pinagdinlayan Rural Improvement Club Multipurpose Cooperative
              </h2>
            </Reveal>
            <Reveal delay={300}>
              <p
                className="mx-auto mt-[1.5cqw] max-w-[60cqw] text-balance"
                style={{ fontSize: "clamp(0.7rem, 1.3cqw, 1.2rem)" }}
              >
                A community-based multipurpose cooperative in Pinagdanlayan,
                Dolores, Quezon, dedicated to supporting local farmers and
                transforming agricultural products into sustainable livelihood
                opportunities.
              </p>
            </Reveal>
          </div>
        </section>

        {/* QUICK INFO */}
        <section id="about" className="bg-black">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:gap-16">
            <Reveal className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={PLACEHOLDER_IMAGE}
                alt="Ginger grown by PRIC member farmers"
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
              <div
                className="absolute -bottom-6 -right-2 rounded-2xl border border-[#784c0e]/35 px-6 py-3 text-center shadow-xl md:-right-8"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                <p
                  className="text-4xl font-bold leading-none text-[#FFFFFF] md:text-5xl"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  20+
                </p>
                <p
                  className="mt-1 text-xs font-bold leading-tight text-[#FFFFFF]"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Years In Service to
                  <br />
                  the Community
                </p>
              </div>
            </Reveal>

            <div>
              <Reveal delay={150}>
                <MetallicGoldText
                  as="h2"
                  className={anton.className}
                  style={headingStyle}
                >
                  Where Farmers Find the Community to Grow With.
                </MetallicGoldText>
              </Reveal>
              <Reveal delay={300}>
                <p className="mt-6 max-w-md text-lg leading-snug md:text-xl">
                  Established as a cooperative in 2004, PRIC-MPC has more than
                  two decades of experience supporting local farmers and
                  developing agricultural products in Pinagdanlayan, Dolores,
                  Quezon Province.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-28 pt-12">
            <Reveal>
              <MetallicGoldText
                as="h2"
                className={anton.className}
                style={headingStyle}
              >
                OUR SERVICES
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150} className="mt-10">
              <AccordionGallery
                items={SERVICES}
                defaultIndex={2}
                expandRatio={0.52}
                trigger="hover"
                accentColor="#ffffff"
                overlayColor="#060010"
                textColor="#ffffff"
                grayscale
                showLabels
                duration={0.6}
                ease="power3.out"
                parallax={0.5}
                tilt={8}
                stagger={0.06}
                height={460}
                gap={10}
                radius={16}
                orientation="horizontal"
              />
            </Reveal>
          </div>
        </section>

        {/* BRAND */}
        <section id="brand" className="bg-black">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:gap-16">
            <Reveal>
              <div
                className="rounded-2xl p-[3px] shadow-xl"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BRAND_LOGO}
                  alt="Hillside Food Products logo"
                  className="aspect-[4/3] w-full rounded-[13px] bg-black object-cover"
                />
              </div>
            </Reveal>

            <div>
              <Reveal delay={150}>
                <MetallicGoldText
                  as="h2"
                  className={anton.className}
                  style={headingStyle}
                >
                  Hillside Food Products Inc.
                </MetallicGoldText>
              </Reveal>
              <Reveal delay={300}>
                <p className="mt-6 max-w-md text-lg leading-snug md:text-xl">
                  Specializing in value-added products made from locally
                  sourced agricultural ingredients, its products include ginger
                  and turmeric-based beverages, flavored ginger brews, and
                  other processed food products, helping PRIC-MPC turn local
                  farm produce into marketable products and additional
                  livelihood opportunities for its cooperative members.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section id="products" className="bg-black">
          <div className="pb-28 pt-12">
            <Reveal className="px-6 text-center">
              <MetallicGoldText
                as="h2"
                className={anton.className}
                style={headingStyle}
              >
                OUR PRODUCTS
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150} className="mt-10">
              <ProductCarousel items={PRODUCTS} />
            </Reveal>
          </div>
        </section>

        {/* EVENTS */}
        <section id="events" className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-28 pt-12">
            <Reveal>
              <MetallicGoldText
                as="h2"
                className={anton.className}
                style={headingStyle}
              >
                LATEST EVENTS
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150} className="mt-10">
              <EventCarousel events={EVENTS} />
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}