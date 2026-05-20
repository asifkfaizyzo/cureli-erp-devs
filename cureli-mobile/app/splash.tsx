// app/splash.tsx

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  runOnJS,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StorageService } from '../src/services/storage';
import { useAuthStore } from '../src/store/authStore';

const { width, height } = Dimensions.get('window');
const LOGO_WIDTH = width * 0.52;
const TAGLINE = 'Medicine delivered to your door';

export default function SplashScreenPage() {
  const status = useAuthStore((s) => s.status);

  // ── Shared values ─────────────────────────────────────────
  const glowScale        = useSharedValue(0.4);
  const glowOpacity      = useSharedValue(0);
  const logoScale        = useSharedValue(0.3);
  const logoOpacity      = useSharedValue(0);
  const lineWidth        = useSharedValue(0);
  const lineOpacity      = useSharedValue(0);
  const taglineOpacity   = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const exitScale        = useSharedValue(1);

  // Accent dots get their own shared value — no .value reads in JSX
  const dotsProgress = useSharedValue(0);

  // ── Typewriter state ──────────────────────────────────────
  const [visibleChars, setVisibleChars] = useState(0);

  // ── Navigation ────────────────────────────────────────────
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
    const easeOut = Easing.out(Easing.cubic);
    const easeIn  = Easing.in(Easing.cubic);

    // Glow
    glowOpacity.value = withTiming(0.6, { duration: 600, easing: easeOut });
    glowScale.value   = withTiming(1,   { duration: 800, easing: easeOut });

    // Logo spring
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 400, easing: easeOut }));
    logoScale.value   = withDelay(100, withSpring(1, { damping: 12, stiffness: 180, mass: 0.8 }));

    // Accent dots progress (drives all three dots via useAnimatedStyle)
    dotsProgress.value = withDelay(100, withTiming(1, { duration: 700, easing: easeOut }));

    // Lines sweep
    lineOpacity.value = withDelay(400, withTiming(0.4, { duration: 300, easing: easeOut }));
    lineWidth.value   = withDelay(400, withTiming(1,   { duration: 500, easing: easeOut }));

    // Tagline fade
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 200 }));

    // Typewriter
    const typewriterStart = 850;
    const charDelay = 20;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i <= TAGLINE.length; i++) {
      timers.push(setTimeout(() => setVisibleChars(i), typewriterStart + i * charDelay));
    }

    // Exit
    exitScale.value        = withDelay(2100, withTiming(1.15, { duration: 400, easing: easeIn }));
    containerOpacity.value = withDelay(2100, withTiming(0,    { duration: 400, easing: easeIn }));

    // Navigate
    const navTimer = setTimeout(() => runOnJS(navigateNext)(), 2550);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(navTimer);
    };
  }, []);

  // ── Animated styles ───────────────────────────────────────

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  // Each dot gets its own opacity/scale derived from dotsProgress
  // No .value reads in JSX — all inside useAnimatedStyle
  const dot0Style = useAnimatedStyle(() => ({
    opacity: interpolate(dotsProgress.value, [0, 1], [0, 0.15]),
    transform: [{ scale: interpolate(dotsProgress.value, [0, 1], [0.5, 1]) }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    opacity: interpolate(dotsProgress.value, [0, 1], [0, 0.23]),
    transform: [{ scale: interpolate(dotsProgress.value, [0, 1], [0.5, 1]) }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: interpolate(dotsProgress.value, [0, 1], [0, 0.31]),
    transform: [{ scale: interpolate(dotsProgress.value, [0, 1], [0.5, 1]) }],
  }));

  const leftLineStyle = useAnimatedStyle(() => ({
    opacity: lineOpacity.value,
    width: interpolate(lineWidth.value, [0, 1], [0, width * 0.25]),
  }));

  const rightLineStyle = useAnimatedStyle(() => ({
    opacity: lineOpacity.value,
    width: interpolate(lineWidth.value, [0, 1], [0, width * 0.25]),
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ scale: exitScale.value }],
  }));

  // ── Render ────────────────────────────────────────────────

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background glow */}
      <Animated.View style={[styles.glow, glowStyle]} />

      {/* Accent dots — each has its own animated style, no .value in JSX */}
      <View style={styles.dotsTop}>
        <Animated.View style={[styles.accentDot, dot0Style]} />
        <Animated.View style={[styles.accentDot, dot1Style]} />
        <Animated.View style={[styles.accentDot, dot2Style]} />
      </View>

      {/* Logo */}
      <Animated.View style={[styles.logoWrapper, logoStyle]}>
        <Image
          source={require('../assets/images/cureliwhitewithtext.png')}
          style={styles.logoImage}
          contentFit="contain"
        />
      </Animated.View>

      {/* Decorative lines */}
      <View style={styles.linesRow}>
        <Animated.View style={[styles.line, styles.lineLeft, leftLineStyle]} />
        <View style={styles.lineDot} />
        <Animated.View style={[styles.line, styles.lineRight, rightLineStyle]} />
      </View>

      {/* Tagline typewriter */}
      <Animated.View style={[styles.taglineWrapper, taglineStyle]}>
        <Text style={styles.tagline}>
          {TAGLINE.slice(0, visibleChars)}
          {visibleChars < TAGLINE.length && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>
      </Animated.View>

      {/* Bottom branding */}
      <Animated.View style={[styles.bottomBrand, taglineStyle]}>
        <View style={styles.bottomLine} />
        <Text style={styles.bottomText}>by Cureli Health</Text>
        <View style={styles.bottomLine} />
      </Animated.View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05015A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: 'rgba(58, 47, 212, 0.15)',
  },
  dotsTop: {
    position: 'absolute',
    top: height * 0.12,
    flexDirection: 'row',
    gap: 12,
  },
  accentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: LOGO_WIDTH,
    height: LOGO_WIDTH * 0.4,
  },
  linesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  lineLeft: {
    marginRight: 12,
  },
  lineRight: {
    marginLeft: 12,
  },
  lineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  taglineWrapper: {
    alignItems: 'center',
    minHeight: 24,
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.8,
  },
  cursor: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '100',
  },
  bottomBrand: {
    position: 'absolute',
    bottom: height * 0.08,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomLine: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  bottomText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.25)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});