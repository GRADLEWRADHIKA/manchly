import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserCheck } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp, fp } from '../../../../utils/responsive';

const KycCard = () => {
  const navigation = useNavigation<any>();

  const handleVerifyKYC = () => {
    navigation.navigate('KYCVerificationScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <UserCheck size={wp(40)} color="#4caf50" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Verify Your KYC</Text>
          <Text style={styles.description}>
            Complete your KYC to unlock all features and secure your account.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleVerifyKYC}
        >
          <Text style={styles.buttonText}>Verify Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // margin: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp(12),
    padding: wp(20),
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: hp(16),
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: hp(20),
  },
  title: {
    fontSize: fp(18),
    fontWeight: 'bold',
    marginBottom: hp(8),
  },
  description: {
    fontSize: fp(14),
    color: '#555',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4caf50',
    paddingVertical: hp(10),
    paddingHorizontal: wp(30),
    borderRadius: wp(8),
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fp(16),
  },
});

export default KycCard;
