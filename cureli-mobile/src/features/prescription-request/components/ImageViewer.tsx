// src/features/prescription-request/components/ImageViewer.tsx
//
// Fullscreen pinch-zoom image viewer rendered inside a Modal.
// Built entirely from react-native-gesture-handler + reanimated —
// no extra native dependencies required.
//
// Supports:
//   - Pinch to zoom (1x – 5x)
//   - Pan while zoomed
//   - Swipe down to dismiss at 1x
//   - Double-tap to toggle 2.5x zoom
//   - Close button

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { Image }               from 'expo-image';
import { useSafeAreaInsets }   from 'react-native-safe-area-context';
import { Ionicons }            from '@expo/vector-icons';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
}                              from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  clamp,
}                              from 'react-native-reanimated';

import { Spacing } from '../../../theme/spacing';

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_SCALE        = 1;
const MAX_SCALE        = 5;
const DISMISS_THRESHOLD = 120;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImageViewerProps {
  visible:  boolean;
  uri:      string;
  name:     string;
  onClose:  () => void;
}

// ── Inner viewer (rendered inside Modal) ─────────────────────────────────────

function ImageViewerContent({ uri, name, onClose }: Omit<ImageViewerProps, 'visible'>) {
  const insets = useSafeAreaInsets();

  // Shared animation values
  const scale      = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX     = useSharedValue(0);
  const savedY     = useSharedValue(0);
  const bgOpacity  = useSharedValue(1);

  const dismiss = useCallback(() => onClose(), [onClose]);

  // ── Pinch ──────────────────────────────────────────────────────────────
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < MIN_SCALE) {
        scale.value      = withSpring(MIN_SCALE);
        savedScale.value = MIN_SCALE;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedX.value     = 0;
        savedY.value     = 0;
      }
    });

  // ── Pan ────────────────────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + e.translationX;
        translateY.value = savedY.value + e.translationY;
      } else {
        // Swipe-down-to-dismiss at 1x
        translateY.value = Math.max(0, e.translationY);
        bgOpacity.value  = clamp(
          1 - e.translationY / (DISMISS_THRESHOLD * 2),
          0.3,
          1,
        );
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        savedX.value = translateX.value;
        savedY.value = translateY.value;
      } else if (e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(600, { duration: 200 });
        bgOpacity.value  = withTiming(0,   { duration: 200 }, () => {
          runOnJS(dismiss)();
        });
      } else {
        translateY.value = withSpring(0);
        bgOpacity.value  = withTiming(1);
      }
    });

  // ── Double-tap ─────────────────────────────────────────────────────────
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value      = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedX.value     = 0;
        savedY.value     = 0;
      } else {
        scale.value      = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  // Pinch and pan run simultaneously; double-tap races pan
  const composed = Gesture.Simultaneous(
    pinchGesture,
    Gesture.Race(doubleTap, panGesture),
  );

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale:      scale.value      },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.sm },
        ]}
      >
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.7}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.fileName} numberOfLines={1}>
          {name}
        </Text>
      </View>

      {/* Zoomable image */}
      <GestureDetector gesture={composed}>
        <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
        </Animated.View>
      </GestureDetector>

      {/* Hint bar */}
      <View
        style={[
          styles.hint,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Text style={styles.hintText}>
          Pinch to zoom · Swipe down to close
        </Text>
      </View>
    </GestureHandlerRootView>
  );
}

// ── Exported wrapper — owns the Modal ─────────────────────────────────────────

export function ImageViewer({ visible, uri, name, onClose }: ImageViewerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <ImageViewerContent uri={uri} name={name} onClose={onClose} />
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#000' },

  header: {
    position:          'absolute',
    top:               0,
    left:              0,
    right:             0,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: Spacing.base,
    paddingBottom:     Spacing.sm,
    gap:               Spacing.sm,
    zIndex:            10,
    backgroundColor:   'rgba(0,0,0,0.4)',
  },
  closeBtn: {
    width:           40,
    height:          40,
    alignItems:      'center',
    justifyContent:  'center',
    borderRadius:    20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  fileName: {
    flex:       1,
    color:      '#fff',
    fontSize:   14,
    fontFamily: 'Inter_500Medium',
  },

  hint: {
    position:        'absolute',
    bottom:          0,
    left:            0,
    right:           0,
    alignItems:      'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingTop:      Spacing.sm,
  },
  hintText: {
    color:      'rgba(255,255,255,0.6)',
    fontSize:   11,
    fontFamily: 'Inter_400Regular',
  },
});