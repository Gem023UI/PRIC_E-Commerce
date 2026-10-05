import { Anton, Poppins } from "next/font/google";

import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { MetallicGoldText } from "@/components/metallic-gold-text";
import { cn } from "@/lib/utils";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

// Temporary hero image. Replace with real PRIC photos (one entry per image).
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1783659434/foodhub/stalls/vvsbpg1scf5jyvfca17v.jpg";
const IMAGES = Array.from({ length: 8 }, () => ({ src: PLACEHOLDER_IMAGE }));

export default function Home() {
  return (
    <main className="min-h-svh bg-white text-neutral-900">
      <ImageStreamHero
        images={IMAGES}
        axis={49}
        className="h-svh min-h-[520px] w-full bg-white"
      >
        <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
          <MetallicGoldText
            as="h1"
            className={cn(anton.className, "select-none")}
            style={{
              fontSize: "30cqw",
              lineHeight: 1.1,
              letterSpacing: "0.01em",
            }}
          >
            PRIC
          </MetallicGoldText>
          <p
            className={cn(poppins.className, "mt-[1cqw] text-balance")}
            style={{ fontSize: "clamp(0.8rem, 2cqw, 1.75rem)" }}
          >
            Pinagdinlayan Rural Improvement Club Multipurpose Cooperative
          </p>
        </div>
      </ImageStreamHero>
    </main>
  );
}