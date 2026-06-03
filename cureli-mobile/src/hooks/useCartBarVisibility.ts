import { useMemo } from "react";
import { usePathname } from "expo-router";

import { useCartStore } from "../store/cartStore";

function shouldHideCartBar(pathname: string): boolean {
  // App bootstrap / non-shopping flows
  if (pathname === "/") return true;
  if (pathname === "/intro" || pathname === "/splash") return true;
  if (pathname === "/login" || pathname === "/otp") return true;

  // Cart / profile / checkout flows
  if (pathname === "/cart") return true;
  if (pathname === "/profile" || pathname.startsWith("/profile/")) return true;
  if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return true;

  // Order detail screens only.
  // IMPORTANT: "/orders" stays visible because that's the tab screen.
  if (pathname.startsWith("/orders/")) return true;

  // Prescription flow
  if (pathname === "/prescription" || pathname.startsWith("/prescription/")) {
    return true;
  }

  // Onboarding flow
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return true;
  }

  return false;
}

export function useCartBarVisibility() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.cartCount);

  const isVisible = useMemo(() => {
    return cartCount > 0 && !shouldHideCartBar(pathname);
  }, [cartCount, pathname]);

  return { isVisible };
}