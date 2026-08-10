import { Alert, Platform } from 'react-native';

// react-native-web doesn't implement Alert.alert (it silently no-ops), so a
// confirm-before-delete flow that relies on it just does nothing when run
// in a browser. Route through window.confirm/alert on web instead.

export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { confirmLabel?: string; destructive?: boolean }
) {
  const confirmLabel = options?.confirmLabel ?? 'Delete';
  const destructive = options?.destructive ?? true;

  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}

export function notify(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
