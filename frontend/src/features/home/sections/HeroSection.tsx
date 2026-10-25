import DriftWall from "@/components/ui/DriftWall/Driftwall";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";

import { WALL_ITEMS } from "../home.data";

export default function HeroSection() {
  return (
    <section
      id="home"
      className="sticky top-0 z-0 h-svh min-h-[520px] w-full overflow-hidden bg-black [container-type:inline-size]"
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
  );
}