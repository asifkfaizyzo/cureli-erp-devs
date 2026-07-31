// app/(app)/_layout.tsx
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown:            false,
        tabBarStyle: {
          backgroundColor: colors.tab.background,
          borderTopColor:  colors.tab.border,
          borderTopWidth:  1,
        },
        tabBarActiveTintColor:   colors.tab.itemactive,
        tabBarInactiveTintColor: colors.tab.iteminactive,
        tabBarLabelStyle:        { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="home"     options={{ title: 'Home' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Earnings' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  );
}