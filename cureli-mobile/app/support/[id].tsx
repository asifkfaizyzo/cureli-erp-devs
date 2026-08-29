import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { TicketDetailScreen } from '../../src/features/support/screens/TicketDetailScreen';

export default function TicketDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TicketDetailScreen ticketId={id} />;
}