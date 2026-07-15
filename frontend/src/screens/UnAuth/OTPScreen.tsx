import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { OtpInput } from 'react-native-otp-entry';

import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { verifyOtp } from '../../store/UserSlice';
import LinearGradient from 'react-native-linear-gradient';

const OTPScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);

  const onBack = () => navigation.goBack();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);

    const payload = {
      email: route?.params?.payload?.email,
      phone_number: route?.params?.payload?.phone_number,
      code: route?.params?.dummyOtp,
      purpose: route?.params?.payload?.purpose,
      user_type: route?.params?.payload?.tab,
    };

    dispatch(verifyOtp(payload))
      .unwrap()
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'OTP Verified Successfully',
        });
        reset();
      })
      .catch(error => {
        Toast.show({
          type: 'error',
          text1: 'Verification Failed',
          text2: error?.message || 'Invalid OTP',
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Phone</Text>
        <View style={{ width: wp(40) }} />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Shield size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit code to your phone
        </Text>

        <Text style={styles.userTypeText}>
          Signing up as:{' '}
          <Text style={styles.userTypeValue}>
            {route?.params?.payload?.tab}
          </Text>
        </Text>

        {/* OTP INPUT */}
        <Controller
          control={control}
          name="otp"
          rules={{
            required: 'OTP is required',
            minLength: {
              value: 6,
              message: 'OTP must be 6 digits',
            },
          }}
          render={({ field: { onChange }, fieldState: { error } }) => (
            <>
              <OtpInput
                numberOfDigits={6}
                autoFocus
                keyboardType="numeric"
                onTextChange={onChange}
                focusColor={colors.primary}
                theme={{
                  containerStyle: styles.otpWrapper,
                  pinCodeContainerStyle: [
                    styles.otpBox,
                    { borderColor: error ? 'red' : colors.borderColor },
                  ],
                  pinCodeTextStyle: styles.otpText,
                }}
              />

              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </>
          )}
        />

       <TouchableOpacity
          style={styles.verifyButtonWrap}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F7D488', '#EBA83F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.verifyButton}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} />
            ) : (
              <Text style={styles.verifyButtonText}>Verify & Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          For demo use:{' '}
          <Text style={styles.demoCode}>{route?.params?.dummyOtp}</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default OTPScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: wp(16),
  },
  backButton: {
    padding: wp(6),
  },
  headerTitle: {
    fontSize: fp(18),
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    // flex: 1,
    paddingHorizontal: wp(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(120),
  },
  iconContainer: {
    width: wp(80),
    height: wp(80),
    borderRadius: wp(40),
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(32),
  },
  title: {
    fontSize: fp(24),
    fontWeight: '700',
    color: colors.text,
    marginBottom: hp(8),
  },
  subtitle: {
    fontSize: fp(16),
    color: colors.textSecondary,
    marginBottom: hp(24),
    textAlign: 'center',
  },
  userTypeText: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginBottom: hp(16),
  },
  userTypeValue: {
    fontWeight: '600',
    color: colors.text,
  },

  /* OTP */
  otpWrapper: {
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: hp(16),
  },
  otpBox: {
    width: wp(48),
    height: hp(56),
    borderWidth: wp(1),
    borderRadius: wp(10),
    backgroundColor: colors.white,
  },
  otpText: {
    fontSize: fp(20),
    fontWeight: '600',
    color: colors.text,
  },
  errorText: {
    color: 'red',
    marginBottom: hp(12),
  },

 verifyButtonWrap: {
    width: '100%',
    borderRadius: wp(12),
    marginTop: hp(12),
  },
  verifyButton: {
    paddingVertical: hp(16),
    borderRadius: wp(12),
    alignItems: 'center',
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: fp(16),
    fontWeight: '600',
  },

  helpText: {
    marginTop: hp(20),
    fontSize: fp(14),
    color: colors.textSecondary,
  },
  demoCode: {
    fontWeight: '700',
    color: colors.primary,
  },
});
