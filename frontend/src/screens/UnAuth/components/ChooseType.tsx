import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { MoveRight } from 'lucide-react-native';

const ChooseType = ({ setSelectedType, setActive }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => {
          setSelectedType('CREATOR');
          setActive(2);
        }}
      >
        <View>
          <Text style={styles.subtitle}>creator</Text>
          <Text style={styles.description}>Create & publish content</Text>
        </View>
        <MoveRight />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => {
          setSelectedType('USER');
          setActive(2);
        }}
      >
        <View>
          <Text style={styles.subtitle}>user</Text>
          <Text style={styles.description}>Browse & consume content</Text>
        </View>
        <MoveRight />
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By continuing, you agree to our{' '}
        <Text style={styles.linkText}>Terms of Service</Text> and{' '}
        <Text style={styles.linkText}>Privacy Policy</Text>
      </Text>
    </View>
  );
};

export default ChooseType;

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(50),
    paddingBottom: hp(40),
  },

  title: {
    fontSize: fp(36),
    fontWeight: '900',
    color: colors.white,
    textAlign: 'center',
    marginBottom: hp(20),
  },

  card: {
    marginTop: hp(20),
    backgroundColor: colors.white,
    padding: wp(20),
    borderRadius: wp(25),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subtitle: {
    fontSize: fp(25),
    fontWeight: '700',
  },

  description: {
    fontSize: fp(14),
    color: colors.primary,
  },

  termsText: {
    fontSize: fp(14),
    color: colors.white,
    textAlign: 'center',
    lineHeight: fp(18),
    marginTop: hp(20),
    marginBottom: hp(8),
  },

  linkText: {
    color: colors.white,
    fontWeight: '600',
  },
});
