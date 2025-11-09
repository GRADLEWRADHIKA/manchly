import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Shield } from 'lucide-react-native';
import colors from '../../utils/colors';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../components/CustomInput';
import { verifyOtp } from '../../store/UserSlice';
import { useDispatch } from 'react-redux';
import { ThunkDispatch } from '@reduxjs/toolkit';
import Toast from 'react-native-toast-message';

const OTPScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  // const dispatch = useAppDispatch();
  // const { error } = useAppSelector(s => s.auth);
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const userTypeFromRoute = (route?.params as any)?.userType ?? null;
  const onBack = () => navigation.goBack();

  // console.log('----route-----', route?.params?.payload);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      otp: route?.params?.dummyOtp,
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);
    const payload = {
      email: route?.params?.payload?.email,
      phone_number: route?.params?.payload?.phone_number,
      code: route?.params?.dummyOtp,
      purpose: route?.params?.payload?.purpose,
    };
    dispatch(verifyOtp(payload))
      .unwrap()
      .then(response => {
        reset();
        // Toast.show({
        //   type: 'success',
        //   text1: 'Login s',
        //   position: 'bottom',
        // });
        setLoading(false);
      })
      .catch(error => {
        console.log(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <RNStatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={false}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Phone</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Shield size={48} color={colors.primary} />
        </View>

        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>We've sent a 6-digit code to{'\n'}</Text>

        <Text style={{ marginBottom: 12, color: colors.textSecondary }}>
          Signing up as:{' '}
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {route?.params?.payload?.tab}
          </Text>
        </Text>

        <View style={styles.otpContainer}>
          <Controller
            name="otp"
            control={control}
            rules={{
              required: {
                value: true,
                message: 'OTP is required',
              },
              pattern: {
                value: /^[0-9]{6}$/,
                message: 'OTP must be exactly 6 digits',
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
                placeholder="Enter OTP"
                keyboardType="numeric"
                maxLength={68}
                onChange={text => onChange(text.replace(/[^0-9]/g, ''))}
                onBlur={onBlur}
                value={value}
              />
            )}
          />
        </View>

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
          activeOpacity={0.8}
          disabled={loading === true ? true : false}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size={'small'} />
          ) : (
            <Text
              style={[styles.verifyButtonText, styles.verifyButtonTextActive]}
            >
              Verify & Continue
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.helpSection}>
          <Text style={styles.helpText}>
            For demo purposes, use{' '}
            <Text style={styles.demoCode}>{route?.params?.dummyOtp}</Text>
          </Text>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={() => console.log('Resend OTP (placeholder)')}
          >
            <Text style={styles.resendText}>Didn't receive code? Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  phoneNumber: {
    fontWeight: '600',
    color: colors.text,
  },
  otpContainer: {
    width: '100%',
    marginBottom: 32,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    color: colors.text,
    fontWeight: '600',
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  verifyButton: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonActive: {
    // backgroundColor: colors.primary,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.muted,
  },
  verifyButtonTextActive: {
    color: '#ffffff',
  },
  helpSection: {
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  demoCode: {
    fontWeight: '700',
    color: colors.primary,
  },
  resendButton: { padding: 8 },
  resendText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  savedNote: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  nameFields: {
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    width: '100%',
    backgroundColor: colors.lightGrey,
    borderWidth: 1,
    marginBottom: 20,
  },
});

export default OTPScreen;
