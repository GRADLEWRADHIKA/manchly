import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import colors from '../../../../../utils/colors';

const ButtonSection = ({ setActive, active }) => {
  return (
    <View style={styles.buttonHeader}>
      <TouchableOpacity
        onPress={() => setActive('courses')}
        style={[styles.tabBtn, active === 'courses' && styles.activeTabBtn]}
      >
        <Text
          style={[styles.tabText, active === 'courses' && styles.activeTabText]}
        >
          Courses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setActive('webinar')}
        style={[styles.tabBtn, active === 'webinar' && styles.activeTabBtn]}
      >
        <Text
          style={[styles.tabText, active === 'webinar' && styles.activeTabText]}
        >
          Webinar
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ButtonSection;

const styles = StyleSheet.create({
  buttonHeader: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginVertical: 10,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.lightGrey,
  },
  activeTabBtn: {
    backgroundColor: colors.secPrimary,
  },
  tabText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.white,
  },
});
