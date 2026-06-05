// app/checkout/index.tsx
import { Redirect } from 'expo-router';

export default function CheckoutRoute() {
  return <Redirect href="/cart" />;
}