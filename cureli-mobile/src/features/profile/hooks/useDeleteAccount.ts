// src/features/profile/hooks/useDeleteAccount.ts
//
// Manages the two-step account deletion flow.
// Step 1: send OTP → step 2: confirm with OTP → clear everything → login.

import { useState } from 'react';
import { router } from 'expo-router';
import { profileApi, extractErrorMessage } from '../api/profile.api';
import { StorageService } from '../../../services/storage';
import { useAuthStore } from '../../../store/authStore';

type DeletionStep = 'warning' | 'otp';

export function useDeleteAccount() {
  const [step, setStep] = useState<DeletionStep>('warning');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(600); // 10 min default

  const logout = useAuthStore((state) => state.logout);

  // ── Step 1: Request deletion OTP ─────────────────────────

  async function requestOtp() {
    setIsSendingOtp(true);
    setSendError(null);

    try {
      const result = await profileApi.sendDeleteAccountOtp();
      setExpiresIn(result.expiresIn);
      setStep('otp');
    } catch (error) {
      setSendError(extractErrorMessage(error));
    } finally {
      setIsSendingOtp(false);
    }
  }

  // ── Step 2: Confirm deletion with OTP ────────────────────

  async function confirmDeletion(otp: string) {
    setIsConfirming(true);
    setOtpError(null);

    try {
      await profileApi.confirmDeleteAccount(otp);

      // Account is gone on backend.
      // Clear everything locally and route to login.
      StorageService.clearAuth();
      StorageService.clearAll();

      // Reset Zustand state
      await logout();

      // Hard replace — no back navigation possible
      router.replace('/(auth)/login');
    } catch (error) {
      setOtpError(extractErrorMessage(error));
      setIsConfirming(false);
    }
  }

  function resetToWarning() {
    setStep('warning');
    setOtpError(null);
    setSendError(null);
  }

  return {
    step,
    isSendingOtp,
    isConfirming,
    otpError,
    sendError,
    expiresIn,
    requestOtp,
    confirmDeletion,
    resetToWarning,
    setOtpError,
  };
}