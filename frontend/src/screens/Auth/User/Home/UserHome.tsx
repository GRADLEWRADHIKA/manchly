import React, { memo } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { hp } from '../../../../utils/responsive';
import HomeHeader from './components/HomeHeader';
import HeroCarousel from './components/HeroCarousel';
import LatestCourses from './components/LatestCourses';
import LatestWebinars from './components/LatestWebinars';

const UserHome = () => {
  
  return (
    <View style={styles.root}>
      <HomeHeader />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeroCarousel />
        <LatestCourses />
        <LatestWebinars />
      </ScrollView>
    </View>
  );
};

export default memo(UserHome);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(100),
  },
});
