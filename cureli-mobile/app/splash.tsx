// app/splash.tsx
//
// Animated splash screen shown after the JS bundle loads.
// Sequence:
//   1. Logo icon fades + scales in        (500ms)
//   2. Wordmark fades in below            (400ms, starts at 300ms)
//   3. Hold                               (700ms)
//   4. Everything fades out together      (400ms)
//   5. Routes to next screen
//
// Uses react-native-reanimated (already installed).
// Total visible duration: ~1.8 seconds.

import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StorageService } from '../src/services/storage';
import { useAuthStore } from '../src/store/authStore';

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.22;
const WORDMARK_WIDTH = width * 0.48;

export default function SplashScreenPage() {
  const { status } = useAuthStore();

  // ── Animated values ───────────────────────────────────────
  const logoOpacity   = useSharedValue(0);
  const logoScale     = useSharedValue(0.6);
  const wordmarkOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  // ── Navigate after animation ──────────────────────────────
  function navigateNext() {
    const introSeen = StorageService.isIntroSeen();

    if (!introSeen) {
      router.replace('/intro');
      return;
    }

    if (status === 'authenticated') {
      router.replace('/(tabs)/home');
    } else {
      router.replace('/(auth)/login');
    }
  }

  // ── Animation sequence ────────────────────────────────────
  useEffect(() => {
    const easingIn  = Easing.out(Easing.cubic);
    const easingOut = Easing.in(Easing.cubic);

    // Step 1 — logo icon fades + scales in
    logoOpacity.value = withTiming(1, { duration: 500, easing: easingIn });
    logoScale.value   = withTiming(1, { duration: 500, easing: easingIn });

    // Step 2 — wordmark fades in after 300ms delay
    wordmarkOpacity.value = withDelay(
      300,
      withTiming(1, { duration: 400, easing: easingIn }),
    );

    // Step 3 — hold 700ms then fade everything out
    containerOpacity.value = withSequence(
      withDelay(1400, withTiming(0, { duration: 400, easing: easingOut })),
    );

    // Step 4 — navigate after full sequence completes (~1800ms)
    const timer = setTimeout(() => {
      runOnJS(navigateNext)();
    }, 1850);

    return () => clearTimeout(timer);
  }, []);

  // ── Animated styles ───────────────────────────────────────
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Logo icon */}
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={require('../assets/images/cureliwhitenew.png')}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          contentFit="contain"
        />
      </Animated.View>

      {/* Wordmark — "Cureli" text logo */}
      <Animated.View style={[styles.wordmarkWrapper, wordmarkStyle]}>
        <Image
          source={require('../assets/images/cureliwhitewithtext.png')}
          style={{ width: WORDMARK_WIDTH, height: WORDMARK_WIDTH * 0.35 }}
          contentFit="contain"
        />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, wordmarkStyle]}>
        Medicine delivered to your door
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05015A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkWrapper: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 0.3,
    marginTop: 4,
  },
});