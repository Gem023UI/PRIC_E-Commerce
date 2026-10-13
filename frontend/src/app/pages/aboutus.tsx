import { Anton, Poppins } from "next/font/google";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MetallicGoldText } from "@/components/metallic-gold-text";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";
import DriftWall from "@/components/ui/Driftwall";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Temporary placeholder photo, same one used on the home page.
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg";

const BRAND_LOGO =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791348338/cd304fcc-7a4f-468c-a885-9ccc263d8d3c.png";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

const VALUES = [
  {
    title: "Cooperation",
    text: "We believe that working together creates opportunities and enables our members to achieve shared goals.",
  },
  {
    title: "Integrity",
    text: "We value honesty, transparency, accountability, and responsible management in our operations.",
  },
  {
    title: "Community Empowerment",
    text: "We strive to support initiatives that contribute to the well-being and development of our members and community.",
  },
  {
    title: "Inclusivity",
    text: "We encourage participation, collaboration, and respect among members from different backgrounds and circumstances.",
  },
  {
    title: "Sustainability",
    text: "We seek opportunities that support long-term economic stability, responsible enterprise, and community progress.",
  },
];

const WHAT_WE_DO = [
  {
    title: "Cooperative Membership",
    text: "Information and resources for existing and prospective members.",
  },
  {
    title: "Agricultural Products and Livelihood",
    text: "Support for local agricultural activities, farmers, and community-based sources of livelihood.",
  },
  {
    title: "Products and Enterprise",
    text: "Access to products and business initiatives associated with the cooperative.",
  },
  {
    title: "Financial and Member Services",
    text: "Information about available savings, credit, or other financial services, subject to the cooperative's actual authorized operations.",
  },
  {
    title: "Community Development",
    text: "Initiatives that encourage participation, collaboration, and shared economic opportunities.",
  },
  {
    title: "Digital Cooperative Services",
    text: "Online access to product information, announcements, member resources, and other available cooperative services.",
  },
];

const PRINCIPLES = [
  "Voluntary and Open Membership",
  "Democratic Member Control",
  "Member Economic Participation",
  "Autonomy and Independence",
  "Education, Training, and Information",
  "Cooperation Among Cooperatives",
  "Concern for Community",
];

const CONTACT = [
  { label: "Organization", value: "Pinagdanlayan Rural Improvement Club Multipurpose Cooperative (PRIC MPC)" },
  { label: "Location", value: "Pinagdanlayan, Dolores, Quezon, Philippines" },
  { label: "Contact Number", value: "[Insert official contact number]" },
  { label: "Email Address", value: "[Insert official email address]" },
  { label: "Office Hours", value: "[Insert verified office hours]" },
  { label: "Facebook Page", value: "[Insert official social media link]" },
];

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

function SectionHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <MetallicGoldText as="h2" className={anton.className} style={headingStyle}>
        {children}
      </MetallicGoldText>
    </Reveal>
  );
}

/** Black card with a metallic gold border. */
function GoldCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("h-full rounded-2xl p-[2px] shadow-xl", className)}
      style={{ backgroundImage: GOLD_GRADIENT }}
    >
      <div className="h-full rounded-[14px] bg-black p-6 md:p-8">{children}</div>
    </div>
  );
}

export const metadata = {
  title: "About Us | PRIC MPC",
  description:
    "Learn about Pinagdanlayan Rural Improvement Club Multipurpose Cooperative (PRIC MPC) in Dolores, Quezon.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={cn(poppins.className, "bg-black text-white")}>
        {/* PAGE TITLE */}
        <section id="about" className="relative overflow-hidden bg-black pt-40 pb-12 [container-type:inline-size]">
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
              dim={50}
              overlayColor="#08080800"
              radius={14}
              roll={0}
              pauseOnHover={false}
              grayscale={false}
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(185,130,42,0.18)_0%,rgba(0,0,0,0)_70%)]" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 text-center">
            <Reveal>
              <MetallicGoldText
                as="h1"
                className={cn(anton.className, "select-none")}
                style={{ fontSize: "clamp(3rem, 14cqw, 9rem)", lineHeight: 1.1, letterSpacing: "0.01em" }}
              >
                ABOUT US
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150}>
              <p
                className="mt-4 font-semibold uppercase text-balance"
                style={{ fontSize: "clamp(0.7rem, 1.7cqw, 1.2rem)" }}
              >
                PRIC MPC — Working Together for a Better Community
              </p>
            </Reveal>
          </div>
        </section>

        {/* WHO WE ARE */}
        <section className="bg-black">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:gap-16">
            <Reveal className="relative">
              <div
                className="rounded-2xl p-[3px] shadow-xl"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PLACEHOLDER_IMAGE}
                  alt="PRIC MPC members and community"
                  className="aspect-[4/3] w-full rounded-[13px] object-cover"
                />
              </div>
            </Reveal>

            <div>
              <SectionHeading>Who We Are</SectionHeading>
              <Reveal delay={150}>
                <p className="mt-6 max-w-md text-lg leading-snug md:text-xl">
                  Pinagdanlayan Rural Improvement Club Multipurpose Cooperative
                  (PRIC MPC) is a community-oriented cooperative based in
                  Pinagdanlayan, Dolores, Quezon, Philippines. It brings people
                  together through cooperation, shared opportunities, and
                  collective efforts toward improving the economic and social
                  well-being of its members and the wider community.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <p className="mt-4 max-w-md text-lg leading-snug md:text-xl">
                  Guided by the principles of cooperation and mutual support,
                  PRIC MPC creates opportunities through cooperative
                  initiatives, livelihood activities, and community-based
                  enterprises, promoting inclusive growth, responsible
                  entrepreneurship, and sustainable community development.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* OUR STORY */}
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
            <SectionHeading>Our Story</SectionHeading>
            <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-16">
              <Reveal delay={150}>
                <p className="text-lg leading-snug md:text-xl">
                  PRIC MPC represents the spirit of community cooperation, where
                  individuals work together to pursue common goals and create
                  opportunities for shared progress. Through its multipurpose
                  structure, the cooperative provides a platform for members to
                  participate in activities that support their livelihoods and
                  economic development.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <p className="text-lg leading-snug md:text-xl">
                  As community needs evolve, PRIC MPC continues to pursue
                  opportunities to strengthen its operations, improve
                  accessibility to its services, and support the people and
                  enterprises connected to the cooperative.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* MISSION & VISION */}
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
            <div className="grid gap-8 md:grid-cols-2">
              <Reveal>
                <GoldCard>
                  <MetallicGoldText as="h2" className={anton.className} style={headingStyle}>
                    Our Mission
                  </MetallicGoldText>
                  <p className="mt-4 text-lg leading-snug">
                    To empower members and strengthen the community through
                    cooperative initiatives, accessible opportunities,
                    responsible enterprise, and collective action that promote
                    economic development and improved quality of life.
                  </p>
                </GoldCard>
              </Reveal>
              <Reveal delay={150}>
                <GoldCard>
                  <MetallicGoldText as="h2" className={anton.className} style={headingStyle}>
                    Our Vision
                  </MetallicGoldText>
                  <p className="mt-4 text-lg leading-snug">
                    To become a sustainable, progressive, and community-driven
                    multipurpose cooperative that inspires collaboration,
                    supports local livelihoods, and creates lasting
                    opportunities for its members and future generations.
                  </p>
                </GoldCard>
              </Reveal>
            </div>
          </div>
        </section>

        {/* CORE VALUES */}
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
            <SectionHeading>Our Core Values</SectionHeading>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {VALUES.map((v, i) => (
                <Reveal key={v.title} delay={(i % 3) * 150}>
                  <GoldCard>
                    <MetallicGoldText as="h3" className="text-xl font-semibold">
                      {v.title}
                    </MetallicGoldText>
                    <p className="mt-3 leading-snug text-white/90">{v.text}</p>
                  </GoldCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT WE DO */}
        <section id="services" className="scroll-mt-24 bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
            <SectionHeading>What We Do</SectionHeading>
            <Reveal delay={150}>
              <p className="mt-6 max-w-2xl text-lg leading-snug md:text-xl">
                As a multipurpose cooperative, PRIC MPC brings together
                different activities that support its members and community.
              </p>
            </Reveal>
            <ul className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
              {WHAT_WE_DO.map((s, i) => (
                <Reveal as="li" key={s.title} delay={(i % 2) * 150} className="border-l-2 border-[#b9822a] pl-5">
                  <MetallicGoldText as="h3" className="text-xl font-semibold">
                    {s.title}
                  </MetallicGoldText>
                  <p className="mt-2 leading-snug text-white/90">{s.text}</p>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* HILLSIDE FOOD PRODUCTS */}
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
              <SectionHeading>Hillside Food Products</SectionHeading>
              <Reveal delay={150}>
                <p className="mt-6 max-w-md text-lg leading-snug md:text-xl">
                  Hillside Food Products is a business name associated with PRIC
                  MPC that showcases the cooperative&apos;s food products and
                  enterprise activities. Visitors can learn about available
                  products, product information, and purchasing opportunities.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <p className="mt-4 max-w-md text-lg leading-snug md:text-xl">
                  Local products, shared opportunities, community growth.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* COMMITMENT */}
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
            <SectionHeading>Our Commitment to the Community</SectionHeading>
            <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-16">
              <Reveal delay={150}>
                <p className="text-lg leading-snug md:text-xl">
                  At PRIC MPC, community development begins with cooperation. We
                  recognize the importance of creating opportunities that allow
                  members to participate, contribute, and benefit from
                  collective initiatives.
                </p>
              </Reveal>
              <Reveal delay={300}>
                <p className="text-lg leading-snug md:text-xl">
                  Through responsible management, collaboration, and the
                  continuous improvement of our services, we aim to build
                  stronger relationships with our members, support local
                  economic activities, and contribute to a more sustainable
                  future for the community.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* WHY JOIN */}
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
            <GoldCard>
              <div className="mx-auto max-w-3xl text-center">
                <SectionHeading>Why Join PRIC MPC?</SectionHeading>
                <Reveal delay={150}>
                  <p className="mt-6 text-lg leading-snug md:text-xl">
                    Becoming part of a cooperative means participating in an
                    organization built around collective interests and shared
                    responsibility. PRIC MPC welcomes inquiries from individuals
                    interested in learning more about its membership
                    requirements, available services, products, and cooperative
                    activities.
                  </p>
                </Reveal>
                <Reveal delay={300}>
                  <p className="mt-4 text-lg leading-snug md:text-xl">
                    As a member-oriented organization, the cooperative aims to
                    provide a platform where individuals can connect,
                    participate, and explore opportunities for mutual progress.
                    For information about eligibility, membership contributions,
                    benefits, and application procedures, please contact the
                    cooperative directly.
                  </p>
                </Reveal>
              </div>
            </GoldCard>
          </div>
        </section>

        {/* COOPERATIVE PRINCIPLES */}
        <section className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-12">
            <SectionHeading>Our Cooperative Principles</SectionHeading>
            <Reveal delay={150}>
              <p className="mt-6 max-w-2xl text-lg leading-snug md:text-xl">
                The internationally recognized cooperative principles that guide
                cooperative organizations.
              </p>
            </Reveal>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map((p, i) => (
                <Reveal as="li" key={p} delay={(i % 3) * 150}>
                  <GoldCard className="!p-[1.5px]">
                    <div className="flex items-center gap-4 !p-0">
                      <MetallicGoldText
                        as="span"
                        className={cn(anton.className, "text-3xl")}
                      >
                        {i + 1}
                      </MetallicGoldText>
                      <span className="font-medium leading-snug">{p}</span>
                    </div>
                  </GoldCard>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* LOOKING AHEAD */}
        <section className="bg-black">
          <div className="mx-auto max-w-4xl px-6 pb-24 pt-12 text-center">
            <SectionHeading>Looking Ahead</SectionHeading>
            <Reveal delay={150}>
              <p className="mt-6 text-lg leading-snug md:text-xl">
                PRIC MPC looks toward a future where cooperation continues to
                create opportunities for members, strengthen local enterprise,
                and encourage community participation. By building on its
                cooperative foundation and exploring responsible ways to
                improve its services, PRIC MPC seeks to make cooperative
                opportunities more accessible and meaningful to the people it
                serves.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <MetallicGoldText
                as="p"
                className="mt-8 text-xl font-semibold md:text-2xl"
              >
                Together, we can build opportunities, strengthen livelihoods,
                and move toward shared progress.
              </MetallicGoldText>
            </Reveal>
          </div>
        </section>

        {/* GET IN TOUCH */}
        <section id="contact" className="scroll-mt-24 bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-28 pt-12">
            <SectionHeading>Get in Touch</SectionHeading>
            <Reveal delay={150}>
              <p className="mt-6 max-w-2xl text-lg leading-snug md:text-xl">
                Would you like to become a member, learn more about our
                services, or inquire about our products? Connect with PRIC MPC
                and discover how the cooperative serves its members and
                community.
              </p>
            </Reveal>
            <dl className="mt-10 grid gap-x-12 gap-y-6 md:grid-cols-2">
              {CONTACT.map((c, i) => (
                <Reveal key={c.label} delay={(i % 2) * 150} className="border-l-2 border-[#b9822a] pl-5">
                  <dt>
                    <MetallicGoldText as="span" className="text-lg font-semibold">
                      {c.label}
                    </MetallicGoldText>
                  </dt>
                  <dd className="mt-1 leading-snug text-white/90">{c.value}</dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}