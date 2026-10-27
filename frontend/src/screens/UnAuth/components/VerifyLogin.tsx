import React, { useCallback, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Image,
} from 'react-native';
import colors from '../../../utils/colors';
import { wp, hp, fp } from '../../../utils/responsive';
import LinearGradient from 'react-native-linear-gradient';
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
import TermsModal from '../../../components/TermsModal';
import PrivacyModal from '../../../components/PrivacyModal';
import RefundPolicyModal from '../../../components/RefundPolicyModal';

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
  const isSubmittingRef = useRef(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
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
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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

          const handleOtpThunk = isPhoneNumber
            ? sendOtpSms
            : isEmail
            ? sendOtpEmail
            : null;

          if (handleOtpThunk) {
            dispatch(handleOtpThunk(payload))
              .unwrap()
              .then(res => {
                setOtpData(res?.data?.data?.otp);
                setOtpSuccess(true);
                reset();
              })
              .catch((err: any) => {
                if (err?.code === 'OTP_ALREADY_SENT') {
                  setOtpSuccess(true);
                  reset();
                }
              })
              .finally(() => {
                setLoading(false);
                isSubmittingRef.current = false;
              });
          } else {
            setLoading(false);
            isSubmittingRef.current = false;
          }
        } else {
          setActive(3);
          setLoading(false);
          isSubmittingRef.current = false;
        }
      })
      .catch(() => {
        setLoading(false);
        isSubmittingRef.current = false;
      });
  };

  const onOtpSubmit = async (data: any) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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
      .finally(() => {
        setLoading(false);
        isSubmittingRef.current = false;
      });
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
    <View style={styles.wrapper}>
      {/* Top Half - Image */}
      <View style={styles.topHalf}>
        <Image
          source={require('../../../image/boardingTight.jpg')}
          style={styles.heroImage}
          resizeMode="contain"
        />
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
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
                    focusColor={colors.golden}
                    theme={{
                      containerStyle: styles.otpWrapper,
                      pinCodeContainerStyle: [
                        styles.otpBox,
                        { borderColor: error ? 'red' : colors.golden },
                      ],
                      pinCodeTextStyle: styles.otpText,
                    }}
                  />
                  {error && (
                    <Text style={styles.errorText}>{error.message}</Text>
                  )}
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
                  placeholderTextColor="rgba(255,214,102,0.6)"
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
            activeOpacity={0.9}
            disabled={loading}
            onPress={
              otpSuccess ? handleSubmit(onOtpSubmit) : handleSubmit(onSubmit)
            }
          >
            <LinearGradient
              colors={['#F3C36B', '#D49A3D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnHeader}
            >
              {loading ? (
                <ActivityIndicator color={colors.black} />
              ) : (
                <Text style={styles.btnHeaderText}>
                  {otpSuccess ? 'Verify OTP' : 'Send Verification Code'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.linkText} onPress={() => setShowTerms(true)}>
              Terms of Service
            </Text>
            ,{' '}
            <Text style={styles.linkText} onPress={() => setShowPrivacy(true)}>
              Privacy Policy
            </Text>
            {' & '}
            <Text style={styles.linkText} onPress={() => setShowRefund(true)}>
              Refund Policy
            </Text>
          </Text>
          <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
          <PrivacyModal
            visible={showPrivacy}
            onClose={() => setShowPrivacy(false)}
          />
          <RefundPolicyModal
            visible={showRefund}
            onClose={() => setShowRefund(false)}
          />

          <TouchableOpacity
            onPress={() => setActive(3)}
            style={{ marginTop: hp(20), alignItems: 'center' }}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
              Didn't have an account?{' '}
              <Text style={{ color: colors.golden, fontWeight: '600' }}>
                Create one now
              </Text>
            </Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
};

export default VerifyLogin;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  topHalf: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  bottomSheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: wp(28),
    borderTopRightRadius: wp(28),
    flexShrink: 0,
  },

  container: {
    paddingTop: hp(32),
    paddingBottom: hp(30),
    paddingHorizontal: wp(24),
  },

  mainHeader: {
    alignItems: 'center',
    marginBottom: hp(24),
  },

  title: {
    fontSize: fp(26),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.2,
  },

  subTitle: {
    fontSize: fp(13),
    marginTop: hp(4),
    color: 'rgba(255,255,255,0.5)',
  },

  input: {
    height: hp(52),
    borderWidth: wp(1.5),
    borderColor: colors.golden,
    borderRadius: wp(14),
    paddingHorizontal: wp(16),
    fontSize: fp(14),
    color: colors.golden,
    backgroundColor: 'transparent',
  },

  btnHeader: {
    marginTop: hp(14),
    paddingVertical: hp(16),
    borderRadius: wp(14),
    alignItems: 'center',
    shadowColor: colors.golden,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },

  btnHeaderText: {
    color: colors.black,
    fontSize: fp(15),
    fontWeight: '700',
  },

  termsText: {
    fontSize: fp(11),
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: fp(17),
    marginTop: hp(20),
  },

  linkText: {
    color: colors.golden,
    fontWeight: '700',
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
    backgroundColor: 'transparent',
  },

  otpText: {
    fontSize: fp(20),
    fontWeight: '600',
    color: colors.golden,
  },

  errorText: {
    color: 'red',
    marginBottom: hp(12),
  },
});
