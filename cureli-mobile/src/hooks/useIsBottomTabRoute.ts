import { useMemo } from "react";
import { usePathname } from "expo-router";

const TAB_ROUTES = new Set([
  "/home",
  "/orders",
  "/categories",
  "/profile",
]);

export function useIsBottomTabRoute(): boolean {
  const pathname = usePathname();

  return useMemo(() => TAB_ROUTES.has(pathname), [pathname]);
}