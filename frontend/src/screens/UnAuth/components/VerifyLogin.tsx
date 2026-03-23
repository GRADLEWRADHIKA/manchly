import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import {
  checkAuthData,
  sendOtpEmail,
  sendOtpSms,
  verifyOtp,
} from '../../../store/UserSlice';
import Toast from 'react-native-toast-message';
import { OtpInput } from 'react-native-otp-entry';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFocusEffect } from '@react-navigation/native';
import NotificationService from '../../../services/NotificationService';

type VerifyLoginProps = {
  selectedType: string | null;
  setActive: (active: number) => void;
};

type FormValues = {
  phoneEmail: string;
  otp: string;
};

const VerifyLogin: React.FC<VerifyLoginProps> = ({
  selectedType,
  setActive,
}) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpData, setOtpData] = useState('');
  const [loginValue, setLoginValue] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      phoneEmail: '',
      otp: otpData || '',
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);
    setLoginValue(data.phoneEmail);

    const isPhoneNumber = /^\d+$/.test(data?.phoneEmail);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data?.phoneEmail);

    const payloadVerify = {
      email: isEmail ? data?.phoneEmail : '',
      phone: isPhoneNumber ? data?.phoneEmail : '',
    };

    dispatch(checkAuthData(payloadVerify))
      .unwrap()
      .then(response => {
        if (response?.data?.data?.exists) {
          const payload = {
            phone_number: isPhoneNumber ? data?.phoneEmail : '',
            email: isEmail ? data?.phoneEmail : '',
            purpose: 'login',
            tab: selectedType,
          };

          if (isPhoneNumber) {
            dispatch(sendOtpSms(payload))
              .unwrap()
              .then(res => {
                Toast.show({
                  type: 'success',
                  text1: `Login OTP is ${res?.data?.data?.otp}`,
                });
                setOtpData(res?.data?.data?.otp);
                setOtpSuccess(true);
                reset();
              })
              .finally(() => setLoading(false));
          } else if (isEmail) {
            dispatch(sendOtpEmail(payload))
              .unwrap()
              .then(res => {
                Toast.show({
                  type: 'success',
                  text1: `Login OTP is ${res?.data?.data?.otp}`,
                });
                setOtpData(res?.data?.data?.otp);
                setOtpSuccess(true);
                reset();
              })
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        } else {
          setActive(3);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  };

  const onOtpSubmit = async (data: any) => {
    setLoading(true);

    const isPhoneNumber = /^\d+$/.test(loginValue);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginValue);

    const fcmToken = await NotificationService.getToken();

    const payload = {
      email: isEmail ? loginValue : '',
      phone_number: isPhoneNumber ? loginValue : '',
      code: data?.otp,
      purpose: 'login',
      user_type: selectedType,
      fcm_token: fcmToken,
    };

    dispatch(verifyOtp(payload))
      .unwrap()
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'Login Successfully',
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
      .finally(() => setLoading(false));
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        setActive(1);
        return true;
      };

      // Add the listener and store the subscription
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      // Cleanup function
      return () => backHandler.remove();
    }, [setActive]), // Add setActive to dependencies
  );

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.container}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mainHeader}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subTitle}>Let’s Get Started</Text>
      </View>

      {otpSuccess ? (
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
      ) : (
        <Controller
          name="phoneEmail"
          control={control}
          rules={{
            required: {
              value: true,
              message: 'Please enter phone number or email address',
            },
            pattern: {
              value: /^(\d{10}|[^\s@]+@[^\s@]+\.[^\s@]+)$/,
              message:
                'Please enter a valid 10-digit phone number or email address',
            },
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="Enter phone number or email"
              placeholderTextColor={colors.white}
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          )}
        />
      )}

      <TouchableOpacity
        style={styles.btnHeader}
        onPress={
          otpSuccess ? handleSubmit(onOtpSubmit) : handleSubmit(onSubmit)
        }
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.btnHeaderText}>
            {otpSuccess ? 'Verify OTP' : 'Send Verification Code'}
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By continuing, you agree to our{' '}
        <Text style={styles.linkText}>Terms of Service</Text> and{' '}
        <Text style={styles.linkText}>Privacy Policy</Text>
      </Text>

      <TouchableOpacity
        onPress={() => setActive(3)}
        style={{ marginTop: hp(20), alignItems: 'center' }}
      >
        <Text style={{ color: colors.white }}>
          Didn't have an account?{' '}
          <Text style={{ color: colors.white, fontWeight: '600' }}>
            Create one now
          </Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default VerifyLogin;

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(50),
    paddingBottom: hp(40),
    paddingHorizontal: wp(20),
    flexGrow: 1,
  },

  mainHeader: {
    alignItems: 'center',
    marginBottom: hp(30),
  },

  title: {
    fontSize: fp(30),
    fontWeight: '600',
    color: colors.white,
  },

  subTitle: {
    fontSize: fp(16),
    marginTop: hp(5),
    color: colors.white,
  },

  input: {
    height: hp(55),
    borderWidth: wp(1.5),
    borderColor: '#ddd',
    borderRadius: wp(12),
    paddingHorizontal: wp(15),
    fontSize: fp(16),
    color: colors.white,
  },

  btnHeader: {
    borderWidth: wp(1),
    marginTop: hp(20),
    borderColor: colors.white,
    backgroundColor: colors.white,
    paddingVertical: hp(15),
    borderRadius: wp(12),
    alignItems: 'center',
  },

  btnHeaderText: {
    color: colors.primary,
    fontSize: fp(16),
    fontWeight: '600',
  },

  termsText: {
    fontSize: fp(14),
    color: colors.white,
    textAlign: 'center',
    marginTop: hp(20),
  },

  linkText: {
    color: colors.white,
    fontWeight: '600',
  },

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
});
