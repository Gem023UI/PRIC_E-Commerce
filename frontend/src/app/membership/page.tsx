import type { Metadata } from "next";
import MembershipPage from "@/features/membership/MembershipPage";

export const metadata: Metadata = {
  title: "Membership | PRIC-MPC",
  description:
    "Learn how to become a member of the Pinagdinlayan Rural Improvement Club Multipurpose Cooperative.",
};

export default function Page() {
  return <MembershipPage />;
}