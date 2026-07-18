import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
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
      {active === 1 ? (
        <ChooseType setSelectedType={setSelectedType} setActive={setActive} />
      ) : active === 2 ? (
        <VerifyLogin selectedType={selectedType} setActive={setActive} />
      ) : (
        <SignUp selectedType={selectedType} setActive={setActive} />
      )}
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
    fontSize: fp(26),
    fontWeight: '600',
  },

  mainHeader: {
    backgroundColor: 'grey',
    borderTopLeftRadius: wp(50),
    borderTopRightRadius: wp(50),
    paddingTop: hp(20),
    paddingHorizontal: wp(20),
  },
});
