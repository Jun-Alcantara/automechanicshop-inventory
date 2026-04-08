import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Colors } from '@constants/theme';
import { useSessionStore } from '@stores/sessionStore';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Pass true for screens with headerShown: false that need top safe area inset */
  noHeader?: boolean;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({ children, style, noHeader }) => {
  const { refreshActivity } = useSessionStore();
  const edges: Edge[] = noHeader
    ? ['top', 'bottom', 'left', 'right']
    : ['bottom', 'left', 'right'];

  return (
    <SafeAreaView
      edges={edges}
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
