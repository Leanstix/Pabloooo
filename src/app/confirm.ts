import { Alert } from 'react-native';

export function confirmRestore(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Replace the records on this phone?',
      'Restoring replaces your current transactions, categories, budgets and goals. Export a backup first if you want to keep them. Reminders will be turned off until you enable them again.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Replace records', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
