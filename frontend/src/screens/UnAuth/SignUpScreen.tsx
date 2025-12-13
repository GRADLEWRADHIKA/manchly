import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar as RNStatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import colors from '../../utils/colors';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';
import { signUp } from '../../store/UserSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';

const USER_TYPES = [
  { label: 'Creator', value: 'CREATOR' },
  { label: 'User', value: 'USER' },
];

const SignupScreen: React.FC = () => {
  const Nav = useNavigation<any>();
  const [userType, setUserType] = useState('Creator');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      userType: '',
    },
  });

  const onSubmit = (data: any) => {
    setLoading(true);
    const payload = {
      email: data?.email,
      phone: data?.phone,
      name: data?.name,
      user_type: data?.userType,
    };
    dispatch(signUp(payload))
      .unwrap()
      .then(response => {
        reset();
        Toast.show({
          type: 'success',
          text1: 'Account created successfully',
          position: 'bottom',
        });
        Nav.goBack();
        setLoading(false);
      })
      .catch(error => {
        console.log('error ------> ', error);
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Manchly today</Text>
        </View>

        {/* ===== Name Field ===== */}
        <Text style={styles.label}>Full Name</Text>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Please enter your name' }}
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <CustomTextInput
              placeholder="Enter Full Name"
              inputContainerStyle={[
                styles.input,
                { borderColor: error ? 'red' : colors.borderColor },
              ]}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        {/* ===== Email Field ===== */}
        <Text style={styles.label}>Email Address</Text>
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
            <CustomTextInput
              placeholder="Enter Email Address"
              keyboardType="email-address"
              inputContainerStyle={[
                styles.input,
                { borderColor: error ? 'red' : colors.borderColor },
              ]}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        {/* ===== Phone Field ===== */}
        <Text style={styles.label}>Phone Number</Text>
        <Controller
          name="phone"
          control={control}
          rules={{
            required: 'Please enter your phone number',
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'Phone number must be 10 digits',
            },
          }}
          render={({
            field: { onChange, onBlur, value },
            fieldState: { error },
          }) => (
            <CustomTextInput
              placeholder="Enter Phone Number"
              keyboardType="phone-pad"
              inputContainerStyle={[
                styles.input,
                { borderColor: error ? 'red' : colors.borderColor },
              ]}
              onChange={onChange}
              onBlur={onBlur}
              value={value}
            />
          )}
        />

        {/* ===== User Type Dropdown ===== */}
        <Text style={styles.label}>User Type</Text>
        <Controller
          control={control}
          name="userType"
          rules={{ required: 'Please select a user type' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <>
              <Dropdown
                style={[styles.dropdown, error && styles.errorBorder]}
                placeholderStyle={styles.placeholder}
                selectedTextStyle={styles.selectedText}
                containerStyle={{ borderRadius: 10 }}
                data={USER_TYPES}
                labelField="label"
                valueField="value"
                placeholder="Select User Type"
                value={value}
                onChange={item => {
                  setUserType(item.value);
                  onChange(item.value);
                }}
                renderItem={item => {
                  const isSelected = item.value === value;
                  return (
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        margin: 10,
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.white,
                        borderRadius: 5,
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected
                            ? colors.white
                            : colors.textSecondary,
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                  );
                }}
              />
            </>
          )}
        />

        {/* ===== Create Account Button ===== */}
        <TouchableOpacity
          style={[styles.continueButton, styles.continueButtonActive]}
          onPress={handleSubmit(onSubmit)}
          activeOpacity={0.8}
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
                Create Account
              </Text>
              <ArrowRight size={20} color={colors.white} />
            </>
          )}
        </TouchableOpacity>

        {/* ===== Terms Section ===== */}
        <Text style={styles.termsText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.linkText}>Terms of Service</Text> and{' '}
          <Text style={styles.linkText}>Privacy Policy</Text>.
        </Text>

        {/* ===== Login Link ===== */}
        <View style={styles.loginTextContainer}>
          <Text style={styles.alreadyAccount}>Already have an account? </Text>
          <TouchableOpacity onPress={() => Nav.navigate('LoginScreen')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
    backgroundColor: colors.white,
    borderWidth: 1,
    marginBottom: 4,
  },
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    marginBottom: 20,
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
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
  loginTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  alreadyAccount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  loginText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 8,
  },
  errorBorder: {
    borderColor: 'red',
  },
  placeholder: {
    fontSize: 14,
    color: colors.borderColor,
  },
  selectedText: {
    fontSize: 14,
    color: colors.text,
  },
});
