import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import colors from '../../../utils/colors';
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
          <Text style={styles.subtitle}>Creator</Text>
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
          <Text style={styles.subtitle}>User</Text>
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
    paddingTop: 50,
    paddingBottom: 40,
  },

  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },

  card: {
    marginTop: 20,
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 5,
  },

  description: {
    fontSize: 16,
    color: colors.primary,
  },

  termsText: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 20,
    marginBottom: 8,
  },

  linkText: {
    color: colors.white,
    fontWeight: '600',
  },
});
