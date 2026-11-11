import type { Metadata } from "next";
import MembershipForm from "@/features/membership/MembershipForm";

export const metadata: Metadata = {
  title: "Membership Application | PRIC-MPC",
  description: "Fill out the PRIC-MPC membership application form.",
};

export default function Page() {
  return <MembershipForm />;
}