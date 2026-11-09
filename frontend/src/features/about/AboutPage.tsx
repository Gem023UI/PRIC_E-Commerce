import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import BounceCards from "@/components/ui/BounceCards/BounceCards";
import AwardsCarousel, {
  type AwardsCarouselItem,
} from "@/components/ui/AwardsCarousel";
import { anton, poppins } from "@/lib/fonts";
import { cn } from "@/lib/utils";

// Temporary placeholder photo (public/gingerproducts.jpg).
const PLACEHOLDER_IMAGE = "/gingerproducts.jpg";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

const BOUNCE_IMAGES = [
  "https://images.unsplash.com/photo-1724152312974-d4d48b8b36fd?w=480&h=480&fit=crop",
  "https://images.unsplash.com/photo-1762846818262-33c197852fa8?w=480&h=480&fit=crop",
  "https://images.unsplash.com/photo-1721407964262-f9864b562453?w=480&h=480&fit=crop",
  "https://images.unsplash.com/photo-1776394254711-4a0d7345269a?w=480&h=480&fit=crop",
  "https://images.unsplash.com/photo-1763440519433-5467759054fc?w=480&h=480&fit=crop",
];

// SAMPLE DATA: replace with the cooperative's real awards.
const AWARDS: AwardsCarouselItem[] = [
  {
    image: PLACEHOLDER_IMAGE,
    title: "Outstanding Rural Improvement Club",
    event: "Regional Gawad Saka - 2017",
  },
  {
    image: PLACEHOLDER_IMAGE,
    title: "Best Cooperative Enterprise",
    event: "Provincial Cooperative Awards - 2018",
  },
  {
    image: PLACEHOLDER_IMAGE,
    title: "Excellence in Community Livelihood",
    event: "Negosyo Center Recognition - 2019",
  },
  {
    image: PLACEHOLDER_IMAGE,
    title: "Outstanding Agri-Based Product",
    event: "Quezon Food Fair - 2021",
  },
  {
    image: PLACEHOLDER_IMAGE,
    title: "Cooperative of the Year",
    event: "Municipal Recognition Awards - 2023",
  },
];

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

/** Polaroid-style photo card used in the hero. */
function Polaroid({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "absolute bg-[#f2f1ee] shadow-[0_10px_28px_rgba(0,0,0,0.6)]",
        className,
      )}
      style={style}
    >
      <div className="absolute left-[3.5%] right-[3.5%] top-[4%] bottom-[26%] overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.45)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
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
      <main className={cn(poppins.className, "overflow-x-clip text-white")}>
        {/* HERO */}
        <section id="about">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-40 md:grid-cols-2 md:gap-8">
            <div>
              <Reveal>
                <MetallicGoldText
                  as="h1"
                  className={cn(anton.className, "select-none")}
                  style={{
                    fontSize: "clamp(3.5rem, 9vw, 7rem)",
                    lineHeight: 1.1,
                    letterSpacing: "0.01em",
                  }}
                >
                  ABOUT US
                </MetallicGoldText>
              </Reveal>
              <Reveal delay={150}>
                <p className="mt-6 max-w-md text-lg leading-snug md:text-xl">
                  Provided below are the information as to how the cooperative
                  brings and sustain the community.
                </p>
              </Reveal>
            </div>

            <Reveal delay={300}>
              <div className="relative mx-auto aspect-[447/314] w-full max-w-[560px]">
                <Polaroid
                  src={PLACEHOLDER_IMAGE}
                  alt="PRIC MPC community photo"
                  className="z-[1]"
                  style={{
                    left: "0%",
                    top: "25%",
                    width: "46.5%",
                    height: "67%",
                    transform: "rotate(-6deg)",
                  }}
                />
                <Polaroid
                  src={PLACEHOLDER_IMAGE}
                  alt="PRIC MPC community photo"
                  className="z-[1]"
                  style={{
                    left: "49.7%",
                    top: "26%",
                    width: "50.3%",
                    height: "74%",
                    transform: "rotate(5deg)",
                  }}
                />
                <Polaroid
                  src={PLACEHOLDER_IMAGE}
                  alt="PRIC MPC community photo"
                  className="z-[2]"
                  style={{
                    left: "23%",
                    top: "0%",
                    width: "54%",
                    height: "86%",
                    transform: "rotate(4deg)",
                  }}
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* WHO ARE WE */}
        <section className="overflow-x-clip">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-16 text-center">
            <div className="flex max-w-full justify-center">
              <BounceCards
                images={BOUNCE_IMAGES}
                containerWidth={500}
                containerHeight={320}
                cardSize={200}
                spread={85}
                rotation={10}
                arc={0}
                pushDistance={160}
                hoverScale={1.06}
                bounciness={0.6}
                animationDelay={0.5}
                animationStagger={0.06}
                borderWidth={5}
                borderColor="#ffffff"
                radius={25}
                shadow
                enableHover
              />
            </div>

            <SectionHeading className="mt-8">Who Are We?</SectionHeading>
            <Reveal delay={150} as="p" className="mt-4 max-w-3xl text-lg leading-snug md:text-xl">
              <strong className="font-bold">
                Pinagdanlayan Rural Improvement Club Multipurpose Cooperative
                (PRIC MPC)
              </strong>{" "}
              is a community-oriented cooperative based in Pinagdanlayan,
              Dolores, Quezon, Philippines. It brings people together through
              cooperation, shared opportunities, and collective efforts toward
              improving the economic and social well-being of its members and
              the wider community.
            </Reveal>
          </div>
        </section>

        {/* AWARDS AND RECOGNITIONS */}
        <section>
          <div className="mx-auto max-w-6xl px-6 pb-8 pt-16 text-center">
            <SectionHeading>Awards and Recognitions</SectionHeading>
          </div>
          <AwardsCarousel items={AWARDS} />
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-8 text-center">
            <Reveal
              as="p"
              delay={150}
              className="mx-auto max-w-3xl text-lg leading-snug md:text-xl"
            >
              In accordance with Department of Agriculture and Department of
              Trade and Industry, PRIC receive recognition for its outstanding
              performance and inclusivity both in the community and their
              well-known products.
            </Reveal>
          </div>
        </section>

        {/* MISSION & VISION (unchanged) */}
        <section>
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
        <section>
          <div className="mx-auto max-w-4xl px-6 pb-28 pt-12">
            <SectionHeading className="text-center">Our Core Values</SectionHeading>
            <div className="mt-12 flex flex-col gap-10">
              {VALUES.map((v, i) => (
                <div
                  key={v.title}
                  className="grid items-center gap-10 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)] md:gap-15"
                >
                  <Reveal delay={(i % 2) * 100}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={PLACEHOLDER_IMAGE}
                      alt={v.title}
                      className="aspect-video w-full object-cover"
                    />
                  </Reveal>
                  <div>
                    <Reveal delay={150}>
                      <MetallicGoldText
                        as="h3"
                        className={anton.className}
                        style={{
                          fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                          lineHeight: 1.15,
                        }}
                      >
                        {v.title}
                      </MetallicGoldText>
                    </Reveal>
                    <Reveal as="p" delay={300} className="mt-3 max-w-sm leading-snug md:text-lg">
                      {v.text}
                    </Reveal>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}