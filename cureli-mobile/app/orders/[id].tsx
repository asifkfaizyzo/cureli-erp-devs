// app/orders/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { OrderDetailScreen } from '../../src/features/orders/screens/OrderDetailScreen';

export default function OrderDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderDetailScreen orderId={id} />;
}