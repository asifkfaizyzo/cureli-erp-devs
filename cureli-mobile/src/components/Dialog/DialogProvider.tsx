// src/components/Dialog/DialogProvider.tsx
//
// Imperative dialog system. Use useDialog() anywhere in the app.
//
// Usage:
//   const { confirm, alert } = useDialog();
//
//   const confirmed = await confirm({
//     title: 'Delete address',
//     message: 'This cannot be undone.',
//     confirmLabel: 'Delete',
//     destructive: true,
//   });
//   if (confirmed) { ... }
//
//   await alert({
//     title: 'Success',
//     message: 'Address saved.',
//   });

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

// ── Types ─────────────────────────────────────────────────────

interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  // alert mode — no cancel button, just an OK
  alertOnly?: boolean;
}

interface DialogContextValue {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: Omit<DialogOptions, 'cancelLabel'>) => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────

const DialogContext = createContext<DialogContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────

interface DialogState extends DialogOptions {
  visible: boolean;
  resolve: ((value: boolean) => void) | null;
}

const INITIAL_STATE: DialogState = {
  visible: false,
  title: '',
  message: undefined,
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  destructive: false,
  icon: undefined,
  alertOnly: false,
  resolve: null,
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(INITIAL_STATE);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const showDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        ...INITIAL_STATE,
        ...options,
        visible: true,
        resolve,
      });

      // Animate in
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 18,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [scaleAnim, opacityAnim]);

  const dismiss = useCallback((value: boolean) => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const resolve = state.resolve;
      setState(INITIAL_STATE);
      resolve?.(value);
    });
  }, [scaleAnim, opacityAnim, state.resolve]);

  const confirm = useCallback(
    (options: DialogOptions) => showDialog(options),
    [showDialog],
  );

  const alert = useCallback(
    (options: Omit<DialogOptions, 'cancelLabel'>): Promise<void> =>
      showDialog({ ...options, alertOnly: true }).then(() => undefined),
    [showDialog],
  );

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <DialogModal
        state={state}
        scaleAnim={scaleAnim}
        opacityAnim={opacityAnim}
        onConfirm={() => dismiss(true)}
        onCancel={() => dismiss(false)}
      />
    </DialogContext.Provider>
  );
}

// ── Modal UI ──────────────────────────────────────────────────

interface DialogModalProps {
  state: DialogState;
  scaleAnim: Animated.Value;
  opacityAnim: Animated.Value;
  onConfirm: () => void;
  onCancel: () => void;
}

function DialogModal({
  state,
  scaleAnim,
  opacityAnim,
  onConfirm,
  onCancel,
}: DialogModalProps) {
  const { colors, isDark } = useTheme();

  const confirmColor = state.destructive
    ? colors.status.error
    : isDark
    ? colors.brand.accent
    : colors.brand.primary;

  const iconColor = state.destructive
    ? colors.status.error
    : isDark
    ? colors.brand.accent
    : colors.brand.primary;

  const iconBgColor = state.destructive
    ? colors.status.errorBg
    : colors.background.tint;

  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => !state.alertOnly && onCancel()}
    >
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: opacityAnim }]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => !state.alertOnly && onCancel()}
        />
      </Animated.View>

      {/* Dialog card */}
      <View style={styles.centerer} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Icon */}
          {state.icon && (
            <View style={[styles.iconWrapper, { backgroundColor: iconBgColor }]}>
              <MaterialIcons name={state.icon} size={28} color={iconColor} />
            </View>
          )}

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {state.title}
          </Text>

          {/* Message */}
          {state.message ? (
            <Text style={[styles.message, { color: colors.text.muted }]}>
              {state.message}
            </Text>
          ) : null}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

          {/* Buttons */}
          <View style={[
            styles.buttonRow,
            state.alertOnly && styles.buttonRowSingle,
          ]}>
            {!state.alertOnly && (
              <>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { borderColor: colors.border.default },
                  ]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      styles.cancelText,
                      { color: colors.text.muted },
                    ]}
                  >
                    {state.cancelLabel ?? 'Cancel'}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.buttonDivider, { backgroundColor: colors.border.subtle }]} />
              </>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                state.alertOnly && styles.buttonFull,
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.confirmText,
                  { color: confirmColor },
                ]}
              >
                {state.confirmLabel ?? 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centerer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 24,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    lineHeight: 24,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    lineHeight: 21,
  },
  divider: {
    height: 1,
    marginHorizontal: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    height: 52,
  },
  buttonRowSingle: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  buttonDivider: {
    width: 1,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  cancelText: {
    fontFamily: 'Inter_500Medium',
  },
  confirmText: {
    fontFamily: 'Inter_700Bold',
  },
});