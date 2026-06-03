import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "../theme/spacing";
import { useCartBarVisibility } from "./useCartBarVisibility";
import { useIsBottomTabRoute } from "./useIsBottomTabRoute";
import { useLayoutStore } from "../store/layoutStore";
import {
  DEFAULT_BOTTOM_TAB_BAR_HEIGHT,
  GLOBAL_CART_BAR_BOTTOM_OFFSET,
  GLOBAL_CART_BAR_CLEARANCE,
  GLOBAL_CART_BAR_HEIGHT,
} from "../components/CartBar/cartBar.constants";

export function useCartBottomPadding(
  hiddenPadding: number = Spacing["3xl"],
): number {
  const insets = useSafeAreaInsets();
  const { isVisible } = useCartBarVisibility();
  const isBottomTabRoute = useIsBottomTabRoute();

  const bottomTabBarHeight = useLayoutStore(
    (state) => state.bottomTabBarHeight,
  );

  const effectiveTabBarHeight =
    bottomTabBarHeight > 0
      ? bottomTabBarHeight
      : DEFAULT_BOTTOM_TAB_BAR_HEIGHT;

  return useMemo(() => {
    if (!isVisible) return hiddenPadding;

    const cartBarBottom = isBottomTabRoute
      ? effectiveTabBarHeight + GLOBAL_CART_BAR_BOTTOM_OFFSET
      : insets.bottom + GLOBAL_CART_BAR_BOTTOM_OFFSET;

    return (
      cartBarBottom +
      GLOBAL_CART_BAR_HEIGHT +
      GLOBAL_CART_BAR_CLEARANCE
    );
  }, [
    hiddenPadding,
    isVisible,
    isBottomTabRoute,
    effectiveTabBarHeight,
    insets.bottom,
  ]);
}