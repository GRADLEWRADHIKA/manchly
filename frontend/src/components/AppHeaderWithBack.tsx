import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import colors from '../utils/colors';
import { wp, hp, fp } from '../utils/responsive';

const AppHeaderWithBack = ({ title, bgColor = colors.bg }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const transparent = bgColor === 'transparent';

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + hp(12),
          backgroundColor: bgColor,
        },
        transparent && styles.flat,
      ]}
    >
      <View style={styles.mainHeader}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft color={colors.white} size={wp(24)} strokeWidth={2.2} />
        </Pressable>

        <Text style={styles.title} numberOfLines={1}>
          {title ? title.charAt(0).toUpperCase() + title.slice(1) : ''}
        </Text>
      </View>

      {!transparent && (
        <View style={[styles.bottomEdge, { backgroundColor: bgColor }]} />
      )}
    </View>
  );
};

export default AppHeaderWithBack;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: hp(18),
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 10,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
  },
  mainHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(50),
  },
  backButton: {
    position: 'absolute',
    left: wp(14),
    width: wp(36),
    height: wp(36),
    borderRadius: wp(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    transform: [{ scale: 0.92 }],
  },
  title: {
    color: colors.white,
    fontSize: fp(18),
    fontWeight: '700',
    letterSpacing: 0.2,
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
