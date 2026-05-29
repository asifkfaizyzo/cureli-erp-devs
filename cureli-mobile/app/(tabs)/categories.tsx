// app/(tabs)/categories.tsx
//
// Categories tab route.
// Renders CategoryScreen which reads ?category= param.

import { CategoryScreen } from "../../src/features/marketplace/screens/CategoryScreen";

export default function CategoriesRoute() {
  return <CategoryScreen />;
}