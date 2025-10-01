import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Phone, ArrowRight } from 'lucide-react-native';
import colors from '../../theme/colors';

const USER_TYPES = ['Creator', 'User'] as const;

type UserType = typeof USER_TYPES[number];

const LoginScreen: React.FC = () => {
  const [phone, setPhone] = useState('');
  const Nav = useNavigation<any>();
  const [userType, setUserType] = useState<UserType>('Creator');

  // Animated indicator
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [buttonWidths, setButtonWidths] = useState<number[]>([0, 0]);

  useEffect(() => {
    const idx = USER_TYPES.indexOf(userType);
    const x = buttonWidths.slice(0, idx).reduce((a, b) => a + b, 0);

    Animated.spring(indicatorX, {
      toValue: x,
      useNativeDriver: true,
      stiffness: 180,
      damping: 20,
      mass: 0.8,
    }).start();
  }, [userType, buttonWidths, indicatorX]);

  const onButtonLayout = (index: number) => (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setButtonWidths((prev) => {
      const copy = [...prev];
      copy[index] = w;
      return copy;
    });
  };

  const titleByUserType = (type: UserType) =>
    type === 'Creator' ? 'Welcome Creator' : 'Welcome Back';

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar barStyle="dark-content" backgroundColor="transparent" translucent={false} />

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={[styles.logoContainer, userType === 'Creator' ? { backgroundColor: colors.primary } : { backgroundColor: colors.secPrimary }]}>
            <Text style={styles.logoText}>Manchly</Text>
          </View>
          <Text style={styles.tagline}>Create. Connect. Grow.</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.title}>{titleByUserType(userType)}</Text>
          <Text style={styles.subtitle}>Enter your phone number to get started</Text>

          <View style={styles.segmentWrapper}>
            <View style={styles.segmentBackground}>
              {USER_TYPES.map((type, idx) => {
                const active = userType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    activeOpacity={0.8}
                    onPress={() => setUserType(type)}
                    onLayout={onButtonLayout(idx)}
                    style={styles.segmentButton}
                  >
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{type}</Text>
                  </TouchableOpacity>
                );
              })}

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.indicator,
                  {
                    transform: [{ translateX: indicatorX }],
                    width: buttonWidths.reduce((acc, w, i) => acc + (i === 0 ? w : 0), 0) || (buttonWidths[0] || 0),
                  },
                ]}
              />
            </View>
          </View>

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
              Nav.navigate('OTPScreen', { userType });
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
            <ArrowRight size={20} color={phone.length >= 10 ? '#ffffff' : colors.muted} />
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
    paddingTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 18,
  },
  segmentWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  segmentBackground: {
    width: '90%',
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.primary,
  },
  indicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    opacity: 0.12,
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
    backgroundColor: '#fff',
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
    paddingVertical: 14,
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
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  featuresSection: {
    paddingBottom: 30,
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
