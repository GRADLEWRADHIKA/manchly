import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Phone, ArrowRight } from 'lucide-react-native';
import colors from '../../theme/colors';

const LoginScreen: React.FC = () => {
  const [phone, setPhone] = useState('');
  const Nav = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Manchly</Text>
          </View>
          <Text style={styles.tagline}>Create. Connect. Grow.</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.title}>Welcome to Manchly</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to get started
          </Text>

          <View style={styles.inputContainer}>
            <View style={styles.phoneInputWrapper}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              phone.length >= 10 && styles.continueButtonActive,
            ]}
            onPress={() => {
              Nav.navigate('OTPScreen');
              setPhone('');
            }}
            disabled={phone.length < 10}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.continueButtonText,
                phone.length >= 10 && styles.continueButtonTextActive,
              ]}
            >
              Send OTP
            </Text>
            <ArrowRight
              size={20}
              color={phone.length >= 10 ? '#ffffff' : colors.muted}
            />
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText}>Terms of Service</Text> and{' '}
            <Text style={styles.linkText}>Privacy Policy</Text>
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Phone size={20} color={colors.primary} />
            </View>
            <Text style={styles.featureText}>Secure phone verification</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  tagline: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  countryCode: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 24,
  },
  continueButtonActive: {
    backgroundColor: colors.primary,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
    marginRight: 8,
  },
  continueButtonTextActive: {
    color: '#ffffff',
  },
  termsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  featuresSection: {
    paddingBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default LoginScreen;
