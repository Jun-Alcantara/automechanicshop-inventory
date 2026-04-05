import React from 'react';
import { SafeAreaView, StyleSheet, ViewStyle } from 'react-native';
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
