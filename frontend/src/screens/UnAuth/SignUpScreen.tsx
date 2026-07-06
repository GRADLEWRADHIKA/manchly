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
import {
  Shield,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { signUp } from '../../store/UserSlice';
import CustomTextInput from '../../components/CustomInput';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'CREATOR' | 'USER'>('CREATOR');
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);
    const payload = {
      name: data.name,
      email: data.email.toLowerCase().trim(),
      password: data.password,
      phone: data.phone,
      dob: '2000-01-01', // default DOB required by backend
      user_type: role,
    };

    console.log(payload)

    dispatch(signUp(payload))
      .unwrap()
      .then(() => {
        reset();
        Toast.show({
          type: 'success',
          text1: 'Account created successfully',
          position: 'bottom',
        });
        setLoading(false);
        
        navigation.navigate('LoginScreen');
      })
      .catch(err => {
        setLoading(false);
        console.log(err);
        Toast.show({
          type: 'error',
          text1: err?.message || 'Registration failed',
          position: 'bottom',
        });
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
              <Shield size={wp(22)} color={colors.gold} />
            </View>
            <Text style={styles.logoText}>Manchly</Text>
          </View>

          {/* Welcome Heading */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.welcomeSubtitle}>
              Enter your credentials to access your dashboard.
            </Text>
          </View>

          {/* Role Toggle segment */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleSegment,
                role === 'CREATOR' && styles.toggleSegmentActive,
              ]}
              onPress={() => setRole('CREATOR')}
              activeOpacity={0.8}
            >
              <User
                size={fp(14)}
                color={role === 'CREATOR' ? colors.gold : colors.textSecondary}
                style={{ marginRight: wp(4) }}
              />
              <Text
                style={[
                  styles.toggleText,
                  role === 'CREATOR' && styles.toggleTextActive,
                ]}
              >
                Creator
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleSegment,
                role === 'USER' && styles.toggleSegmentActive,
              ]}
              onPress={() => setRole('USER')}
              activeOpacity={0.8}
            >
              <User
                size={fp(14)}
                color={role === 'USER' ? colors.gold : colors.textSecondary}
                style={{ marginRight: wp(4) }}
              />
              <Text
                style={[
                  styles.toggleText,
                  role === 'USER' && styles.toggleTextActive,
                ]}
              >
                Learner
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Please enter your full name' }}
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
                    <User
                      size={18}
                      color={colors.textMuted}
                      style={styles.fieldIconLeft}
                    />
                    <CustomTextInput
                      placeholder="Enter Full Name"
                      placeholderTextColor={colors.textMuted}
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      inputContainerStyle={styles.textInputContainer}
                      inputStyle={styles.textInput}
                    />
                  </View>
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            {/* Email Address */}
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

            {/* Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: 'Please enter a password',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
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

            {/* Phone Number */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <Controller
                name="phone"
                control={control}
                rules={{
                  required: 'Please enter your phone number',
                  pattern: {
                    value: /^\d{10}$/,
                    message: 'Please enter a valid 10-digit phone number',
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
                    <Phone
                      size={18}
                      color={colors.textMuted}
                      style={styles.fieldIconLeft}
                    />
                    <CustomTextInput
                      placeholder="Enter Phone Number"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
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
            {/* Continue CTA */}
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
                {loading ? 'Registering...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Social Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.75}>
              <Text style={styles.socialIconDots}>G</Text>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.75}>
              <Text style={styles.socialIconDots}>⊞</Text>
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation.navigate('LoginScreen')}
              >
                LOG IN
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: wp(24),
    paddingBottom: hp(24),
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(8),
    marginTop: hp(20),
    marginBottom: hp(4),
  },
  logoBadge: {
    width: wp(32),
    height: wp(32),
    borderRadius: 8,
    backgroundColor: colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    //marginBottom: hp(8),
  },
  logoText: {
    fontSize: fp(18),
    fontWeight: '700',
    color: colors.textPrimary,
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
    borderWidth: 1.5, // ← outlined, not filled
    borderColor: colors.gold, // ← gold border
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
  formSection: {
    marginBottom: hp(20),
  },
  inputWrapper: {
    marginBottom: hp(10),
  },
  inputLabel: {
    fontSize: fp(13),
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: hp(8),
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hp(50),
    backgroundColor: colors.inputBg,
    borderRadius: 12,
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
  primaryButton: {
    height: hp(50),
    backgroundColor: colors.gold,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(10),
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: fp(16),
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hp(20),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fp(11),
    fontWeight: '700',
    color: colors.textMuted,
    marginHorizontal: wp(10),
    letterSpacing: 0.8,
  },
  socialRow: {
    flexDirection: 'row',
    gap: wp(12),
    marginBottom: hp(24),
  },
  socialButton: {
    flex: 1,
    height: hp(46),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: wp(8),
  },
  socialButtonText: {
    color: '#c4d3ea',
    fontSize: fp(16),
    fontWeight: '900',
  },
  socialIconDots: {
    color: colors.textPrimary,
    fontSize: fp(16),
  },
  footer: {
    alignItems: 'center',
    marginBottom: hp(10),
  },
  footerText: {
    fontSize: fp(14),
    color: colors.textSecondary,
  },
  footerLink: {
    color: colors.gold,
    fontWeight: '700',
  },

  welcomeSection: {
    alignItems: 'center',
    marginBottom: hp(20),
    marginTop: hp(8),
  },
  welcomeText: {
    fontSize: fp(32),
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: hp(6),
  },
  welcomeSubtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(20),
  },
});
console.log()