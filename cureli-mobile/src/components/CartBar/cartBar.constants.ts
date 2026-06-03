import { Spacing } from "../../theme/spacing";

export const GLOBAL_CART_BAR_HEIGHT = 64;

// Small gap between the cart bar and whatever sits below it:
// - on normal stack screens → screen edge / safe area
// - on tab screens          → top of the tab bar
export const GLOBAL_CART_BAR_BOTTOM_OFFSET = Spacing.lg; // 12

// Extra breathing room above the cart bar for scroll/list content.
// Chosen so non-tab screens keep roughly the same feel as before.
export const GLOBAL_CART_BAR_CLEARANCE = Spacing.base + Spacing.md; // 28

// Fallback used only until the custom tab bar measures itself.
// After layout runs, the real measured height replaces this.
export const DEFAULT_BOTTOM_TAB_BAR_HEIGHT = 72;