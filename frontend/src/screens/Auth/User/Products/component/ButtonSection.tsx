import { Pressable, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { LinearGradient } from 'react-native-linear-gradient';
import {BookOpen, Video, Users} from 'lucide-react-native'
import colors from '../../../../../utils/colors';
import { wp, hp, fp } from '../../../../../utils/responsive';


const TAB_OPTIONS = [
  {key: 'courses', label: 'Courses', icon: BookOpen},
  {key: 'webinar', label: 'Webinar', icon: Video},
  {key: 'session', label: '1:1 Sessions', icon: Users}
];

const ButtonSection = ({ setActive, active }) => {
  return (
    <View style={styles.buttonHeader}>
      {TAB_OPTIONS.map(tab => {
        const isActive = active === tab.key;
        const Icon = tab.icon;
        return (
          <Pressable
            key={tab.key}
            onPress={() => setActive(tab.key)}
            style={({ pressed }) => [
              styles.pressableWrapper,
              pressed && !isActive && styles.tabBtnPressed,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <LinearGradient
              colors={
                isActive
                  ? [colors.greenButton, colors.greenButtonDark]
                  : [colors.user.cardSoft, colors.user.cardSoft]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.gradientContainer,
                isActive && styles.activeGradientContainer,
              ]}
            >
              <Icon
              size={wp(14)}
              color={isActive ? colors.white : colors.user.subHeading}
              strokeWidth={2}
              />
              <Text
                style={[styles.tabText, isActive && styles.activeTabText]}
              >
                {tab.label}
              </Text>
            </LinearGradient>
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
  pressableWrapper: {
    flex: 1,
    borderRadius: wp(12),
    // Overflow hidden ensures the ripple/opacity effects stay inside the pill shape
    overflow: 'hidden', 
  },
  gradientContainer: {
    paddingVertical: hp(9),
    paddingHorizontal: wp(8),
    borderRadius: wp(12),
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: wp(5)
  },
  activeGradientContainer: {
    // Optional: If you still want the secPrimary border when active
    // borderColor: colors.secPrimary, 
    borderWidth: 0, // Usually gradients look cleaner without borders
  },
  tabBtnPressed: {
    opacity: 0.7, // Replaced background color change with an opacity shift for a cleaner press effect
  },
  tabText: {
    color: colors.user.subHeading,
    fontSize: fp(11.5),
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
    fontWeight: '600',
  },
});