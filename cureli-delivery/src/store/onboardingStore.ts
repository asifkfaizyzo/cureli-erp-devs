// src/store/onboardingStore.ts
import { create } from 'zustand';

interface OnboardingState {
  phone:      string;
  otpSent:    boolean;
  setPhone:   (phone: string) => void;
  setOtpSent: (sent: boolean) => void;
  reset:      () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  phone:      '',
  otpSent:    false,
  setPhone:   (phone)   => set({ phone }),
  setOtpSent: (otpSent) => set({ otpSent }),
  reset:      ()        => set({ phone: '', otpSent: false }),
}));