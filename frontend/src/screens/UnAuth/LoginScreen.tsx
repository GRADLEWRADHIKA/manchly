import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
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
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../components/CustomInput';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';
import { checkAuthData, sendOtpEmail, sendOtpSms } from '../../store/UserSlice';
import ChooseUserType from './ChooseUserType';

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
    formState: { errors },
  } = useForm({
    defaultValues: {
      phoneEmail: '',
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);

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
                console.log('SMS OTP error ------> ', JSON.stringify(error));
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
                console.log('Email OTP error ------> ', error);
              })
              .finally(() => {
                setLoading(false);
              });
          } else {
            console.log('Invalid input — not a valid email or phone number');
            setLoading(false);
          }
        } else {
          setOpenUserModal(true);
        }
      })
      .catch(error => {
        console.log(error);
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
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

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
                  value: /^(\d{10}|[^\s@]+@[^\s@]+\.[^\s@]+)$/,
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
                    fontSize: 16,
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
            <Text style={styles.linkText} onPress={() => {}}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={styles.linkText} onPress={() => {}}>
              Privacy Policy
            </Text>
          </Text>
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
    fontWeight: '500',
  },
  formSection: {
    justifyContent: 'center',
    marginTop: 60,
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
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '500',
  },
  signupTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  dontHaveAccount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  createAccountText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  featuresSection: {
    paddingBottom: 30,
  },
  nameFields: {
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    marginBottom: 20,
  },
  image: {},
});

export default LoginScreen;
