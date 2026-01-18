import {
  StyleSheet,
  Text,
  View,
  StatusBar as RNStatusBar,
  Image,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import colors from '../../utils/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoveRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const FirstPage = () => {
  const Nav = useNavigation<any>();
  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={false}
      />
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
    borderWidth: 1,
    borderColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mainTop: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  botPara: {
    fontSize: 20,
    color: colors.white,
    marginHorizontal: 20,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  imageMain: { height: '95%', width: '95%' },
});
