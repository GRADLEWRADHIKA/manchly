import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../utils/colors';
import { useSelector } from 'react-redux';

const AppHeader = ({ title = 'Manchly' }) => {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: any) => state.userReducer);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 10,
          backgroundColor:
            user?.user_type === 'USER'
              ? colors.secPrimary
              : colors.primary,
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};
export default AppHeader;
const styles = StyleSheet.create({
  container: {
    // backgroundColor: colors.primary,
    alignItems: 'center',
    paddingBottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
});
