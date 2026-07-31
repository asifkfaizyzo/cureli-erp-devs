// app/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StorageService } from '../src/services/storage';
import { authApi } from '../src/features/auth/api/auth.api';
import { useAuthStore } from '../src/store/authStore';
import { DarkColors } from '../src/theme/colors';

export default function Index() {
  const { setRider, clearAuth } = useAuthStore();

  useEffect(() => {
    async function bootstrap() {
      const token = StorageService.getAccessToken();

      if (!token) {
        router.replace('/(auth)/phone');
        return;
      }

      try {
        const { data } = await authApi.getMe();
        setRider(data.data);

        const { status, has_personal_details } = data.data;

        if (status === 'SUSPENDED' || status === 'BLOCKED') {
          router.replace('/(auth)/status-suspended');
        } else if (status === 'REJECTED') {
          router.replace('/(auth)/status-rejected');
        } else if (status === 'PENDING_REVIEW') {
          if (!has_personal_details) {
            router.replace('/(auth)/status-pending');
          } else {
            router.replace('/(auth)/status-pending');
          }
        } else {
          router.replace('/(app)/home');
        }
      } catch {
        clearAuth();
        StorageService.clearAuth();
        router.replace('/(auth)/phone');
      }
    }

    bootstrap();
  }, []);

  return (
    <View style={{
      flex: 1,
      backgroundColor: DarkColors.background.page,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <ActivityIndicator color={DarkColors.brand.primary} size="large" />
    </View>
  );
}