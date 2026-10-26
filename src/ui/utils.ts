import { Alert } from 'react-native';
import { randomUUID } from 'expo-crypto';
export const localDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const today = () => localDate(new Date());
export const uid = () => randomUUID();
export function confirmDelete(
  title: string,
  action: () => void,
  message = 'This can’t be undone.',
) {
  Alert.alert(title, message, [
    { text: 'Keep', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: action },
  ]);
}
export function friendlyDate(value: string) {
  return new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('en-NG', {
    month: 'short',
    day: 'numeric',
  });
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(value).getTime()) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
