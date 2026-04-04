import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Placeholder — full implementation is tracked in AMSPOS-22/23.
 */
export const MainTabNavigator: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Main App (Coming Soon)</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: '#333' },
});
