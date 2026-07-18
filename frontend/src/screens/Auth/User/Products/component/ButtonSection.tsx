import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';

const TAB_OPTIONS = [
  { key: 'courses', label: 'Courses' },
  { key: 'webinar', label: 'Webinars' },
];

const ButtonSection = ({ setActive, active }) => {
  return (
    <View style={styles.buttonHeader}>
      {TAB_OPTIONS.map(tab => {
        const isActive = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => setActive(tab.key)}
            style={({ pressed }) => [
              styles.tabBtn,
              isActive && styles.activeTabBtn,
              pressed && !isActive && styles.tabBtnPressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={[styles.tabText, isActive && styles.activeTabText]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default ButtonSection;

const styles = StyleSheet.create({
  buttonHeader: {
    flexDirection: 'row',
    marginHorizontal: wp(16),
    gap: wp(10),
    marginTop: hp(12),
    marginBottom: hp(6),
  },
  tabBtn: {
    paddingVertical: hp(9),
    paddingHorizontal: wp(20),
    borderRadius: wp(24),
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTabBtn: {
    backgroundColor: colors.bg,
    borderColor: colors.secPrimary,
  },
  tabBtnPressed: {
    backgroundColor: '#e2e8f0',
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: fp(13.5),
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
    fontWeight: '600',
  },
});
