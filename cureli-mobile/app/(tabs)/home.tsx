// app/(tabs)/home.tsx
//
// Home tab — route file only. All UI lives in the marketplace feature screen.
//
// Pattern mirrors the profile tab:
//   app/(tabs)/profile.tsx → renders <ProfileScreen />
//   app/(tabs)/home.tsx    → renders <HomeScreen />
//
// Import path from app/(tabs)/home.tsx to src/:
//   ../../  = project root
//   src/features/marketplace/screens/HomeScreen

import { HomeScreen } from "../../src/features/marketplace/screens/HomeScreen";

export default function Home() {
  return <HomeScreen />;
}