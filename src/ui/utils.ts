import { Alert } from 'react-native';
export const today = () => new Date().toISOString().slice(0, 10);
export const uid = () => `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
export function confirmDelete(title: string, action: () => void, message = 'This can’t be undone.') {
  Alert.alert(title, message, [{ text: 'Keep', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: action }]);
}
export function friendlyDate(value: string) { return new Date(value).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }); }
export function validDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime()) && new Date(value).toISOString().slice(0, 10) === value; }
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }
