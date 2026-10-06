import { Anton, Poppins } from "next/font/google";

import DriftWall from "@/components/ui/Driftwall";
import AccordionGallery from "@/components/ui/AccordionGallery";
import { MetallicGoldText } from "@/components/metallic-gold-text";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Temporary placeholder for the quick info and services sections.
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1783659434/foodhub/stalls/vvsbpg1scf5jyvfca17v.jpg";

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

// Temporary services. Replace labels/images with real ones.
const SERVICES = [
  "Farm Products",
  "Processing",
  "Training",
  "Marketing",
  "Community",
].map((label) => ({ image: PLACEHOLDER_IMAGE, label, link: "#" }));

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

export default function Home() {
  return (
    <main className={cn(poppins.className, "bg-black text-white")}>
      {/* HERO */}
      <section className="relative h-svh min-h-[520px] w-full overflow-hidden bg-black [container-type:inline-size]">
        <div className="absolute inset-0">
          <DriftWall
            items={WALL_ITEMS}
            columns={5}
            tileWidth={200}
            tileHeight={132}
            gap={18}
            tilt={16}
            turn={-14}
            perspective={1200}
            depth={120}
            speed={42}
            direction="up"
            variance={0.45}
            parallax={0.6}
            lift={64}
            fade={0.6}
            dim={0.55}
            overlayColor="#000000"
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
      <section className="bg-black">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:gap-16">
          <Reveal className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PLACEHOLDER_IMAGE}
              alt="Ginger grown by PRIC member farmers"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
            <div className="absolute -bottom-6 -right-2 rounded-2xl bg-[#b8960c] px-6 py-3 text-center shadow-xl md:-right-8">
              <p
                className="text-4xl font-bold leading-none text-white md:text-5xl"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                20+
              </p>
              <p
                className="mt-1 text-xs font-bold leading-tight text-white"
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
                Established as a cooperative in 2004, PRIC-MPC has more than two
                decades of experience supporting local farmers and developing
                agricultural products in Pinagdanlayan, Dolores, Quezon
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-black">
        <div className="mx-auto max-w-6xl px-6 pb-28 pt-12">
          <Reveal>
            <MetallicGoldText
              as="h2"
              className={anton.className}
              style={headingStyle}
            >
              Our Services
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
    </main>
  );
}