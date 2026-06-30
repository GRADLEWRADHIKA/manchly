import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { checkAuthData, sendOtpEmail } from '../../store/UserSlice';
import CustomTextInput from '../../components/CustomInput';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);

    const payloadVerify = {
      email: data.email.toLowerCase().trim(),
      phone: '',
    };

    dispatch(checkAuthData(payloadVerify))
      .unwrap()
      .then(response => {
        if (response?.data?.data?.exists) {
          const payload = {
            phone_number: '',
            email: data.email.toLowerCase().trim(),
            purpose: 'login',
            tab: 'CREATOR', // fallback tab parameter
          };

          dispatch(sendOtpEmail(payload))
            .unwrap()
            .then(otpRes => {
              Toast.show({
                type: 'success',
                text1: 'Verification code sent',
                text2: `Use dummy code: ${otpRes?.data?.data?.otp}`,
                position: 'top',
              });
              reset();
              setLoading(false);
              navigation.navigate('OTPScreen', {
                payload,
                dummyOtp: otpRes?.data?.data?.otp,
              });
            })
            .catch(() => {
              setLoading(false);
            });
        } else {
          setLoading(false);
          Toast.show({
            type: 'error',
            text1: 'Account not found',
            text2: 'Please create an account first.',
            position: 'top',
          });
        }
      })
      .catch(() => {
        setLoading(false);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / App Name */}
          <View style={styles.logoSection}>
            <View style={styles.logoBadge}>
              <Shield size={wp(20)} color={colors.gold} />
            </View>
            <Text style={styles.logoText}>Manchly</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
<Text style={styles.title}>Welcome back</Text>
<Text style={styles.subtitle}>Enter your credentials to access your dashboard.</Text>

            {/* Email Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <Controller
                name="email"
                control={control}
                rules={{
                  required: 'Please enter your email',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                }}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <View
                    style={[
                      styles.fieldContainer,
                      error && styles.fieldContainerError,
                    ]}
                  >
                    <Mail
                      size={18}
                      color={colors.textMuted}
                      style={styles.fieldIconLeft}
                    />
                    <CustomTextInput
                      placeholder="Enter Email Address"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      inputContainerStyle={styles.textInputContainer}
                      inputStyle={styles.textInput}
                    />
                  </View>
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password Field */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Please enter your password',
                }}
                render={({
                  field: { onChange, onBlur, value },
                  fieldState: { error },
                }) => (
                  <View
                    style={[
                      styles.fieldContainer,
                      error && styles.fieldContainerError,
                    ]}
                  >
                    <Lock
                      size={18}
                      color={colors.textMuted}
                      style={styles.fieldIconLeft}
                    />
                    <CustomTextInput
                      placeholder="Enter Password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      inputContainerStyle={styles.textInputContainer}
                      inputStyle={styles.textInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.75}
                      style={styles.fieldIconRight}
                    >
                      {showPassword ? (
                        <EyeOff size={18} color={colors.textMuted} />
                      ) : (
                        <Eye size={18} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password.message}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() =>
                Toast.show({
                  type: 'info',
                  text1: 'Password reset coming soon',
                })
              }
              activeOpacity={0.75}
              style={styles.forgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Submit CTA */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                loading && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.75}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Logging in...' : 'Login →'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('SignupScreen')}
              >
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
    //marginBottom: hp(12),
  },
  logoText: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tagline: {
    fontSize: fp(12),
    color: colors.textSecondary,
    marginTop: hp(4),
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
    marginBottom: hp(16),
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
  fieldIconRight: {
    marginLeft: wp(10),
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: hp(24),
  },
  forgotPasswordText: {
    color: colors.gold,
    fontSize: fp(13),
    fontWeight: '500',
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
});
