// app/profile/address/[id].tsx

import { useLocalSearchParams } from 'expo-router';
import { AddressFormScreen } from '../../../src/features/profile/screens/AddressFormScreen';

export default function EditAddressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AddressFormScreen addressId={id} />;
}