import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../theme/colors';
const AppHeader = ({ title = 'RIGI' }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};
export default AppHeader;
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    paddingBottom: 14,
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
});
