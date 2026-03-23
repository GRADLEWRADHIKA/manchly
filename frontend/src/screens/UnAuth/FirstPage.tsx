import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoveRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const FirstPage = () => {
  const Nav = useNavigation<any>();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.firstHalf}>
        <Image
          source={require('../../image/boarding.jpg')}
          style={styles.imageMain}
        />
      </View>
      <View style={styles.secHalf}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.mainHeader}
          onPress={() => {
            Nav.navigate('NewLoginScreen');
          }}
        >
          <Text style={styles.mainTop}>Get Started</Text>
          <MoveRight color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.botPara}>A Manch for every Creator</Text>
      </View>
    </SafeAreaView>
  );
};

export default FirstPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  firstHalf: {
    height: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secHalf: {
    height: '20%',
  },
  mainHeader: {
    borderWidth: wp(1),
    borderColor: colors.white,
    paddingHorizontal: wp(20),
    paddingVertical: hp(15),
    marginHorizontal: wp(20),
    borderRadius: wp(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainTop: {
    fontSize: fp(16),
    color: colors.white,
    fontWeight: '500',
  },
  botPara: {
    fontSize: fp(20),
    color: colors.white,
    marginHorizontal: wp(20),
    marginTop: hp(20),
    textAlign: 'center',
    fontWeight: '500',
  },
  imageMain: { height: '95%', width: '95%' },
});
