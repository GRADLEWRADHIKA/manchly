import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowRight } from 'lucide-react-native';
import colors from '../../utils/colors';
import { wp, hp, fp } from '../../utils/responsive';
import { Controller, useForm } from 'react-hook-form';
import CustomTextInput from '../../components/CustomInput';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { signUp } from '../../store/UserSlice';
import { ThunkDispatch } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import TermsModal from '../../components/TermsModal';
import PrivacyModal from '../../components/PrivacyModal';
import RefundPolicyModal from '../../components/RefundPolicyModal';

const USER_TYPES = [
  { label: 'Creator', value: 'CREATOR' },
  { label: 'User', value: 'USER' },
];

const SignupScreen: React.FC = () => {
  const Nav = useNavigation<any>();
  // const [userType, setUserType] = useState('Creator');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dispatch = useDispatch<ThunkDispatch<any, any, any>>();
  const route = useRoute();
  const userType = route?.params?.type;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      dob: new Date(),
    },
  });

  const dob = watch('dob');

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateForAPI = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setValue('dob', selectedDate);
    }
  };

  const onSubmit = (data: any) => {
    setLoading(true);
    const payload = {
      email: data?.email,
      phone: data?.phone,
      name: data?.name,
      dob: formatDateForAPI(data?.dob),
      user_type: userType,
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
      })
      .finally(() => {
        setLoading(false);
      });
  };


  return (
    <SafeAreaView style={styles.container}>
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

        <Text style={styles.label}>Date of Birth</Text>
        <Controller
          name="dob"
          control={control}
          rules={{
            required: 'Please select your date of birth',
            validate: (value) => {
              const today = new Date();
              const age = today.getFullYear() - value.getFullYear();
              const monthDiff = today.getMonth() - value.getMonth();
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < value.getDate())) {
                return age - 1 >= 18 ? true : 'You must be at least 18 years old';
              }
              return age >= 18 ? true : 'You must be at least 18 years old';
            },
          }}
          render={({ field: { value }, fieldState: { error } }) => (
            <>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  { borderColor: error ? 'red' : colors.borderColor },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[styles.datePickerText, !value && styles.placeholderText]}>
                  {value ? formatDate(value) : 'Select Date of Birth (DD/MM/YYYY)'}
                </Text>
              </TouchableOpacity>
              {error && <Text style={styles.errorText}>{error.message}</Text>}
              {showDatePicker && (
                <DateTimePicker
                  value={value || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
            </>
          )}
        />

        {/* ===== User Type Dropdown ===== */}
        {/* <Text style={styles.label}>User Type</Text>
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
        /> */}

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
          <Text style={styles.linkText} onPress={() => setShowTerms(true)}>Terms of Service</Text>,{' '}
          <Text style={styles.linkText} onPress={() => setShowPrivacy(true)}>Privacy Policy</Text>
          {' & '}
          <Text style={styles.linkText} onPress={() => setShowRefund(true)}>Refund Policy</Text>.
        </Text>
        <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
        <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
        <RefundPolicyModal visible={showRefund} onClose={() => setShowRefund(false)} />

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
    paddingHorizontal: wp(24),
    paddingVertical: hp(30),
  },
  header: {
    alignItems: 'center',
    marginBottom: hp(24),
  },
  title: {
    fontSize: fp(24),
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: fp(14),
    color: colors.textSecondary,
    marginTop: hp(4),
  },
  label: {
    fontSize: fp(14),
    fontWeight: '500',
    color: colors.text,
    marginBottom: hp(6),
    marginTop: hp(10),
  },
  input: {
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    height: hp(44),
    backgroundColor: colors.white,
    borderWidth: wp(1),
    marginBottom: hp(4),
  },
  dropdown: {
    height: hp(44),
    borderWidth: wp(1),
    borderColor: colors.borderColor,
    borderRadius: wp(8),
    paddingHorizontal: wp(20),
    justifyContent: 'center',
    marginBottom: hp(20),
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(12),
    paddingVertical: hp(14),
    marginTop: hp(10),
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
  loginTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(30),
  },
  alreadyAccount: {
    fontSize: fp(14),
    color: colors.textSecondary,
  },
  loginText: {
    fontSize: fp(14),
    color: colors.primary,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: fp(12),
    marginBottom: hp(8),
  },
  errorBorder: {
    borderColor: 'red',
  },
  placeholder: {
    fontSize: fp(14),
    color: colors.borderColor,
  },
  selectedText: {
    fontSize: fp(14),
    color: colors.text,
  },
  datePickerButton: {
    height: hp(44),
    borderWidth: wp(1),
    borderRadius: wp(8),
    paddingHorizontal: wp(10),
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginBottom: hp(4),
  },
  datePickerText: {
    fontSize: fp(14),
    color: colors.text,
  },
  placeholderText: {
    color: colors.borderColor,
  },
});
console.log()