import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@constants/theme';
import { useSessionStore } from '@stores/sessionStore';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style }) => {
  const { refreshActivity } = useSessionStore();

  return (
    <SafeAreaView
      style={[styles.container, style]}
      onStartShouldSetResponder={() => {
        refreshActivity();
        return false; // don't consume — let events pass through
      }}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
