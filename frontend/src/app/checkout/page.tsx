import { Suspense } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { CheckoutPage } from "@/features/checkout/CheckoutPage";

export const metadata = { title: "Checkout | PRIC" };

export default function Page() {
  return (
    <>
      <Header />
      <Suspense>
        <CheckoutPage />
      </Suspense>
      <Footer />
    </>
  );
}