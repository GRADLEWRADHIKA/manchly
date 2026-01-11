import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
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
import { verifyOtp } from '../../store/UserSlice';

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
      <RNStatusBar barStyle="dark-content" backgroundColor="transparent" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Phone</Text>
        <View style={{ width: 40 }} />
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
          style={[
            styles.verifyButton,
            {
              backgroundColor:
                route?.params?.payload?.tab === 'USER'
                  ? colors.secPrimary
                  : colors.primary,
            },
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          )}
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
    padding: 16,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    // flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 120,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  userTypeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  userTypeValue: {
    fontWeight: '600',
    color: colors.text,
  },

  /* OTP */
  otpWrapper: {
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  otpText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
  },

  verifyButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  helpText: {
    marginTop: 20,
    fontSize: 14,
    color: colors.textSecondary,
  },
  demoCode: {
    fontWeight: '700',
    color: colors.primary,
  },
});
