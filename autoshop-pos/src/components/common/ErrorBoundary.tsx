import React, { Component, ErrorInfo } from 'react';
import { View, Text, StyleSheet, DevSettings } from 'react-native';
import { AppButton } from './AppButton';

// Lazily require expo-updates so a missing native module (e.g. Expo Go)
// doesn't crash the app at startup. Falls back to DevSettings in dev.
const reloadApp = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('expo-updates').reloadAsync();
  } catch {
    DevSettings.reload();
  }
};

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error?.message}</Text>
          <AppButton label="Restart" onPress={reloadApp} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  message: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
});
