// app/(tabs)/categories.tsx
//
// Categories tab route.
// Renders CategoryScreen which reads ?category= param.

import { AllCategoriesScreen } from "../../src/features/marketplace/screens/AllCategoriesScreen";

export default function CategoriesRoute() {
  return <AllCategoriesScreen />;
}