import { Anton, Poppins } from "next/font/google";

export const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});