// src/features/onboarding/screens/IntroScreen.tsx
//
// Three-slide intro carousel shown to first-time app openers.
// After viewing (or tapping Get Started), marks intro as seen
// and navigates to login. Never shown again.
//
// To show it again for testing: clear 'onboarding.intro_seen' from MMKV.

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
import { Image } from 'expo-image';
import { StorageService } from '../../../services/storage';
import { Colors } from '../../../theme/colors';
import { Typography } from '../../../theme/typography';
import { Spacing } from '../../../theme/spacing';

const { width } = Dimensions.get('window');

// ── Slide definitions ─────────────────────────────────────────

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
    accent: '#3b2fd4',
  },
  {
    id: '2',
    icon: 'track-changes',
    title: 'Track every order live',
    subtitle:
      'Real-time updates from the moment your order is placed to the moment it arrives at your door.',
    accent: '#0a0280',
  },
  {
    id: '3',
    icon: 'verified-user',
    title: 'Trusted & safe always',
    subtitle:
      'Every pharmacy is verified. Every medicine is genuine. Your health is our only priority.',
    accent: '#05015A',
  },
];

// ── Component ─────────────────────────────────────────────────

export function IntroScreen() {
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

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
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
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {/* Illustration area */}
            <View style={[styles.illustrationRing, { backgroundColor: item.accent + '18' }]}>
              <View style={[styles.illustrationInner, { backgroundColor: item.accent + '28' }]}>
                <MaterialIcons name={item.icon} size={72} color={item.accent} />
              </View>
            </View>

            {/* Text */}
            <View style={styles.textBlock}>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Bottom area: dots + button */}
      <View style={styles.bottom}>
        {/* Dot indicators */}
        <View style={styles.dots}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={styles.button}
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

        {/* Legal note */}
        <Text style={styles.legal}>
          By continuing you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.muted,
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
    color: Colors.text.primary,
    textAlign: 'center',
    lineHeight: 34,
  },
  slideSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
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
    backgroundColor: Colors.brand.dark,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.border.default,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: Colors.brand.dark,
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
    color: Colors.text.faint,
    textAlign: 'center',
    lineHeight: 17,
  },
});