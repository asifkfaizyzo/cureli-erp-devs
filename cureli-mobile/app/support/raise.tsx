import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RaiseTicketScreen } from '../../src/features/support/screens/RaiseTicketScreen';

export default function RaiseTicketRoute() {
  const { orderId, orderNumber } = useLocalSearchParams<{ orderId: string; orderNumber?: string }>();
  return <RaiseTicketScreen orderId={orderId} orderNumber={orderNumber} />;
}