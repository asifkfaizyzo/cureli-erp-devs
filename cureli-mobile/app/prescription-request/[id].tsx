// app/prescription-request/[id].tsx

import { useLocalSearchParams } from 'expo-router';
import { PrescriptionRequestDetailScreen } from
  '../../src/features/prescription-request/screens/PrescriptionRequestDetailScreen';

export default function PrescriptionRequestDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PrescriptionRequestDetailScreen requestId={id} />;
}