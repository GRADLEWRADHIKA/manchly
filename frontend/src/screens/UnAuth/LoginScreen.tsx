import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../components/CustomInput';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { checkAuthData, sendOtpEmail, sendOtpSms } from '../../store/UserSlice';
import ChooseUserType from './ChooseUserType';
import TermsModal from '../../components/TermsModal';
import PrivacyModal from '../../components/PrivacyModal';
import RefundPolicyModal from '../../components/RefundPolicyModal';

const USER_TYPES = ['CREATOR', 'USER'] as const;
type UserType = (typeof USER_TYPES)[number];

const LoginScreen: React.FC = () => {
  const Nav = useNavigation<any>();
  const [userType, setUserType] = useState<UserType>('CREATOR');
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [buttonWidths, setButtonWidths] = useState<number[]>([0, 0]);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const [loading, setLoading] = useState(false);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => {
        subscription.remove();
      };
    }, []),
  );

  const onButtonLayout = (index: number) => (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setButtonWidths(prev => {
      const copy = [...prev];
      copy[index] = w;
      return copy;
    });
  };

  const titleByUserType = (type: UserType) =>
    type === 'CREATOR' ? 'Welcome Creator' : 'Welcome Back';

  const {
    control,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm({
    defaultValues: {
      phoneEmail: '',
    },
  });

  const onSubmit = (data: any) => {
    const identifier = (data?.phoneEmail ?? '').trim();
    if (identifier.length < 10) return;

    const isPhoneNumber = /^[6-9]\d{9}$/.test(identifier);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    if (!isPhoneNumber && !isEmail) return;

    const email = isEmail ? identifier.toLowerCase() : '';

    setLoading(true);

    const payloadVerify = {
      email: email,
      phone: isPhoneNumber ? identifier : '',
    };
    dispatch(checkAuthData(payloadVerify))
      .unwrap()
      .then(response => {
        if (response?.data?.data?.exists) {
          const payload = {
            phone_number: isPhoneNumber ? identifier : '',
            email: email,
            purpose: 'login',
            tab: userType,
          };

          if (isPhoneNumber) {
            dispatch(sendOtpSms(payload))
              .unwrap()
              .then(response => {
                Toast.show({
                  type: 'success',
                  text1: `Login OTP is ${response?.data?.data?.otp}`,
                  position: 'top',
                });
                reset();
                setLoading(false);
                Nav.navigate('OTPScreen', {
                  payload,
                  dummyOtp: response?.data?.data?.otp,
                });
              })
              .catch(error => {
              })
              .finally(() => {
                setLoading(false);
              });
          } else if (isEmail) {
            dispatch(sendOtpEmail(payload))
              .unwrap()
              .then(response => {
                Toast.show({
                  type: 'success',
                  text1: `Login OTP is ${response?.data?.data?.otp}`,
                  position: 'top',
                });
                reset();
                setLoading(false);
                Nav.navigate('OTPScreen', {
                  payload,
                  dummyOtp: response?.data?.data?.otp,
                });
              })
              .catch(error => {
              })
              .finally(() => {
                setLoading(false);
              });
          } else {
            setLoading(false);
          }
        } else {
          setOpenUserModal(true);
        }
      })
      .catch(error => {
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
    return;
  };

  const openModal = (type: string) => {
    Nav.navigate('SignupScreen', { type: type });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View>
            <Image
              source={require('../../image/Logo.jpg')}
              style={styles.logoContainer}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.tagline}>Create. Connect. Grow.</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.title}>{titleByUserType(userType)}</Text>
          <Text style={styles.subtitle}>
            Enter your phone number or email to get started
          </Text>

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
                    disabled={loading === true ? true : false}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        active && styles.segmentTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.indicator,
                  {
                    transform: [{ translateX: indicatorX }],
                    width:
                      buttonWidths.reduce(
                        (acc, w, i) => acc + (i === 0 ? w : 0),
                        0,
                      ) ||
                      buttonWidths[0] ||
                      0,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Controller
              name="phoneEmail"
              control={control}
              rules={{
                required: {
                  value: true,
                  message: 'Please enter phone number or email address',
                },
                pattern: {
                  value: /^([6-9]\d{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/,
                  message:
                    'Please enter a valid 10-digit phone number or email address',
                },
              }}
              render={({
                field: { onChange, onBlur, value },
                fieldState: { error },
              }) => (
                <CustomTextInput
                  inputContainerStyle={[
                    styles.nameFields,
                    {
                      borderColor: error ? 'red' : colors.borderColor,
                    },
                  ]}
                  inputStyle={{
                    fontSize: fp(16),
                    color: colors.black,
                  }}
                  placeholderTextColor={colors.borderColor}
                  placeholder="Enter Phone Number or Email"
                  keyboardType="email-address"
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              )}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.continueButton,
              styles.continueButtonActive,
              {
                backgroundColor:
                  userType === 'CREATOR' ? colors.primary : colors.secPrimary,
              },
            ]}
            onPress={handleSubmit(onSubmit)}
            activeOpacity={0.8}
            disabled={loading === true ? true : false}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} size={'small'} />
            ) : (
              <>
                <Text
                  style={[
                    styles.continueButtonText,
                    styles.continueButtonTextActive,
                  ]}
                >
                  Send OTP
                </Text>
                <ArrowRight size={20} color={colors.white} />
              </>
            )}
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
          <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
          <RefundPolicyModal visible={showRefund} onClose={() => setShowRefund(false)} />
        </View>

        <ChooseUserType
          visible={openUserModal}
          onClose={() => {
            setOpenUserModal(false);
          }}
          onConfirm={type => {
            openModal(type);
          }}
        />

        <View style={styles.featuresSection} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    // flex: 1,
    paddingHorizontal: wp(24),
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: hp(40),
  },
  logoContainer: {
    width: wp(100),
    height: wp(100),
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(12),
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logoText: {
    fontSize: fp(20),
    fontWeight: '700',
    color: colors.white,
  },
  tagline: {
    fontSize: fp(14),
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  formSection: {
    justifyContent: 'center',
    marginTop: hp(60),
  },
  title: {
    fontSize: fp(24),
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: hp(6),
  },
  subtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: hp(18),
  },
  segmentWrapper: {
    alignItems: 'center',
    marginBottom: hp(18),
  },
  segmentBackground: {
    width: '90%',
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: wp(12),
    overflow: 'hidden',
    position: 'relative',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: hp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: fp(14),
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
    borderRadius: wp(12),
    opacity: 0.12,
  },
  inputContainer: {
    marginBottom: hp(24),
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(12),
    paddingVertical: hp(14),
    marginBottom: hp(16),
  },
  continueButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: fp(16),
    fontWeight: '600',
    color: colors.muted,
    marginRight: wp(8),
  },
  continueButtonTextActive: {
    color: colors.white,
  },
  termsText: {
    fontSize: fp(13),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fp(18),
    marginBottom: hp(8),
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  signupTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(50),
  },
  dontHaveAccount: {
    fontSize: fp(14),
    color: colors.textSecondary,
  },
  createAccountText: {
    fontSize: fp(14),
    color: colors.primary,
    fontWeight: '600',
  },
  featuresSection: {
    paddingBottom: hp(30),
  },
  nameFields: {
    borderRadius: wp(12),
    paddingHorizontal: wp(10),
    height: hp(44),
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: wp(1),
    marginBottom: hp(20),
  },
  image: {},
});

export default LoginScreen;
