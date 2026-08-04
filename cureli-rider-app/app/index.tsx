import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function Index() {
  const { isAuthenticated, rider } = useAuthStore();

  if (!isAuthenticated || !rider) {
    return <Redirect href="/(auth)/phone" />;
  }

  // Rider is authenticated — route based on status
  switch (rider.status) {
    case 'APPROVED':
      return <Redirect href="/(app)/(tabs)/home" />;

    case 'PENDING_REVIEW':
      if (!rider.has_personal_details) {
        return <Redirect href="/(onboarding)/personal-details" />;
      }
      return <Redirect href="/(onboarding)/status" />;

    case 'SUSPENDED':
      return <Redirect href="/(onboarding)/status" />;

    case 'BLOCKED':
      return <Redirect href="/(onboarding)/status" />;

    default:
      return <Redirect href="/(auth)/phone" />;
  }
}