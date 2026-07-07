import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Phone, Shield} from 'lucide-react-native';
import {Controller, useForm} from 'react-hook-form';
import {useDispatch} from 'react-redux';
import {ThunkDispatch} from '@reduxjs/toolkit';
import {sendOtpSms} from '../../store/UserSlice';
import CustomTextInput from '../../components/CustomInput';
import colors from '../../utils/colors';
import {wp, hp, fp} from '../../utils/responsive';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'CREATOR' | 'USER'>('USER');

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm({
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = (data: any) => {
    const phone = data.phone.trim();
    if (phone.length < 10) return;

    setLoading(true);

    const payload = {
      phone_number: phone,
      purpose: 'login',
      tab: role,
    };

    dispatch(sendOtpSms(payload))
      .unwrap()
      .then((res: any) => {
        navigation.navigate('OTPScreen', {
          payload: {
            phone_number: phone,
            purpose: 'login',
            tab: role,
          },
          dummyOtp: res?.data?.data?.otp,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Shield size={wp(20)} color={colors.gold} />
            </View>
            <Text style={styles.logoText}>Manchly</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Enter your phone number to receive a verification code.
            </Text>

            {/* Role Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleSegment,
                  role === 'CREATOR' && styles.toggleSegmentActive,
                ]}
                onPress={() => setRole('CREATOR')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.toggleText,
                    role === 'CREATOR' && styles.toggleTextActive,
                  ]}>
                  Creator
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleSegment,
                  role === 'USER' && styles.toggleSegmentActive,
                ]}
                onPress={() => setRole('USER')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.toggleText,
                    role === 'USER' && styles.toggleTextActive,
                  ]}>
                  Learner
                </Text>
              </TouchableOpacity>
            </View>

            {/* Phone Number Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <Controller
                name="phone"
                control={control}
                rules={{
                  required: 'Please enter your phone number',
                  pattern: {
                    value: /^[6-9]\d{9}$/,
                    message: 'Please enter a valid 10-digit phone number',
                  },
                }}
                render={({
                  field: {onChange, onBlur, value},
                  fieldState: {error},
                }) => (
                  <View
                    style={[
                      styles.fieldContainer,
                      error && styles.fieldContainerError,
                    ]}>
                    <Phone
                      size={18}
                      color={colors.textMuted}
                      style={styles.fieldIconLeft}
                    />
                    <CustomTextInput
                      placeholder="Enter 10-digit phone number"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      maxLength={10}
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      inputContainerStyle={styles.textInputContainer}
                      inputStyle={styles.textInput}
                    />
                  </View>
                )}
              />
              {errors.phone && (
                <Text style={styles.errorText}>{errors.phone.message}</Text>
              )}
            </View>

            {/* Submit CTA */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.75}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.primaryButtonText}>Send OTP →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('SignupScreen')}>
                Sign up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: wp(24),
    paddingBottom: hp(24),
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    justifyContent: 'center',
    marginTop: hp(30),
    marginBottom: hp(20),
  },
  logoBadge: {
    width: wp(30),
    height: wp(30),
    borderRadius: 8,
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: hp(20),
  },
  title: {
    fontSize: fp(30),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
  },
  subtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginBottom: hp(24),
  },
  inputWrapper: {
    marginBottom: hp(24),
  },
  inputLabel: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: hp(8),
    letterSpacing: 1.2,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(54),
    backgroundColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: wp(14),
  },
  fieldContainerError: {
    borderColor: '#EF4444',
  },
  fieldIconLeft: {
    marginRight: wp(10),
  },
  textInputContainer: {
    flex: 1,
    height: '100%',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: fp(14),
    height: '100%',
  },
  errorText: {
    color: '#EF4444',
    fontSize: fp(12),
    marginTop: hp(4),
  },
  primaryButton: {
    height: hp(54),
    backgroundColor: colors.gold,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: fp(16),
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: hp(20),
  },
  footerText: {
    fontSize: fp(14),
    color: colors.textSecondary,
  },
  footerLink: {
    color: colors.gold,
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    height: hp(46),
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
    marginBottom: hp(20),
  },
  toggleSegment: {
    flex: 1,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  toggleSegmentActive: {
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: 'transparent',
  },
  toggleText: {
    fontSize: fp(13),
    fontWeight: '500',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.gold,
    fontWeight: '700',
  },
});
