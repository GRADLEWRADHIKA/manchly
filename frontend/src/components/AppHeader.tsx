import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';
import { useSelector } from 'react-redux';

const AppHeader = ({ title = 'Manchly' }) => {
  const insets = useSafeAreaInsets();
  const { user } = useSelector((state: any) => state.userReducer);
  const isUser = user?.user_type === 'USER';
  const bgColor = isUser ? colors.secPrimary : colors.primary;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + hp(4),
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.bottomEdge, { backgroundColor: bgColor }]} />
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingBottom: hp(10),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  title: {
    color: colors.white,
    fontSize: fp(20),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomEdge: {
    position: 'absolute',
    bottom: -hp(8),
    left: 0,
    right: 0,
    height: hp(16),
    borderBottomLeftRadius: wp(18),
    borderBottomRightRadius: wp(18),
  },
});