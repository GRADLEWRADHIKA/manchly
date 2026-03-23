import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import colors from '../../../../utils/colors';
import AppHeaderWithBack from '../../../../components/AppHeaderWithBack';

const UserCourseSearch = () => {
  return (
    <View style={styles.container}>
      <AppHeaderWithBack title="Search Courses" />
    </View>
  );
};

export default UserCourseSearch;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
