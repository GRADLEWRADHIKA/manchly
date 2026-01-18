import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  StatusBar as RNStatusBar,
} from 'react-native';
import colors from '../../utils/colors';
import ChooseType from './components/ChooseType';
import VerifyLogin from './components/VerifyLogin';
import SignUp from './components/SignUp';

const { height } = Dimensions.get('window');

const NewLoginScreen = () => {
  const [selectedType, setSelectedType] = React.useState<
    'CREATOR' | 'USER' | null
  >(null);
  const [active, setActive] = useState(1);

  return (
    <View style={styles.container}>
      <RNStatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <View style={styles.topSpace}></View>

      <View style={styles.mainHeader}>
        {active === 1 ? (
          <ChooseType setSelectedType={setSelectedType} setActive={setActive} />
        ) : active === 2 ? (
          <VerifyLogin selectedType={selectedType} setActive={setActive} />
        ) : (
          <SignUp selectedType={selectedType} setActive={setActive} />
        )}
      </View>
    </View>
  );
};

export default NewLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  topSpace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '600',
  },

  mainHeader: {
    backgroundColor: 'grey',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
});
