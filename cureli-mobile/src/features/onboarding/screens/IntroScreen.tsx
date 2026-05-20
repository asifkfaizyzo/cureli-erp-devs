// src/features/onboarding/screens/IntroScreen.tsx

import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StorageService } from '../../../services/storage';
import { useTheme } from '../../../theme/ThemeContext';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'local-pharmacy',
    title: 'Medicine at your door',
    subtitle:
      'Order from trusted pharmacies near you and get medicines delivered fast — no queues, no waiting.',
    accent: '#6b44dc',
  },
  {
    id: '2',
    icon: 'track-changes',
    title: 'Track every order live',
    subtitle:
      'Real-time updates from the moment your order is placed to the moment it arrives at your door.',
    accent: '#3b2fd4',
  },
  {
    id: '3',
    icon: 'verified-user',
    title: 'Trusted & safe always',
    subtitle:
      'Every pharmacy is verified. Every medicine is genuine. Your health is our only priority.',
    accent: '#090025',
  },
];

export function IntroScreen() {
  const { colors, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  function handleGetStarted() {
    StorageService.setIntroSeen();
    router.replace('/(auth)/login');
  }

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      handleGetStarted();
    }
  }

  function handleSkip() {
    handleGetStarted();
  }

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top', 'bottom']}
    >
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.text.muted }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => {
          const accentColor = isDark ? colors.brand.accent : item.accent;
          return (
            <View style={styles.slide}>
              <View
                style={[
                  styles.illustrationRing,
                  { backgroundColor: accentColor + '18' },
                ]}
              >
                <View
                  style={[
                    styles.illustrationInner,
                    { backgroundColor: accentColor + '28' },
                  ]}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={72}
                    color={accentColor}
                  />
                </View>
              </View>

              <View style={styles.textBlock}>
                <Text
                  style={[styles.slideTitle, { color: colors.text.primary }]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.slideSubtitle,
                    { color: colors.text.muted },
                  ]}
                >
                  {item.subtitle}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex
                  ? [styles.dotActive, { backgroundColor: colors.brand.primary }]
                  : [styles.dotInactive, { backgroundColor: colors.border.default }],
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isDark
                ? colors.brand.accent
                : colors.brand.primary,
            },
          ]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <MaterialIcons
            name={isLast ? 'arrow-forward' : 'chevron-right'}
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>

        <Text style={[styles.legal, { color: colors.text.faint }]}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 40,
  },
  illustrationRing: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
  },
  slideTitle: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 20,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  legal: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 17,
  },
});